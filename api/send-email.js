// Vercel serverless function to send emails via SendGrid
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      userEmail, 
      userName, 
      eventName, 
      eventDate, 
      eventTime, 
      eventLocation, 
      quantity, 
      bookingReference, 
      bookingId, 
      eventId, 
      userId 
    } = req.body;

    // Validate required fields
    if (!userEmail || !userName || !eventName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get SendGrid API key from environment variable
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    if (!sendgridApiKey) {
      console.error('❌ SendGrid API key not found in environment variables');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Handle location data - it might be an object or string
    let locationText = 'Location TBA';
    if (eventLocation) {
      if (typeof eventLocation === 'object') {
        locationText = eventLocation.name || eventLocation.address || 'Location TBA';
      } else {
        locationText = eventLocation;
      }
    }

    // Generate QR code data
    const qrData = JSON.stringify({
      eventId: eventId || 'N/A',
      userId: userId || 'N/A',
      bookingId: bookingId || 'N/A',
      timestamp: new Date().toISOString()
    });

    // Generate QR code using a free QR code API service
    let qrCodeImage = '';
    try {
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
      qrCodeImage = qrApiUrl;
      console.log('✅ QR code generated via API:', qrApiUrl);
    } catch (qrError) {
      console.error('❌ QR code generation failed:', qrError);
      // Fallback to text if QR generation fails
      qrCodeImage = '';
    }

    // Send email via SendGrid
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: userEmail, name: userName }],
            subject: `Your Ticket for ${eventName}`
          }
        ],
        from: {
          email: 'gettikiti@gmail.com',
          name: 'Tikiti Events'
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
                        ${eventName}
                      </h2>
                      
                      <!-- Event Details Grid -->
                      <div style="display: grid; gap: 20px;">
                        
                        <div style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                            <span style="color: white; font-size: 18px;">📅</span>
                          </div>
                          <div style="flex: 1;">
                            <div style="font-weight: 600; color: #495057; font-size: 14px; margin-bottom: 4px;">DATE</div>
                            <div style="color: #2c3e50; font-size: 16px; font-weight: 500;">${eventDate || 'Date TBA'}</div>
                          </div>
                        </div>
                        
                        <div style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                            <span style="color: white; font-size: 18px;">🕐</span>
                          </div>
                          <div style="flex: 1;">
                            <div style="font-weight: 600; color: #495057; font-size: 14px; margin-bottom: 4px;">TIME</div>
                            <div style="color: #2c3e50; font-size: 16px; font-weight: 500;">${eventTime || 'Time TBA'}</div>
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
                            <div style="color: #2c3e50; font-size: 16px; font-weight: 500;">${userName}</div>
                          </div>
                        </div>
                        
                        <div style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                            <span style="color: white; font-size: 18px;">🎟️</span>
                          </div>
                          <div style="flex: 1;">
                            <div style="font-weight: 600; color: #495057; font-size: 14px; margin-bottom: 4px;">TICKETS</div>
                            <div style="color: #2c3e50; font-size: 16px; font-weight: 500;">${quantity || 1} ticket${(quantity || 1) > 1 ? 's' : ''}</div>
                          </div>
                        </div>
                        
                        <div style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                            <span style="color: white; font-size: 18px;">🔖</span>
                          </div>
                          <div style="flex: 1;">
                            <div style="font-weight: 600; color: #495057; font-size: 14px; margin-bottom: 4px;">BOOKING REFERENCE</div>
                            <div style="color: #2c3e50; font-size: 16px; font-weight: 500; font-family: 'Courier New', monospace; letter-spacing: 1px;">${bookingReference || 'N/A'}</div>
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
                        ${qrCodeImage ? `
                          <div style="margin: 15px 0;">
                            <img src="${qrCodeImage}" alt="QR Code" style="max-width: 200px; height: auto; border-radius: 8px;" />
                          </div>
                        ` : `
                          <div style="font-family: 'Courier New', monospace; font-size: 11px; color: #6c757d; word-break: break-all; line-height: 1.4; max-width: 300px;">
                            ${qrData}
                          </div>
                        `}
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
      console.log('✅ Email sent successfully via SendGrid');
      return res.status(200).json({ 
        success: true, 
        message: 'Email sent successfully!' 
      });
    } else {
      const errorData = await response.text();
      console.error('❌ SendGrid API error:', response.status, errorData);
      return res.status(500).json({ 
        success: false, 
        error: `SendGrid error: ${response.status}` 
      });
    }

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
