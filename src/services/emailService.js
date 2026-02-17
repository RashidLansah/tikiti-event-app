// Using SendGrid Web API directly instead of Node.js library
const SENDGRID_API_ENDPOINT = 'https://api.sendgrid.com/v3/mail/send';

// SendGrid API key from environment variables
const SENDGRID_API_KEY = process.env.EXPO_PUBLIC_SENDGRID_API_KEY || 'YOUR_SENDGRID_API_KEY_HERE';

class EmailService {
  constructor() {
    this.fromEmail = 'noreply@gettikiti.com'; // Use noreply for better deliverability
    this.fromName = 'Tikiti Events';
    this.replyTo = 'lansah@gettikiti.com'; // Set reply-to for responses
  }

  // Send welcome email to new users
  async sendWelcomeEmail(userEmail, userName) {
    try {
      console.log('📧 Attempting to send welcome email to:', userEmail);
      console.log('📧 SendGrid API Key available:', !!SENDGRID_API_KEY && SENDGRID_API_KEY !== 'YOUR_SENDGRID_API_KEY_HERE');
      console.log('📧 API Key starts with SG.:', SENDGRID_API_KEY?.startsWith('SG.'));
      console.log('📧 API Key length:', SENDGRID_API_KEY?.length);
      
      // Check if API key is properly configured
      if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'YOUR_SENDGRID_API_KEY_HERE') {
        console.error('❌ SendGrid API Key not configured. Please set EXPO_PUBLIC_SENDGRID_API_KEY environment variable.');
        return { success: false, error: 'SendGrid API Key not configured' };
      }
      
      const emailData = {
        personalizations: [{
          to: [{ email: userEmail }],
          subject: 'Welcome to Tikiti! 🎉 Your journey to amazing events starts here'
        }],
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        reply_to: {
          email: this.replyTo,
          name: 'Lansah (Founder & CEO)'
        },
        content: [{
          type: 'text/html',
          value: this.getWelcomeEmailTemplate(userName)
        }, {
          type: 'text/plain',
          value: this.getWelcomeEmailText(userName)
        }],
        headers: {
          'X-Mailer': 'Tikiti Events Platform',
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal'
        },
        categories: ['welcome', 'user-onboarding'],
        custom_args: {
          source: 'welcome-email',
          user_type: 'new-user'
        }
      };

      const response = await fetch(SENDGRID_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ SendGrid API error:', response.status, errorText);
        throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('✅ Welcome email sent successfully!', responseData);
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  // HTML template for welcome email
  getWelcomeEmailTemplate(userName) {
    const displayName = userName || 'there';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Tikiti</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background-color: #ffffff;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #333333;
          margin-bottom: 10px;
        }
        .tagline {
          color: #666;
          font-size: 16px;
        }
        .greeting {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin-bottom: 20px;
        }
        .content {
          font-size: 16px;
          line-height: 1.8;
          margin-bottom: 30px;
        }
        .highlight {
          background-color: #fff3cd;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #333333;
          margin: 20px 0;
        }

        .features {
          margin: 30px 0;
        }
        .feature {
          display: flex;
          align-items: center;
          margin: 15px 0;
        }
        .feature-icon {
          font-size: 20px;
          margin-right: 15px;
          width: 30px;
        }
        .signature {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
        .signature-name {
          font-weight: bold;
          color: #333333;
        }
        .signature-title {
          color: #666;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎫 Tikiti</div>
          <div class="tagline">Discover. Connect. Experience.</div>
        </div>
        
        <div class="greeting">Hi ${displayName}! 👋</div>
        
        <div class="content">
          <p>Welcome to Tikiti! I'm thrilled to have you join our community of event enthusiasts.</p>
          
          <p>My name is Lansah, and I'm the Founder & CEO of Tikiti. I created this platform because I believe that amazing events should be accessible to everyone, and that the best experiences happen when people come together.</p>
          
          <div class="highlight">
            <strong>🎉 You're now part of something special!</strong><br>
            Tikiti is more than just an event platform – it's a community where memories are made and connections are forged.
          </div>
          
          <div class="features">
            <h3>Here's what you can do with Tikiti:</h3>
            <div class="feature">
              <span class="feature-icon">🔍</span>
              <span>Discover amazing events happening near you</span>
            </div>
            <div class="feature">
              <span class="feature-icon">🎫</span>
              <span>RSVP to free events instantly</span>
            </div>
            <div class="feature">
              <span class="feature-icon">👥</span>
              <span>Connect with like-minded people</span>
            </div>
            <div class="feature">
              <span class="feature-icon">📱</span>
              <span>Get personalized event recommendations</span>
            </div>
            <div class="feature">
              <span class="feature-icon">🔔</span>
              <span>Receive timely reminders for your events</span>
            </div>
          </div>
          
          <p>I'm personally committed to making your experience on Tikiti exceptional. If you have any questions, suggestions, or just want to say hello, don't hesitate to reach out to me directly.</p>
        </div>
        
        <div class="signature">
          <div class="signature-name">Lansah</div>
          <div class="signature-title">Founder & CEO, Tikiti</div>
          <div style="margin-top: 10px; font-size: 14px;">
            📧 lansah@gettikiti.com<br>
            🌐 gettikiti.com
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for choosing Tikiti. Let's create amazing memories together!</p>
          <p>© 2024 Tikiti. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Plain text version of welcome email
  getWelcomeEmailText(userName) {
    const displayName = userName || 'there';
    
    return `
Hi ${displayName}!

Welcome to Tikiti! I'm thrilled to have you join our community of event enthusiasts.

My name is Lansah, and I'm the Founder & CEO of Tikiti. I created this platform because I believe that amazing events should be accessible to everyone, and that the best experiences happen when people come together.

🎉 You're now part of something special!
Tikiti is more than just an event platform – it's a community where memories are made and connections are forged.

Here's what you can do with Tikiti:
🔍 Discover amazing events happening near you
🎫 RSVP to free events instantly
👥 Connect with like-minded people
📱 Get personalized event recommendations
🔔 Receive timely reminders for your events

I'm personally committed to making your experience on Tikiti exceptional. If you have any questions, suggestions, or just want to say hello, don't hesitate to reach out to me directly.

Best regards,
Lansah
Founder & CEO, Tikiti
📧 lansah@gettikiti.com
🌐 gettikiti.com

Thank you for choosing Tikiti. Let's create amazing memories together!

© 2024 Tikiti. All rights reserved.
    `;
  }

  // Send event reminder email
  async sendEventReminderEmail(userEmail, userName, eventName, eventDate, eventLocation) {
    try {
      const emailData = {
        personalizations: [{
          to: [{ email: userEmail }],
          subject: `Don't forget: ${eventName} is tomorrow! 🎉`
        }],
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        reply_to: {
          email: this.replyTo,
          name: 'Lansah (Founder & CEO)'
        },
        content: [{
          type: 'text/html',
          value: this.getEventReminderTemplate(userName, eventName, eventDate, eventLocation)
        }, {
          type: 'text/plain',
          value: this.getEventReminderText(userName, eventName, eventDate, eventLocation)
        }],
        headers: {
          'X-Mailer': 'Tikiti Events Platform',
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal'
        },
        categories: ['event-reminder', 'notification'],
        custom_args: {
          source: 'event-reminder',
          event_name: eventName
        }
      };

      const response = await fetch(SENDGRID_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        throw new Error(`SendGrid API error: ${response.status}`);
      }

      console.log('✅ Event reminder email sent successfully!');
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending event reminder email:', error);
      return { success: false, error: error.message };
    }
  }

  // Event reminder email template
  getEventReminderTemplate(userName, eventName, eventDate, eventLocation) {
    const displayName = userName || 'there';
    const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Event Reminder - Tikiti</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background-color: #ffffff;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #333333;
          margin-bottom: 10px;
        }
        .reminder-badge {
          background-color: #333333;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          display: inline-block;
          margin-bottom: 20px;
        }
        .event-details {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .event-name {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin-bottom: 15px;
        }
        .event-info {
          margin: 10px 0;
          font-size: 16px;
        }
        .event-info strong {
          color: #333333;
        }

      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎫 Tikiti</div>
          <div class="reminder-badge">⏰ Event Reminder</div>
        </div>
        
        <h2>Hi ${displayName}! 👋</h2>
        
        <p>Just a friendly reminder that you have an exciting event coming up!</p>
        
        <div class="event-details">
          <div class="event-name">${eventName}</div>
          <div class="event-info">
            <strong>📅 Date & Time:</strong> ${formattedDate}
          </div>
          <div class="event-info">
            <strong>📍 Location:</strong> ${eventLocation}
          </div>
        </div>
        
        <p>We're excited to see you there! Don't forget to bring your enthusiasm and get ready to make some amazing memories.</p>
        
        <div style="text-align: center;">
          <a href="https://gettikiti.com" class="cta-button">View Event Details</a>
        </div>
        
        <p>If you have any questions or need to make changes to your RSVP, feel free to reach out.</p>
        
        <p>Best regards,<br>
        <strong>Lansah</strong><br>
        Founder & CEO, Tikiti</p>
      </div>
    </body>
    </html>
    `;
  }

  // Event reminder text version
  getEventReminderText(userName, eventName, eventDate, eventLocation) {
    const displayName = userName || 'there';
    const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `
Hi ${displayName}!

⏰ EVENT REMINDER

Just a friendly reminder that you have an exciting event coming up!

🎫 ${eventName}
📅 Date & Time: ${formattedDate}
📍 Location: ${eventLocation}

We're excited to see you there! Don't forget to bring your enthusiasm and get ready to make some amazing memories.

View event details at: https://gettikiti.com

If you have any questions or need to make changes to your RSVP, feel free to reach out.

Best regards,
Lansah
Founder & CEO, Tikiti
    `;
  }
}

export default new EmailService();
