import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

class PDFExportService {
  /**
   * Export attendees data to PDF format
   * @param {Array} attendees - Array of attendee objects
   * @param {Object} event - Event object with name and details
   * @returns {Promise<string>} - File URI of the exported PDF file
   */
  async exportAttendeesToPDF(attendees, event) {
    try {
      console.log('📄 Starting PDF export for event:', event?.name);
      console.log('👥 Attendees count:', attendees?.length || 0);
      console.log('📱 Platform:', Platform.OS);

      // Generate HTML content for PDF
      const htmlContent = this.generateHTMLContent(attendees, event);
      console.log('📋 HTML content generated');

      // Create PDF from HTML
      console.log('🔄 Creating PDF...');
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });
      console.log('✅ PDF created successfully:', uri);

      return uri;
    } catch (error) {
      console.error('❌ Error creating PDF:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error details:', {
        message: error.message,
        name: error.name,
        code: error.code
      });
      throw new Error(`Failed to create PDF: ${error.message}`);
    }
  }

  /**
   * Generate HTML content for PDF
   * @param {Array} attendees - Raw attendees data
   * @param {Object} event - Event information
   * @returns {string} - HTML content
   */
  generateHTMLContent(attendees, event) {
    const eventName = event?.name || 'Unknown Event';
    const eventDate = event?.date || 'N/A';
    const eventTime = event?.time || 'N/A';
    const exportDate = new Date().toLocaleDateString();
    const exportTime = new Date().toLocaleTimeString();

    // Generate attendee rows
    const attendeeRows = attendees?.map((attendee, index) => {
      const fullName = attendee?.firstName && attendee?.lastName ? 
        `${attendee.firstName} ${attendee.lastName}` : 
        (attendee?.userName || `Attendee ${index + 1}`);
      
      const registrationDate = attendee?.createdAt?.toDate ? 
        attendee.createdAt.toDate() : new Date();
      
      // Debug logging
      console.log(`📋 Attendee ${index + 1}:`, {
        name: fullName,
        email: attendee?.userEmail,
        phone: attendee?.phoneNumber,
        gender: attendee?.gender,
        registrationType: attendee?.registrationType
      });
      
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${fullName}</td>
          <td>${attendee?.userEmail || 'N/A'}</td>
          <td>${attendee?.phoneNumber || 'N/A'}</td>
          <td>${attendee?.gender || 'N/A'}</td>
          <td>${attendee?.registrationType === 'rsvp' ? 'RSVP' : 'Paid'}</td>
          <td>${attendee?.quantity || 1}</td>
          <td>${attendee?.totalPrice ? `₵${attendee.totalPrice}` : 'Free'}</td>
          <td>${registrationDate.toLocaleDateString()}</td>
          <td>${registrationDate.toLocaleTimeString()}</td>
        </tr>
      `;
    }).join('') || '<tr><td colspan="10">No attendees found</td></tr>';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${eventName} - Attendees List</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
            color: #333333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #ff6b35;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #ff6b35;
            font-size: 28px;
            margin: 0 0 10px 0;
            font-weight: bold;
          }
          .header h2 {
            color: #666666;
            font-size: 18px;
            margin: 0;
            font-weight: normal;
          }
          .event-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-left: 4px solid #ff6b35;
          }
          .event-info h3 {
            color: #ff6b35;
            margin: 0 0 10px 0;
            font-size: 16px;
          }
          .event-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 14px;
          }
          .event-details div {
            display: flex;
            justify-content: space-between;
          }
          .event-details strong {
            color: #333333;
          }
          .event-details span {
            color: #666666;
          }
          .summary {
            background-color: #e8f4fd;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-left: 4px solid #2196f3;
          }
          .summary h3 {
            color: #2196f3;
            margin: 0 0 10px 0;
            font-size: 16px;
          }
          .summary-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            font-size: 14px;
          }
          .stat-item {
            text-align: center;
            padding: 10px;
            background-color: #ffffff;
            border-radius: 6px;
            border: 1px solid #e0e0e0;
          }
          .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #ff6b35;
            display: block;
          }
          .stat-label {
            color: #666666;
            font-size: 12px;
            margin-top: 5px;
          }
          .attendees-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
          }
          .attendees-table th {
            background-color: #ff6b35;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 13px;
          }
          .attendees-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #e0e0e0;
            vertical-align: top;
          }
          .attendees-table tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          .attendees-table tr:hover {
            background-color: #fff3f0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            color: #666666;
            font-size: 12px;
          }
          .footer p {
            margin: 5px 0;
          }
          @media print {
            body { margin: 0; padding: 10px; }
            .header { page-break-after: avoid; }
            .attendees-table { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${eventName}</h1>
          <h2>Attendees List</h2>
        </div>

        <div class="event-info">
          <h3>Event Information</h3>
          <div class="event-details">
            <div><strong>Event Name:</strong> <span>${eventName}</span></div>
            <div><strong>Event Date:</strong> <span>${eventDate}</span></div>
            <div><strong>Event Time:</strong> <span>${eventTime}</span></div>
            <div><strong>Export Date:</strong> <span>${exportDate}</span></div>
            <div><strong>Export Time:</strong> <span>${exportTime}</span></div>
            <div><strong>Total Attendees:</strong> <span>${attendees?.length || 0}</span></div>
          </div>
        </div>

        <div class="summary">
          <h3>Summary Statistics</h3>
          <div class="summary-stats">
            <div class="stat-item">
              <span class="stat-number">${attendees?.length || 0}</span>
              <div class="stat-label">Total Attendees</div>
            </div>
            <div class="stat-item">
              <span class="stat-number">${attendees?.filter(a => a.registrationType === 'rsvp').length || 0}</span>
              <div class="stat-label">RSVP</div>
            </div>
            <div class="stat-item">
              <span class="stat-number">${attendees?.filter(a => a.registrationType !== 'rsvp').length || 0}</span>
              <div class="stat-label">Paid</div>
            </div>
          </div>
        </div>

        <table class="attendees-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Gender</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            ${attendeeRows}
          </tbody>
        </table>

        <div class="footer">
          <p><strong>Generated by Tikiti Event Management</strong></p>
          <p>This report was generated on ${exportDate} at ${exportTime}</p>
          <p>For support, contact your event organizer</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Share the exported PDF file
   * @param {string} fileUri - URI of the PDF file
   * @param {string} filename - Name of the file
   */
  async sharePDFFile(fileUri, filename) {
    try {
      console.log('📤 Sharing PDF file:', filename);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${filename}`,
        });
        console.log('✅ PDF file shared successfully');
      } else {
        console.log('⚠️ Sharing not available on this platform');
        throw new Error('Sharing not available on this platform');
      }
    } catch (error) {
      console.error('❌ Error sharing PDF file:', error);
      throw new Error(`Failed to share PDF file: ${error.message}`);
    }
  }

  /**
   * Export and share attendees as PDF
   * @param {Array} attendees - Attendees data
   * @param {Object} event - Event information
   */
  async exportAndShareAttendees(attendees, event) {
    try {
      const fileUri = await this.exportAttendeesToPDF(attendees, event);
      const filename = `${event?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Event'}_Attendees_${new Date().toISOString().split('T')[0]}.pdf`;
      await this.sharePDFFile(fileUri, filename);
      return fileUri;
    } catch (error) {
      console.error('❌ Error in PDF export and share process:', error);
      throw error;
    }
  }
}

export default new PDFExportService();
