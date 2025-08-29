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
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">🎫 Your Event Ticket</h1>
                </div>
                
                <div style="padding: 30px; background: white;">
                  <div style="background: #f8f9fa; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 2px solid #e9ecef;">
                    <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">${eventName}</h2>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                      <span style="font-weight: bold; color: #666;">Date:</span>
                      <span style="color: #333;">${eventDate || 'Date TBA'}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                      <span style="font-weight: bold; color: #666;">Time:</span>
                      <span style="color: #333;">${eventTime || 'Time TBA'}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                      <span style="font-weight: bold; color: #666;">Location:</span>
                      <span style="color: #333;">${locationText}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                      <span style="font-weight: bold; color: #666;">Attendee:</span>
                      <span style="color: #333;">${userName}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                      <span style="font-weight: bold; color: #666;">Email:</span>
                      <span style="color: #333;">${userEmail}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                      <span style="font-weight: bold; color: #666;">Tickets:</span>
                      <span style="color: #333;">${quantity || 1}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                      <span style="font-weight: bold; color: #666;">Booking Reference:</span>
                      <span style="color: #333; font-family: monospace;">${bookingReference || 'N/A'}</span>
                    </div>
                  </div>
                  
                                     <div style="text-align: center; background: #f8f9fa; border-radius: 12px; padding: 25px;">
                     <h3 style="color: #333; margin: 0 0 15px 0;">📱 QR Code for Entry</h3>
                     <div style="background: white; border-radius: 8px; padding: 20px; display: inline-block; border: 2px solid #e9ecef;">
                       <div style="font-family: monospace; font-size: 12px; color: #666; word-break: break-all; margin-bottom: 15px;">
                         Booking ID: ${bookingId || 'N/A'}
                       </div>
                       ${qrCodeImage ? `
                         <div style="margin: 15px 0;">
                           <img src="${qrCodeImage}" alt="QR Code" style="width: 200px; height: 200px; border: 1px solid #ddd; border-radius: 8px;" />
                         </div>
                       ` : `
                         <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 10px; color: #333; word-break: break-all;">
                           ${qrData}
                         </div>
                       `}
                       <p style="color: #666; font-size: 12px; margin: 10px 0 0 0;">
                         Show this QR code at the event entrance
                       </p>
                     </div>
                   </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="color: #666; margin: 0; font-size: 14px;">
                    Thank you for using Tikiti Events! 🎉
                  </p>
                </div>
              </div>
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
