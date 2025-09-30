import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

class ExcelExportService {
  /**
   * Export attendees data to Excel format
   * @param {Array} attendees - Array of attendee objects
   * @param {Object} event - Event object with name and details
   * @returns {Promise<string>} - File URI of the exported Excel file
   */
  async exportAttendeesToExcel(attendees, event) {
    try {
      console.log('📊 Starting Excel export for event:', event?.name);
      console.log('👥 Attendees count:', attendees?.length || 0);
      console.log('📱 Platform:', Platform.OS);

      // Prepare data for Excel
      const excelData = this.prepareAttendeeData(attendees, event);
      console.log('📋 Excel data prepared, rows:', excelData.length);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      console.log('📚 Workbook created');
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      console.log('📄 Worksheet created');
      
      // Set column widths
      const columnWidths = [
        { wch: 20 }, // Name
        { wch: 30 }, // Email
        { wch: 15 }, // Phone
        { wch: 10 }, // Gender
        { wch: 10 }, // Type
        { wch: 8 },  // Quantity
        { wch: 12 }, // Amount
        { wch: 20 }, // Registration Date
        { wch: 20 }, // Registration Time
      ];
      worksheet['!cols'] = columnWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendees');
      console.log('📊 Worksheet added to workbook');
      
      // Create filename
      const eventName = event?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Event';
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${eventName}_Attendees_${timestamp}.xlsx`;
      console.log('📁 Filename:', filename);
      
      // Generate Excel file as array buffer
      console.log('🔄 Generating Excel file as array buffer...');
      const excelArrayBuffer = XLSX.write(workbook, { 
        type: 'array', 
        bookType: 'xlsx',
        compression: true 
      });
      console.log('✅ Excel array buffer generated, length:', excelArrayBuffer?.length || 0);
      
      // Convert array buffer to base64 manually
      console.log('🔄 Converting array buffer to base64...');
      const base64String = this.arrayBufferToBase64(excelArrayBuffer);
      console.log('✅ Base64 conversion complete, length:', base64String?.length || 0);
      
      // Get file path
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      console.log('📂 File URI:', fileUri);
      
      // Write file with base64 string
      console.log('💾 Writing file...');
      await FileSystem.writeAsStringAsync(fileUri, base64String, {
        encoding: 'base64',
      });
      
      console.log('✅ Excel file created successfully:', fileUri);
      return fileUri;
      
    } catch (error) {
      console.error('❌ Error creating Excel file:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error details:', {
        message: error.message,
        name: error.name,
        code: error.code
      });
      throw new Error(`Failed to create Excel file: ${error.message}`);
    }
  }

  /**
   * Convert array buffer to base64 string
   * @param {ArrayBuffer} buffer - Array buffer to convert
   * @returns {string} - Base64 string
   */
  arrayBufferToBase64(buffer) {
    try {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      
      // Use a simple base64 encoding
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let result = '';
      let i = 0;
      
      while (i < binary.length) {
        const a = binary.charCodeAt(i++);
        const b = i < binary.length ? binary.charCodeAt(i++) : 0;
        const c = i < binary.length ? binary.charCodeAt(i++) : 0;
        
        const bitmap = (a << 16) | (b << 8) | c;
        
        result += chars.charAt((bitmap >> 18) & 63);
        result += chars.charAt((bitmap >> 12) & 63);
        result += i - 2 < binary.length ? chars.charAt((bitmap >> 6) & 63) : '=';
        result += i - 1 < binary.length ? chars.charAt(bitmap & 63) : '=';
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error converting array buffer to base64:', error);
      throw new Error('Failed to convert to base64');
    }
  }

  /**
   * Prepare attendee data for Excel export
   * @param {Array} attendees - Raw attendees data
   * @param {Object} event - Event information
   * @returns {Array} - Formatted data for Excel
   */
  prepareAttendeeData(attendees, event) {
    const excelData = [];
    
    // Add header row with event information
    excelData.push({
      'Event Name': event?.name || 'Unknown Event',
      'Event Date': event?.date || 'N/A',
      'Event Time': event?.time || 'N/A',
      'Total Attendees': attendees?.length || 0,
      'Export Date': new Date().toLocaleDateString(),
      'Export Time': new Date().toLocaleTimeString(),
    });
    
    // Add empty row for spacing
    excelData.push({});
    
    // Add column headers
    excelData.push({
      'Full Name': 'Full Name',
      'Email': 'Email',
      'Phone Number': 'Phone Number',
      'Gender': 'Gender',
      'Registration Type': 'Registration Type',
      'Quantity': 'Quantity',
      'Amount Paid': 'Amount Paid',
      'Registration Date': 'Registration Date',
      'Registration Time': 'Registration Time',
    });
    
    // Add attendee data
    attendees?.forEach((attendee, index) => {
      const registrationDate = attendee?.createdAt?.toDate ? 
        attendee.createdAt.toDate() : new Date();
      
      excelData.push({
        'Full Name': attendee?.firstName && attendee?.lastName ? 
          `${attendee.firstName} ${attendee.lastName}` : 
          (attendee?.userName || `Attendee ${index + 1}`),
        'Email': attendee?.userEmail || 'N/A',
        'Phone Number': attendee?.phoneNumber || 'N/A',
        'Gender': attendee?.gender || 'N/A',
        'Registration Type': attendee?.registrationType === 'rsvp' ? 'RSVP' : 'Paid',
        'Quantity': attendee?.quantity || 1,
        'Amount Paid': attendee?.totalPrice ? `₵${attendee.totalPrice}` : 'Free',
        'Registration Date': registrationDate.toLocaleDateString(),
        'Registration Time': registrationDate.toLocaleTimeString(),
      });
    });
    
    return excelData;
  }

  /**
   * Share the exported Excel file
   * @param {string} fileUri - URI of the Excel file
   * @param {string} filename - Name of the file
   */
  async shareExcelFile(fileUri, filename) {
    try {
      console.log('📤 Sharing Excel file:', filename);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: `Share ${filename}`,
        });
        console.log('✅ Excel file shared successfully');
      } else {
        console.log('⚠️ Sharing not available on this platform');
        throw new Error('Sharing not available on this platform');
      }
    } catch (error) {
      console.error('❌ Error sharing Excel file:', error);
      throw new Error(`Failed to share Excel file: ${error.message}`);
    }
  }

  /**
   * Export and share attendees as Excel
   * @param {Array} attendees - Attendees data
   * @param {Object} event - Event information
   */
  async exportAndShareAttendees(attendees, event) {
    try {
      const fileUri = await this.exportAttendeesToExcel(attendees, event);
      const filename = fileUri.split('/').pop();
      await this.shareExcelFile(fileUri, filename);
      return fileUri;
    } catch (error) {
      console.error('❌ Error in export and share process:', error);
      throw error;
    }
  }

  /**
   * Future: Export to Google Sheets
   * This will be implemented when Gmail integration is added
   * @param {Array} attendees - Attendees data
   * @param {Object} event - Event information
   * @param {string} organizerEmail - Organizer's Gmail address
   */
  async exportToGoogleSheets(attendees, event, organizerEmail) {
    // TODO: Implement Google Sheets API integration
    console.log('🚀 Future feature: Export to Google Sheets');
    console.log('📧 Organizer email:', organizerEmail);
    console.log('👥 Attendees count:', attendees?.length || 0);
    
    // This will be implemented in the future with:
    // 1. Google Sheets API integration
    // 2. Gmail OAuth authentication
    // 3. Automatic sheet creation and population
    // 4. Email notification to organizer
    
    throw new Error('Google Sheets export not yet implemented. Coming soon!');
  }
}

export default new ExcelExportService();
