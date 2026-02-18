import logger from '../utils/logger';

// Brevo (Sendinblue) Email Service Configuration
const BREVO_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_BREVO_API_KEY || '',
  apiEndpoint: 'https://api.brevo.com/v3/smtp/email',
  fromEmail: process.env.EXPO_PUBLIC_BREVO_SENDER_EMAIL || 'noreply@gettikiti.com',
  fromName: 'Tikiti',
  replyTo: 'lansah@gettikiti.com',
};

// Brevo email service
export const emailService = {
  // Initialize Brevo
  init: async () => {
    try {
      if (!BREVO_CONFIG.apiKey) {
        logger.warn('Brevo API key not configured. Emails will not be sent.');
        return false;
      }
      logger.log('Brevo email service ready');
      return true;
    } catch (error) {
      logger.error('Brevo initialization failed:', error);
      return false;
    }
  },

  // Send ticket confirmation email
  sendTicketConfirmation: async (bookingData) => {
    try {
      if (!BREVO_CONFIG.apiKey) {
        logger.error('Brevo API key not configured. Please set EXPO_PUBLIC_BREVO_API_KEY.');
        return { success: false, message: 'Email service not configured' };
      }

      // Handle location data - it might be an object or string
      let locationText = 'Location not specified';
      if (bookingData.eventLocation) {
        if (typeof bookingData.eventLocation === 'object') {
          locationText = bookingData.eventLocation.name || bookingData.eventLocation.address || 'Location not specified';
        } else {
          locationText = bookingData.eventLocation;
        }
      }

      logger.log('Sending ticket confirmation email to:', bookingData.userEmail);

      // Generate QR code data
      const qrCodeData = JSON.stringify({
        eventId: bookingData.eventId,
        userId: bookingData.userId,
        bookingId: bookingData.id,
      });
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrCodeData)}`;

      // Generate ticket ID
      const ticketId = bookingData.bookingReference || `TK-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Ticket for ${bookingData.eventName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #fefff7;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 48px; height: 48px; background-color: #333; border-radius: 12px; line-height: 48px; color: white; font-weight: bold; font-size: 18px;">TK</div>
          <h1 style="margin: 16px 0 0; font-size: 24px; font-weight: 800; color: #333;">Tikiti</h1>
        </div>

        <!-- Main Content -->
        <div style="background-color: white; border-radius: 24px; padding: 40px; border: 1px solid rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; background-color: #dcfce7; color: #16a34a; padding: 8px 16px; border-radius: 50px; font-size: 14px; font-weight: 600;">
              Booking Confirmed
            </span>
          </div>

          <h2 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #333; text-align: center;">You're Going!</h2>

          <p style="margin: 0 0 32px; font-size: 16px; color: #86868b; text-align: center;">
            Hi ${bookingData.userName}, your ticket is ready
          </p>

          <!-- Event Card -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
            <tr>
              <td style="background-color: #333333; border-radius: 20px; padding: 32px;">
                <h3 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #ffffff;">${bookingData.eventName}</h3>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding-bottom: 16px;">
                      <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: #999999; letter-spacing: 1px;">Date & Time</p>
                      <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #ffffff;">${bookingData.eventDate || 'TBD'} at ${bookingData.eventTime || 'TBD'}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 16px;">
                      <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: #999999; letter-spacing: 1px;">Location</p>
                      <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #ffffff;">${locationText}</p>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="50%" valign="top">
                            <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: #999999; letter-spacing: 1px;">Ticket Type</p>
                            <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #ffffff;">General Admission</p>
                          </td>
                          <td width="50%" valign="top">
                            <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: #999999; letter-spacing: 1px;">Quantity</p>
                            <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #ffffff;">${bookingData.quantity || 1} ticket${(bookingData.quantity || 1) > 1 ? 's' : ''}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- QR Code Section -->
          <div style="text-align: center; padding: 32px; background-color: #f8f8f8; border-radius: 16px; margin-bottom: 32px;">
            <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #333;">Your Entry QR Code</p>

            <div style="display: inline-block; padding: 16px; background-color: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <img src="${qrCodeUrl}" alt="QR Code" width="180" height="180" style="display: block;" />
            </div>

            <p style="margin: 16px 0 0; font-size: 12px; color: #86868b;">
              Show this QR code at the venue entrance
            </p>
          </div>

          <!-- Ticket ID -->
          <div style="background-color: #fef3c7; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 32px;">
            <p style="margin: 0; font-size: 12px; color: #92400e; font-weight: 600; text-transform: uppercase;">Ticket ID</p>
            <p style="margin: 4px 0 0; font-size: 18px; color: #92400e; font-weight: 700; font-family: monospace;">${ticketId}</p>
          </div>

          <p style="margin: 0; font-size: 14px; color: #86868b; text-align: center;">
            You can also access your ticket in the Tikiti app
          </p>
        </div>

        <!-- Tips -->
        <div style="background-color: white; border-radius: 16px; padding: 24px; margin-top: 16px; border: 1px solid rgba(0,0,0,0.1);">
          <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #333;">Event Day Tips</p>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #86868b; line-height: 1.8;">
            <li>Have your QR code ready before arriving</li>
            <li>Arrive 15-30 minutes early</li>
            <li>Screenshot your QR code in case of poor connectivity</li>
          </ul>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="margin: 0; font-size: 14px; color: #86868b;">
            &copy; ${new Date().getFullYear()} Tikiti Events. All rights reserved.
          </p>
          <p style="margin: 8px 0 0; font-size: 12px; color: #86868b;">
            Questions? Contact the event organizer through the Tikiti app.
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      const response = await fetch(BREVO_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_CONFIG.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: BREVO_CONFIG.fromName,
            email: BREVO_CONFIG.fromEmail,
          },
          to: [
            {
              email: bookingData.userEmail,
              name: bookingData.userName,
            }
          ],
          replyTo: {
            email: BREVO_CONFIG.replyTo,
            name: 'Tikiti Events',
          },
          subject: `Your Ticket for ${bookingData.eventName}`,
          htmlContent: emailHtml,
          tags: ['ticket-confirmation', 'booking'],
        })
      });

      if (response.ok) {
        const result = await response.json();
        logger.log('Ticket confirmation email sent successfully via Brevo:', result.messageId);
        return { success: true, message: 'Ticket confirmation email sent successfully!' };
      } else {
        const errorData = await response.text();
        logger.error('Brevo API error:', response.status, errorData);
        return { success: false, message: 'Failed to send ticket email. Please check the Tikiti app for your ticket.' };
      }
    } catch (error) {
      logger.error('Brevo ticket confirmation failed:', error);
      return { success: false, message: 'Failed to send ticket email. Please check the Tikiti app for your ticket.' };
    }
  }
};

export default emailService;
