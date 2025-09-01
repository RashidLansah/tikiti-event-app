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
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🎫 Your Event Ticket</h1>
                  </div>
                  
                  <div style="padding: 30px; background: white;">
                    <div style="background: #f8f9fa; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 2px solid #e9ecef;">
                      <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">${bookingData.eventName}</h2>
                      
                      <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                        <span style="font-weight: bold; color: #666;">Date:</span>
                        <span style="color: #333;">${bookingData.eventDate}</span>
                      </div>
                      
                      <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                        <span style="font-weight: bold; color: #666;">Time:</span>
                        <span style="color: #333;">${bookingData.eventTime}</span>
                      </div>
                      
                      <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                        <span style="font-weight: bold; color: #666;">Location:</span>
                        <span style="color: #333;">${locationText}</span>
                      </div>
                      
                      <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                        <span style="font-weight: bold; color: #666;">Attendee:</span>
                        <span style="color: #333;">${bookingData.userName}</span>
                      </div>
                      
                      <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                        <span style="font-weight: bold; color: #666;">Email:</span>
                        <span style="color: #333;">${bookingData.userEmail}</span>
                      </div>
                      
                      <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                        <span style="font-weight: bold; color: #666;">Tickets:</span>
                        <span style="color: #333;">${bookingData.quantity}</span>
                      </div>
                      
                      <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                        <span style="font-weight: bold; color: #666;">Booking Reference:</span>
                        <span style="color: #333; font-family: monospace;">${bookingData.bookingReference}</span>
                      </div>
                    </div>
                    
                    <div style="text-align: center; background: #f8f9fa; border-radius: 12px; padding: 25px;">
                      <h3 style="color: #333; margin: 0 0 15px 0;">📱 QR Code for Entry</h3>
                      <div style="background: white; border-radius: 8px; padding: 20px; display: inline-block; border: 2px solid #e9ecef;">
                        <div style="font-family: monospace; font-size: 12px; color: #666; word-break: break-all;">
                          ${JSON.stringify({
                            eventId: bookingData.eventId,
                            userId: bookingData.userId,
                            bookingId: bookingData.id,
                            timestamp: new Date().toISOString()
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">
                      Thank you for using Tikiti Events! 🎉
                    </p>
                    <p style="color: #999; margin: 0; font-size: 12px;">
                      This is a transactional email for your event ticket. 
                      <a href="mailto:gettikiti@gmail.com?subject=Unsubscribe&body=Please unsubscribe me from Tikiti Events emails" 
                         style="color: #999; text-decoration: underline;">Unsubscribe</a>
                    </p>
                  </div>
                </div>
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