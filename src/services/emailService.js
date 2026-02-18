import logger from '../utils/logger';

// Brevo (Sendinblue) API endpoint
const BREVO_API_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

// Brevo API key from environment variables
const BREVO_API_KEY = process.env.EXPO_PUBLIC_BREVO_API_KEY || '';

class EmailService {
  constructor() {
    this.fromEmail = process.env.EXPO_PUBLIC_BREVO_SENDER_EMAIL || 'noreply@gettikiti.com';
    this.fromName = 'Tikiti';
    this.replyTo = 'lansah@gettikiti.com';
  }

  // Send email via Brevo API
  async _sendEmail({ to, toName, subject, htmlContent, textContent, tags }) {
    try {
      if (!BREVO_API_KEY) {
        logger.error('Brevo API Key not configured. Please set EXPO_PUBLIC_BREVO_API_KEY environment variable.');
        return { success: false, error: 'Email service not configured' };
      }

      const emailData = {
        sender: {
          name: this.fromName,
          email: this.fromEmail,
        },
        to: [{ email: to, name: toName || to }],
        replyTo: {
          email: this.replyTo,
          name: 'Lansah (Founder & CEO)',
        },
        subject,
        htmlContent,
        tags: tags || [],
      };

      if (textContent) {
        emailData.textContent = textContent;
      }

      const response = await fetch(BREVO_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Brevo API error:', response.status, errorText);
        throw new Error(`Email service error: ${response.status}`);
      }

      const responseData = await response.json();
      logger.log('Email sent successfully:', responseData.messageId);
      return { success: true, messageId: responseData.messageId };
    } catch (error) {
      logger.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send welcome email to new users
  async sendWelcomeEmail(userEmail, userName) {
    const displayName = userName || 'there';

    return this._sendEmail({
      to: userEmail,
      toName: userName,
      subject: 'Welcome to Tikiti! Your journey to amazing events starts here',
      htmlContent: this.getWelcomeEmailTemplate(displayName),
      textContent: this.getWelcomeEmailText(displayName),
      tags: ['welcome', 'user-onboarding'],
    });
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
              <h2 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #333;">Hi ${displayName}!</h2>

              <p style="margin: 0 0 24px; font-size: 16px; color: #333; line-height: 1.6;">
                Welcome to Tikiti! I'm thrilled to have you join our community of event enthusiasts.
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; color: #333; line-height: 1.6;">
                My name is Lansah, and I'm the Founder & CEO of Tikiti. I created this platform because I believe that amazing events should be accessible to everyone, and that the best experiences happen when people come together.
              </p>

              <div style="background-color: #fef3c7; padding: 20px; border-radius: 12px; border-left: 4px solid #333; margin: 24px 0;">
                <p style="margin: 0; font-size: 16px; color: #333; font-weight: 600;">You're now part of something special!</p>
                <p style="margin: 8px 0 0; font-size: 14px; color: #333; line-height: 1.6;">Tikiti is more than just an event platform - it's a community where memories are made and connections are forged.</p>
              </div>

              <p style="margin: 24px 0 16px; font-size: 16px; font-weight: 600; color: #333;">Here's what you can do with Tikiti:</p>

              <ul style="margin: 0 0 32px; padding-left: 24px; font-size: 16px; color: #333; line-height: 2;">
                <li>Discover amazing events happening near you</li>
                <li>RSVP to free events instantly</li>
                <li>Connect with like-minded people</li>
                <li>Get personalized event recommendations</li>
                <li>Receive timely reminders for your events</li>
              </ul>

              <p style="margin: 0 0 24px; font-size: 16px; color: #333; line-height: 1.6;">
                I'm personally committed to making your experience on Tikiti exceptional. If you have any questions, suggestions, or just want to say hello, don't hesitate to reach out to me directly.
              </p>
            </div>

            <!-- Signature -->
            <div style="margin-top: 24px; padding: 24px;">
              <p style="margin: 0; font-weight: 700; color: #333;">Lansah</p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #86868b;">Founder & CEO, Tikiti</p>
              <p style="margin: 12px 0 0; font-size: 14px; color: #86868b;">lansah@gettikiti.com | gettikiti.com</p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 32px;">
              <p style="margin: 0; font-size: 14px; color: #86868b;">
                &copy; ${new Date().getFullYear()} Tikiti Events. All rights reserved.
              </p>
            </div>
          </td>
        </tr>
      </table>
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

You're now part of something special!
Tikiti is more than just an event platform - it's a community where memories are made and connections are forged.

Here's what you can do with Tikiti:
- Discover amazing events happening near you
- RSVP to free events instantly
- Connect with like-minded people
- Get personalized event recommendations
- Receive timely reminders for your events

I'm personally committed to making your experience on Tikiti exceptional. If you have any questions, suggestions, or just want to say hello, don't hesitate to reach out to me directly.

Best regards,
Lansah
Founder & CEO, Tikiti
lansah@gettikiti.com | gettikiti.com

© ${new Date().getFullYear()} Tikiti Events. All rights reserved.
    `;
  }

  // Send event reminder email
  async sendEventReminderEmail(userEmail, userName, eventName, eventDate, eventLocation) {
    const displayName = userName || 'there';

    return this._sendEmail({
      to: userEmail,
      toName: userName,
      subject: `Don't forget: ${eventName} is tomorrow!`,
      htmlContent: this.getEventReminderTemplate(displayName, eventName, eventDate, eventLocation),
      textContent: this.getEventReminderText(displayName, eventName, eventDate, eventLocation),
      tags: ['event-reminder', 'notification'],
    });
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
                <span style="display: inline-block; background-color: #fef3c7; color: #92400e; padding: 8px 16px; border-radius: 50px; font-size: 14px; font-weight: 600;">
                  Event Reminder
                </span>
              </div>

              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #333;">Hi ${displayName}!</h2>

              <p style="margin: 0 0 24px; font-size: 16px; color: #333; line-height: 1.6;">Just a friendly reminder that you have an exciting event coming up!</p>

              <!-- Event Details Card -->
              <div style="background: linear-gradient(135deg, #333 0%, #1a1a1a 100%); border-radius: 20px; padding: 32px; color: white; margin-bottom: 32px;">
                <h3 style="margin: 0 0 24px; font-size: 24px; font-weight: 700;">${eventName}</h3>
                <div style="margin-bottom: 16px;">
                  <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: rgba(255,255,255,0.6); letter-spacing: 1px;">Date & Time</p>
                  <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600;">${formattedDate}</p>
                </div>
                <div>
                  <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: rgba(255,255,255,0.6); letter-spacing: 1px;">Location</p>
                  <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600;">${eventLocation}</p>
                </div>
              </div>

              <p style="margin: 0 0 24px; font-size: 16px; color: #333; line-height: 1.6;">We're excited to see you there! Don't forget to bring your enthusiasm and get ready to make some amazing memories.</p>

              <p style="margin: 0; font-size: 16px; color: #333; line-height: 1.6;">If you have any questions or need to make changes to your RSVP, feel free to reach out.</p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 32px;">
              <p style="margin: 0; font-size: 14px; color: #86868b;">Best regards, Lansah - Founder & CEO, Tikiti</p>
              <p style="margin: 12px 0 0; font-size: 14px; color: #86868b;">
                &copy; ${new Date().getFullYear()} Tikiti Events. All rights reserved.
              </p>
            </div>
          </td>
        </tr>
      </table>
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

EVENT REMINDER

Just a friendly reminder that you have an exciting event coming up!

${eventName}
Date & Time: ${formattedDate}
Location: ${eventLocation}

We're excited to see you there!

If you have any questions or need to make changes to your RSVP, feel free to reach out.

Best regards,
Lansah
Founder & CEO, Tikiti

© ${new Date().getFullYear()} Tikiti Events. All rights reserved.
    `;
  }
}

export default new EmailService();
