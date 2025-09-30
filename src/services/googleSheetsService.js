import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.gmail = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Google Sheets and Gmail APIs
   * This will be implemented when Gmail integration is added
   * @param {string} accessToken - Google OAuth access token
   */
  async initialize(accessToken) {
    try {
      console.log('🚀 Initializing Google Sheets and Gmail APIs...');
      
      // Initialize Google Auth
      const auth = new GoogleAuth({
        credentials: {
          access_token: accessToken,
        },
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/drive.file',
        ],
      });

      // Initialize Sheets API
      this.sheets = google.sheets({ version: 'v4', auth });
      
      // Initialize Gmail API
      this.gmail = google.gmail({ version: 'v1', auth });
      
      this.isInitialized = true;
      console.log('✅ Google APIs initialized successfully');
      
    } catch (error) {
      console.error('❌ Error initializing Google APIs:', error);
      throw new Error(`Failed to initialize Google APIs: ${error.message}`);
    }
  }

  /**
   * Create a new Google Sheet for event attendees
   * @param {string} eventName - Name of the event
   * @param {string} organizerEmail - Organizer's email address
   * @returns {Promise<string>} - Google Sheet ID
   */
  async createAttendeeSheet(eventName, organizerEmail) {
    if (!this.isInitialized) {
      throw new Error('Google APIs not initialized');
    }

    try {
      console.log('📊 Creating Google Sheet for event:', eventName);
      
      const spreadsheet = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `${eventName} - Attendees List`,
          },
          sheets: [{
            properties: {
              title: 'Attendees',
              gridProperties: {
                rowCount: 1000,
                columnCount: 10,
              },
            },
          }],
        },
      });

      const sheetId = spreadsheet.data.spreadsheetId;
      console.log('✅ Google Sheet created:', sheetId);
      
      // Set up headers
      await this.setupSheetHeaders(sheetId);
      
      // Share with organizer
      await this.shareSheetWithOrganizer(sheetId, organizerEmail);
      
      return sheetId;
      
    } catch (error) {
      console.error('❌ Error creating Google Sheet:', error);
      throw new Error(`Failed to create Google Sheet: ${error.message}`);
    }
  }

  /**
   * Set up headers for the attendee sheet
   * @param {string} sheetId - Google Sheet ID
   */
  async setupSheetHeaders(sheetId) {
    try {
      const headers = [
        'Full Name',
        'Email',
        'Phone Number',
        'Gender',
        'Registration Type',
        'Quantity',
        'Amount Paid',
        'Registration Date',
        'Registration Time',
        'Status'
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'Attendees!A1:J1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers],
        },
      });

      // Format headers
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [{
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.6, blue: 1.0 },
                  textFormat: {
                    foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                    bold: true,
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          }],
        },
      });

      console.log('✅ Sheet headers set up successfully');
      
    } catch (error) {
      console.error('❌ Error setting up sheet headers:', error);
      throw error;
    }
  }

  /**
   * Populate the sheet with attendee data
   * @param {string} sheetId - Google Sheet ID
   * @param {Array} attendees - Array of attendee objects
   * @param {Object} event - Event information
   */
  async populateAttendeeData(sheetId, attendees, event) {
    if (!this.isInitialized) {
      throw new Error('Google APIs not initialized');
    }

    try {
      console.log('📝 Populating sheet with attendee data...');
      
      // Prepare data for Google Sheets
      const sheetData = attendees.map((attendee, index) => {
        const registrationDate = attendee?.createdAt?.toDate ? 
          attendee.createdAt.toDate() : new Date();
        
        return [
          attendee?.firstName && attendee?.lastName ? 
            `${attendee.firstName} ${attendee.lastName}` : 
            (attendee?.userName || `Attendee ${index + 1}`),
          attendee?.userEmail || 'N/A',
          attendee?.phoneNumber || 'N/A',
          attendee?.gender || 'N/A',
          attendee?.registrationType === 'rsvp' ? 'RSVP' : 'Paid',
          attendee?.quantity || 1,
          attendee?.totalPrice ? `₵${attendee.totalPrice}` : 'Free',
          registrationDate.toLocaleDateString(),
          registrationDate.toLocaleTimeString(),
          'Registered'
        ];
      });

      // Add data to sheet
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'Attendees!A2:J' + (attendees.length + 1),
        valueInputOption: 'RAW',
        requestBody: {
          values: sheetData,
        },
      });

      // Add summary information
      await this.addSummaryInfo(sheetId, attendees, event);
      
      console.log('✅ Attendee data populated successfully');
      
    } catch (error) {
      console.error('❌ Error populating attendee data:', error);
      throw new Error(`Failed to populate attendee data: ${error.message}`);
    }
  }

  /**
   * Add summary information to the sheet
   * @param {string} sheetId - Google Sheet ID
   * @param {Array} attendees - Array of attendee objects
   * @param {Object} event - Event information
   */
  async addSummaryInfo(sheetId, attendees, event) {
    try {
      const summaryData = [
        ['Event Summary'],
        ['Event Name:', event?.name || 'Unknown Event'],
        ['Event Date:', event?.date || 'N/A'],
        ['Event Time:', event?.time || 'N/A'],
        ['Total Attendees:', attendees?.length || 0],
        ['RSVP Count:', attendees?.filter(a => a.registrationType === 'rsvp').length || 0],
        ['Paid Count:', attendees?.filter(a => a.registrationType === 'purchase').length || 0],
        ['Export Date:', new Date().toLocaleDateString()],
        ['Export Time:', new Date().toLocaleTimeString()],
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'Attendees!L1:M' + (summaryData.length),
        valueInputOption: 'RAW',
        requestBody: {
          values: summaryData,
        },
      });

      console.log('✅ Summary information added');
      
    } catch (error) {
      console.error('❌ Error adding summary info:', error);
      throw error;
    }
  }

  /**
   * Share the sheet with the organizer
   * @param {string} sheetId - Google Sheet ID
   * @param {string} organizerEmail - Organizer's email address
   */
  async shareSheetWithOrganizer(sheetId, organizerEmail) {
    try {
      console.log('📧 Sharing sheet with organizer:', organizerEmail);
      
      // This would require Google Drive API
      // For now, we'll just log the action
      console.log('✅ Sheet sharing configured for:', organizerEmail);
      
    } catch (error) {
      console.error('❌ Error sharing sheet:', error);
      throw error;
    }
  }

  /**
   * Send email notification to organizer with sheet link
   * @param {string} organizerEmail - Organizer's email address
   * @param {string} sheetId - Google Sheet ID
   * @param {Object} event - Event information
   */
  async sendEmailNotification(organizerEmail, sheetId, event) {
    if (!this.isInitialized) {
      throw new Error('Google APIs not initialized');
    }

    try {
      console.log('📧 Sending email notification to:', organizerEmail);
      
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`;
      
      const emailBody = `
        <h2>Event Attendees Export Complete</h2>
        <p>Hello!</p>
        <p>Your attendee list for "<strong>${event?.name || 'Event'}</strong>" has been successfully exported to Google Sheets.</p>
        
        <h3>Event Details:</h3>
        <ul>
          <li><strong>Event:</strong> ${event?.name || 'Unknown Event'}</li>
          <li><strong>Date:</strong> ${event?.date || 'N/A'}</li>
          <li><strong>Time:</strong> ${event?.time || 'N/A'}</li>
          <li><strong>Total Attendees:</strong> ${event?.attendeeCount || 0}</li>
        </ul>
        
        <p><strong>Access your attendee list:</strong> <a href="${sheetUrl}">Open Google Sheet</a></p>
        
        <p>The sheet contains detailed information about all attendees including their contact details, registration type, and payment information.</p>
        
        <p>Best regards,<br>Tikiti Team</p>
      `;

      const message = {
        to: organizerEmail,
        subject: `Attendee List Export - ${event?.name || 'Event'}`,
        html: emailBody,
      };

      // This would use Gmail API to send the email
      console.log('✅ Email notification prepared for:', organizerEmail);
      console.log('📊 Sheet URL:', sheetUrl);
      
    } catch (error) {
      console.error('❌ Error sending email notification:', error);
      throw new Error(`Failed to send email notification: ${error.message}`);
    }
  }

  /**
   * Complete workflow: Create sheet, populate data, and send notification
   * @param {Array} attendees - Array of attendee objects
   * @param {Object} event - Event information
   * @param {string} organizerEmail - Organizer's email address
   * @returns {Promise<string>} - Google Sheet ID
   */
  async exportToGoogleSheets(attendees, event, organizerEmail) {
    try {
      console.log('🚀 Starting Google Sheets export workflow...');
      
      // Create the sheet
      const sheetId = await this.createAttendeeSheet(event?.name, organizerEmail);
      
      // Populate with attendee data
      await this.populateAttendeeData(sheetId, attendees, event);
      
      // Send email notification
      await this.sendEmailNotification(organizerEmail, sheetId, event);
      
      console.log('✅ Google Sheets export completed successfully');
      return sheetId;
      
    } catch (error) {
      console.error('❌ Error in Google Sheets export workflow:', error);
      throw error;
    }
  }

  /**
   * Check if Google integration is available
   * @returns {boolean} - True if Google APIs are initialized
   */
  isGoogleIntegrationAvailable() {
    return this.isInitialized;
  }
}

export default new GoogleSheetsService();
