// SendGrid Email Service Configuration
const SENDGRID_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_SENDGRID_API_KEY || 'YOUR_SENDGRID_API_KEY_HERE',
  fromEmail: 'gettikiti@gmail.com',
  fromName: 'Tikiti Events',
  replyTo: 'gettikiti@gmail.com' // Add reply-to address
};

// SendGrid email service
export const emailService = {
  // Initialize SendGrid
  init: async () => {
    try {
      console.log('✅ SendGrid email service ready');
      return true;
    } catch (error) {
      console.error('❌ SendGrid initialization failed:', error);
      return false;
    }
  },

  // Send ticket confirmation email
  sendTicketConfirmation: async (bookingData) => {
    try {
      // Handle location data - it might be an object or string
      let locationText = 'Location not specified';
      if (bookingData.eventLocation) {
        if (typeof bookingData.eventLocation === 'object') {
          locationText = bookingData.eventLocation.name || bookingData.eventLocation.address || 'Location not specified';
        } else {
          locationText = bookingData.eventLocation;
        }
      }

      console.log('📧 Sending ticket confirmation email to:', bookingData.userEmail);
      console.log('📍 Location data:', bookingData.eventLocation, '-> Formatted as:', locationText);

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: bookingData.userEmail, name: bookingData.userName }],
              subject: `Your Ticket for ${bookingData.eventName}`,
              // Add custom args for better tracking
              custom_args: {
                event_id: bookingData.eventId,
                booking_id: bookingData.id,
                user_id: bookingData.userId
              }
            }
          ],
          from: {
            email: SENDGRID_CONFIG.fromEmail,
            name: SENDGRID_CONFIG.fromName
          },
          reply_to: {
            email: SENDGRID_CONFIG.replyTo,
            name: 'Tikiti Events'
          },
          // Add proper headers to improve deliverability
          headers: {
            'X-Mailer': 'Tikiti Events',
            'X-Priority': '3',
            'X-MSMail-Priority': 'Normal'
          },
          content: [
            {
              type: 'text/html',
              value: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Your Event Ticket - Tikiti Events</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
                      <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                      <div style="position: absolute; bottom: -30px; left: -30px; width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                      <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3); position: relative; z-index: 1;">
                        🎫 Your Event Ticket
                      </h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; position: relative; z-index: 1;">
                        Confirmation & Entry Details
                      </p>
                    </div>
                    
                    <!-- Main Content -->
                    <div style="padding: 40px 30px;">
                      
                      <!-- Event Details Card -->
                      <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 16px; padding: 30px; margin-bottom: 30px; border: 1px solid #dee2e6; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                        <h2 style="color: #2c3e50; margin: 0 0 25px 0; font-size: 26px; font-weight: 600; text-align: center; border-bottom: 2px solid #667eea; padding-bottom: 15px;">
                          ${bookingData.eventName}
                        </h2>
                        
                        <!-- Event Details Grid -->
                        <div style="display: grid; gap: 20px;">
                          
                          <div style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                              <span style="color: white; font-size: 18px;">📅</span>
                            </div>
                            <div style="flex: 1;">
                              <div style="font-weight: 600; color: #495057; font-size: 14px; margin-bottom: 4px;">DATE</div>
                              <div style="color: #2c3e50; font-size: 16px; font-weight: 500;">${bookingData.eventDate}</div>
                            </div>
                          </div>
                          
                          <div style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                              <span style="color: white; font-size: 18px;">🕐</span>
                            </div>
                            <div style="flex: 1;">
                              <div style="font-weight: 600; color: #495057; font-size: 14px; margin-bottom: 4px;">TIME</div>
                              <div style="color: #2c3e50; font-size: 16px; font-weight: 500;">${bookingData.eventTime}</div>
                            </div>
                          </div>
                          
                          <div style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                              <span style="color: white; font-size: 18px;">📍</span>
                            </div>
                            <div style="flex: 1;">
                              <div style="font-weight: 600; color: #495057; font-size: 14px; margin-bottom: 4px;">LOCATION</div>
                              <div style="color: #2c3e50; font-size: 16px; font-weight: 500;">${locationText}</div>
                            </div>
                          </div>
                          
                          <div style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                              <span style="color: white; font-size: 18px;">👤</span>
                            </div>
                            <div style="flex: 1;">
                              <div style="font-weight: 600; color: #495057; font-size: 14px; margin-bottom: 4px;">ATTENDEE</div>
                              <div style="color: #2c3e50; font-size: 16px; font-weight: 500;">${bookingData.userName}</div>
                            </div>
                          </div>
                          
                          <div style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                              <span style="color: white; font-size: 18px;">🎟️</span>
                            </div>
                            <div style="flex: 1;">
                              <div style="font-weight: 600; color: #495057; font-size: 14px; margin-bottom: 4px;">TICKETS</div>
                              <div style="color: #2c3e50; font-size: 16px; font-weight: 500;">${bookingData.quantity} ticket${bookingData.quantity > 1 ? 's' : ''}</div>
                            </div>
                          </div>
                          
                          <div style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                              <span style="color: white; font-size: 18px;">🔖</span>
                            </div>
                            <div style="flex: 1;">
                              <div style="font-weight: 600; color: #495057; font-size: 14px; margin-bottom: 4px;">BOOKING REFERENCE</div>
                              <div style="color: #2c3e50; font-size: 16px; font-weight: 500; font-family: 'Courier New', monospace; letter-spacing: 1px;">${bookingData.bookingReference}</div>
                            </div>
                          </div>
                          
                        </div>
                      </div>
                      
                      <!-- QR Code Section -->
                      <div style="text-align: center; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 16px; padding: 30px; border: 1px solid #dee2e6;">
                        <h3 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">
                          📱 QR Code for Entry
                        </h3>
                        <div style="background: white; border-radius: 12px; padding: 25px; display: inline-block; border: 2px solid #dee2e6; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                          <div style="font-family: 'Courier New', monospace; font-size: 11px; color: #6c757d; word-break: break-all; line-height: 1.4; max-width: 300px;">
                            ${JSON.stringify({
                              eventId: bookingData.eventId,
                              userId: bookingData.userId,
                              bookingId: bookingData.id,
                              timestamp: new Date().toISOString()
                            }, null, 2)}
                          </div>
                        </div>
                        <p style="color: #6c757d; font-size: 14px; margin: 15px 0 0 0; font-style: italic;">
                          Show this QR code at the event entrance
                        </p>
                      </div>
                      
                    </div>
                    
                    <!-- Footer -->
                    <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #dee2e6;">
                      <div style="margin-bottom: 20px;">
                        <h4 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">
                          Thank you for using Tikiti Events! 🎉
                        </h4>
                        <p style="color: #6c757d; margin: 0; font-size: 14px; line-height: 1.5;">
                          We're excited to see you at the event. Have a great time!
                        </p>
                      </div>
                      
                      <div style="border-top: 1px solid #dee2e6; padding-top: 20px;">
                        <p style="color: #adb5bd; margin: 0 0 10px 0; font-size: 12px;">
                          This is a transactional email for your event ticket.
                        </p>
                        <p style="color: #adb5bd; margin: 0; font-size: 12px;">
                          <a href="mailto:gettikiti@gmail.com?subject=Unsubscribe&body=Please unsubscribe me from Tikiti Events emails" 
                             style="color: #6c757d; text-decoration: underline;">Unsubscribe</a> | 
                          <a href="mailto:gettikiti@gmail.com" style="color: #6c757d; text-decoration: underline;">Contact Support</a>
                        </p>
                      </div>
                    </div>
                    
                  </div>
                </body>
                </html>
              `
            }
          ]
        })
      });

      if (response.ok) {
        console.log('✅ Ticket confirmation email sent successfully via SendGrid');
        return { success: true, message: 'Ticket confirmation email sent successfully!' };
      } else {
        const errorData = await response.text();
        console.error('❌ SendGrid API error:', response.status, errorData);
        return { success: false, message: `SendGrid error: ${response.status} - ${errorData}` };
      }
    } catch (error) {
      console.error('❌ SendGrid ticket confirmation failed:', error);
      return { success: false, message: `SendGrid error: ${error.message}` };
    }
  }
};

export default emailService;