import * as brevo from '@getbrevo/brevo';

// Initialize Brevo API
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY || ''
);

// Email templates
const EMAIL_TEMPLATES = {
  welcomeOrganization: {
    subject: 'Welcome to Tikiti - Your Organization is Ready!',
    getHtml: (data: { name: string; orgName: string; loginUrl: string }) => `
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
          <h2 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #333;">Welcome to Tikiti!</h2>

          <p style="margin: 0 0 24px; font-size: 16px; color: #333; line-height: 1.6;">
            Hi ${data.name},
          </p>

          <p style="margin: 0 0 24px; font-size: 16px; color: #333; line-height: 1.6;">
            Congratulations! Your organization <strong>${data.orgName}</strong> has been successfully created on Tikiti. You're now ready to start creating and managing amazing events.
          </p>

          <p style="margin: 0 0 24px; font-size: 16px; color: #333; line-height: 1.6;">
            Here's what you can do next:
          </p>

          <ul style="margin: 0 0 32px; padding-left: 24px; font-size: 16px; color: #333; line-height: 1.8;">
            <li>Create your first event</li>
            <li>Invite team members to help manage events</li>
            <li>Customize your organization branding</li>
            <li>Set up ticket types and pricing</li>
          </ul>

          <a href="${data.loginUrl}" style="display: inline-block; background-color: #333; color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Go to Dashboard
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="margin: 0; font-size: 14px; color: #86868b;">
            &copy; ${new Date().getFullYear()} Tikiti Events. All rights reserved.
          </p>
          <p style="margin: 8px 0 0; font-size: 12px; color: #86868b;">
            You're receiving this email because you created an organization on Tikiti.
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  },

  ticketConfirmation: {
    subject: '🎫 Your Ticket for {eventName}',
    getHtml: (data: {
      attendeeName: string;
      eventName: string;
      eventDate: string;
      eventTime: string;
      eventLocation: string;
      ticketType: string;
      quantity: number;
      ticketId: string;
      qrCodeData: string;
      ticketUrl: string;
    }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Ticket for ${data.eventName}</title>
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
              ✓ Booking Confirmed
            </span>
          </div>

          <h2 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #333; text-align: center;">You're Going!</h2>

          <p style="margin: 0 0 32px; font-size: 16px; color: #86868b; text-align: center;">
            Hi ${data.attendeeName}, your ticket is ready
          </p>

          <!-- Event Card -->
          <div style="background: linear-gradient(135deg, #333 0%, #1a1a1a 100%); border-radius: 20px; padding: 32px; color: white; margin-bottom: 32px;">
            <h3 style="margin: 0 0 24px; font-size: 24px; font-weight: 700;">${data.eventName}</h3>

            <div style="margin-bottom: 16px;">
              <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: rgba(255,255,255,0.6); letter-spacing: 1px;">Date & Time</p>
              <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600;">${data.eventDate} at ${data.eventTime}</p>
            </div>

            <div style="margin-bottom: 16px;">
              <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: rgba(255,255,255,0.6); letter-spacing: 1px;">Location</p>
              <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600;">${data.eventLocation}</p>
            </div>

            <div style="display: flex; gap: 24px;">
              <div>
                <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: rgba(255,255,255,0.6); letter-spacing: 1px;">Ticket Type</p>
                <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600;">${data.ticketType}</p>
              </div>
              <div>
                <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: rgba(255,255,255,0.6); letter-spacing: 1px;">Quantity</p>
                <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600;">${data.quantity} ticket${data.quantity > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          <!-- QR Code Section -->
          <div style="text-align: center; padding: 32px; background-color: #f8f8f8; border-radius: 16px; margin-bottom: 32px;">
            <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #333;">Your Entry QR Code</p>

            <!-- QR Code placeholder - will be generated dynamically -->
            <div style="display: inline-block; padding: 16px; background-color: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data.qrCodeData)}" alt="QR Code" width="180" height="180" style="display: block;" />
            </div>

            <p style="margin: 16px 0 0; font-size: 12px; color: #86868b;">
              Show this QR code at the venue entrance
            </p>
          </div>

          <!-- Ticket ID -->
          <div style="background-color: #fef3c7; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 32px;">
            <p style="margin: 0; font-size: 12px; color: #92400e; font-weight: 600; text-transform: uppercase;">Ticket ID</p>
            <p style="margin: 4px 0 0; font-size: 18px; color: #92400e; font-weight: 700; font-family: monospace;">${data.ticketId}</p>
          </div>

          <!-- Download Button -->
          <a href="${data.ticketUrl}" style="display: block; background-color: #333; color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center;">
            Download Ticket PDF
          </a>

          <p style="margin: 24px 0 0; font-size: 14px; color: #86868b; text-align: center;">
            You can also access your ticket in the Tikiti app
          </p>
        </div>

        <!-- Tips -->
        <div style="background-color: white; border-radius: 16px; padding: 24px; margin-top: 16px; border: 1px solid rgba(0,0,0,0.1);">
          <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #333;">📋 Event Day Tips</p>
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
    `,
  },

  teamInvitation: {
    subject: 'You\'ve been invited to join {orgName} on Tikiti',
    getHtml: (data: {
      inviteeName: string;
      orgName: string;
      inviterName: string;
      role: string;
      inviteUrl: string;
      expiresIn: string;
    }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Join ${data.orgName}</title>
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
          <h2 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #333;">You're Invited!</h2>

          <p style="margin: 0 0 24px; font-size: 16px; color: #333; line-height: 1.6;">
            Hi${data.inviteeName ? ` ${data.inviteeName}` : ''},
          </p>

          <p style="margin: 0 0 24px; font-size: 16px; color: #333; line-height: 1.6;">
            <strong>${data.inviterName}</strong> has invited you to join <strong>${data.orgName}</strong> on Tikiti as a <strong style="text-transform: capitalize;">${data.role.replace('_', ' ')}</strong>.
          </p>

          <p style="margin: 0 0 24px; font-size: 16px; color: #333; line-height: 1.6;">
            Tikiti is an event management platform that helps you create, manage, and track events with ease.
          </p>

          <div style="background-color: #f0f0f0; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
            <p style="margin: 0; font-size: 14px; color: #86868b;">
              <strong style="color: #333;">Organization:</strong> ${data.orgName}
            </p>
            <p style="margin: 8px 0 0; font-size: 14px; color: #86868b;">
              <strong style="color: #333;">Your Role:</strong> <span style="text-transform: capitalize;">${data.role.replace('_', ' ')}</span>
            </p>
            <p style="margin: 8px 0 0; font-size: 14px; color: #86868b;">
              <strong style="color: #333;">Invited by:</strong> ${data.inviterName}
            </p>
          </div>

          <a href="${data.inviteUrl}" style="display: inline-block; background-color: #333; color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Accept Invitation
          </a>

          <p style="margin: 24px 0 0; font-size: 14px; color: #86868b;">
            This invitation will expire in ${data.expiresIn}.
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="margin: 0; font-size: 14px; color: #86868b;">
            &copy; ${new Date().getFullYear()} Tikiti Events. All rights reserved.
          </p>
          <p style="margin: 8px 0 0; font-size: 12px; color: #86868b;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  },

  eventUpdate: {
    subject: 'Important Update for {eventName}',
    getHtml: (data: {
      attendeeName: string;
      eventName: string;
      organizationName: string;
      changes: Array<{
        field: string;
        oldValue: string;
        newValue: string;
      }>;
      eventDate: string;
      eventTime: string;
      eventLocation: string;
      eventUrl: string;
    }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Update: ${data.eventName}</title>
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
              ⚠️ Event Update
            </span>
          </div>

          <h2 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #333; text-align: center;">Important Event Update</h2>

          <p style="margin: 0 0 24px; font-size: 16px; color: #333; line-height: 1.6;">
            Hi ${data.attendeeName},
          </p>

          <p style="margin: 0 0 24px; font-size: 16px; color: #333; line-height: 1.6;">
            <strong>${data.organizationName}</strong> has made some updates to <strong>${data.eventName}</strong>. Please review the changes below:
          </p>

          <!-- Changes -->
          <div style="background-color: #fff7ed; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #c2410c;">What's Changed:</p>
            ${data.changes.map(change => `
            <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(194, 65, 12, 0.2);">
              <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; color: #c2410c; letter-spacing: 1px;">${change.field}</p>
              <p style="margin: 0; font-size: 14px; color: #86868b; text-decoration: line-through;">${change.oldValue}</p>
              <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #333;">${change.newValue}</p>
            </div>
            `).join('')}
          </div>

          <!-- Updated Event Details -->
          <div style="background-color: #f0f0f0; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
            <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #333;">Updated Event Details:</p>
            <div style="margin-bottom: 8px;">
              <p style="margin: 0; font-size: 12px; color: #86868b;">Date & Time</p>
              <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #333;">${data.eventDate} at ${data.eventTime}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; color: #86868b;">Location</p>
              <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #333;">${data.eventLocation}</p>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${data.eventUrl}" style="display: inline-block; background-color: #333; color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px;">
              View Event Details
            </a>
          </div>

          <p style="margin: 24px 0 0; font-size: 14px; color: #86868b; text-align: center;">
            Your ticket is still valid. Please make note of the updated details.
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="margin: 0; font-size: 14px; color: #86868b;">
            &copy; ${new Date().getFullYear()} Tikiti Events. All rights reserved.
          </p>
          <p style="margin: 8px 0 0; font-size: 12px; color: #86868b;">
            You're receiving this email because you have a ticket for this event.
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  },

  eventCancellation: {
    subject: 'Event Cancelled: {eventName}',
    getHtml: (data: {
      attendeeName: string;
      eventName: string;
      organizationName: string;
      eventDate: string;
      eventLocation: string;
      refundInfo?: string;
      contactEmail?: string;
    }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Cancelled: ${data.eventName}</title>
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
            <span style="display: inline-block; background-color: #fee2e2; color: #dc2626; padding: 8px 16px; border-radius: 50px; font-size: 14px; font-weight: 600;">
              Event Cancelled
            </span>
          </div>

          <h2 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #333; text-align: center;">Event Cancellation Notice</h2>

          <p style="margin: 0 0 24px; font-size: 16px; color: #333; line-height: 1.6;">
            Hi ${data.attendeeName},
          </p>

          <p style="margin: 0 0 24px; font-size: 16px; color: #333; line-height: 1.6;">
            We regret to inform you that <strong>${data.eventName}</strong> by <strong>${data.organizationName}</strong> has been cancelled.
          </p>

          <!-- Cancelled Event Details -->
          <div style="background-color: #fef2f2; border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 1px solid #fecaca;">
            <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #dc2626;">Cancelled Event:</p>
            <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #333;">${data.eventName}</p>
            <p style="margin: 0 0 4px; font-size: 14px; color: #86868b;">Originally scheduled: ${data.eventDate}</p>
            <p style="margin: 0; font-size: 14px; color: #86868b;">Location: ${data.eventLocation}</p>
          </div>

          ${data.refundInfo ? `
          <!-- Refund Information -->
          <div style="background-color: #f0fdf4; border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
            <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #16a34a;">Refund Information:</p>
            <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.6;">${data.refundInfo}</p>
          </div>
          ` : ''}

          <p style="margin: 0 0 24px; font-size: 16px; color: #333; line-height: 1.6;">
            We sincerely apologize for any inconvenience this may cause. Thank you for your understanding.
          </p>

          ${data.contactEmail ? `
          <p style="margin: 0 0 24px; font-size: 14px; color: #86868b; line-height: 1.6;">
            If you have any questions, please contact the organizer at <a href="mailto:${data.contactEmail}" style="color: #333; text-decoration: underline;">${data.contactEmail}</a>
          </p>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="margin: 0; font-size: 14px; color: #86868b;">
            &copy; ${new Date().getFullYear()} Tikiti Events. All rights reserved.
          </p>
          <p style="margin: 8px 0 0; font-size: 12px; color: #86868b;">
            You're receiving this email because you had a ticket for this event.
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  },

  speakerInvitation: {
    subject: 'You\'re invited to speak at {eventName}',
    getHtml: (data: {
      speakerName: string;
      eventName: string;
      sessionTitle?: string;
      organizationName: string;
      inviterName: string;
      role: string;
      profileUrl: string;
      personalMessage?: string;
      expiresIn: string;
    }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Speak at ${data.eventName}</title>
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
            <span style="display: inline-block; background-color: #e0f2fe; color: #0369a1; padding: 8px 16px; border-radius: 50px; font-size: 14px; font-weight: 600;">
              Speaker Invitation
            </span>
          </div>

          <h2 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #333; text-align: center;">You're Invited to Speak!</h2>

          <p style="margin: 0 0 24px; font-size: 16px; color: #333; line-height: 1.6;">
            Hi${data.speakerName ? ` ${data.speakerName}` : ''},
          </p>

          <p style="margin: 0 0 24px; font-size: 16px; color: #333; line-height: 1.6;">
            <strong>${data.inviterName}</strong> from <strong>${data.organizationName}</strong> would like to invite you to be a <strong style="text-transform: capitalize;">${data.role}</strong> at <strong>${data.eventName}</strong>.
          </p>

          ${data.sessionTitle ? `
          <p style="margin: 0 0 24px; font-size: 16px; color: #333; line-height: 1.6;">
            <strong>Session:</strong> ${data.sessionTitle}
          </p>
          ` : ''}

          ${data.personalMessage ? `
          <div style="background-color: #f8f8f8; border-left: 4px solid #333; padding: 16px 20px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #666; font-style: italic;">
              "${data.personalMessage}"
            </p>
            <p style="margin: 8px 0 0; font-size: 12px; color: #999;">
              - ${data.inviterName}
            </p>
          </div>
          ` : ''}

          <div style="background-color: #f0f0f0; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
            <p style="margin: 0 0 8px; font-size: 14px; color: #86868b;">
              <strong style="color: #333;">Event:</strong> ${data.eventName}
            </p>
            <p style="margin: 0 0 8px; font-size: 14px; color: #86868b;">
              <strong style="color: #333;">Organization:</strong> ${data.organizationName}
            </p>
            <p style="margin: 0; font-size: 14px; color: #86868b;">
              <strong style="color: #333;">Your Role:</strong> <span style="text-transform: capitalize;">${data.role}</span>
            </p>
          </div>

          <p style="margin: 0 0 24px; font-size: 16px; color: #333; line-height: 1.6;">
            To accept this invitation, please click the button below to complete your speaker profile. We'll need your bio, photo, and a few other details for the event program.
          </p>

          <div style="text-align: center;">
            <a href="${data.profileUrl}" style="display: inline-block; background-color: #333; color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Complete Your Profile
            </a>
          </div>

          <p style="margin: 24px 0 0; font-size: 14px; color: #86868b; text-align: center;">
            This invitation will expire in ${data.expiresIn}.
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="margin: 0; font-size: 14px; color: #86868b;">
            &copy; ${new Date().getFullYear()} Tikiti Events. All rights reserved.
          </p>
          <p style="margin: 8px 0 0; font-size: 12px; color: #86868b;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  },
};

// Email service functions
export const emailService = {
  /**
   * Send welcome email when organization is created
   */
  async sendWelcomeEmail(data: {
    email: string;
    name: string;
    orgName: string;
  }): Promise<boolean> {
    try {
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;

      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.subject = EMAIL_TEMPLATES.welcomeOrganization.subject;
      sendSmtpEmail.htmlContent = EMAIL_TEMPLATES.welcomeOrganization.getHtml({
        name: data.name,
        orgName: data.orgName,
        loginUrl,
      });
      sendSmtpEmail.sender = {
        name: 'Tikiti',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@tikiti.com',
      };
      sendSmtpEmail.to = [{ email: data.email, name: data.name }];

      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`Welcome email sent to ${data.email}`);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  },

  /**
   * Send team invitation email
   */
  async sendInvitationEmail(data: {
    email: string;
    inviteeName?: string;
    orgName: string;
    inviterName: string;
    role: string;
    inviteToken: string;
  }): Promise<boolean> {
    try {
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${data.inviteToken}`;

      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.subject = EMAIL_TEMPLATES.teamInvitation.subject.replace('{orgName}', data.orgName);
      sendSmtpEmail.htmlContent = EMAIL_TEMPLATES.teamInvitation.getHtml({
        inviteeName: data.inviteeName || '',
        orgName: data.orgName,
        inviterName: data.inviterName,
        role: data.role,
        inviteUrl,
        expiresIn: '7 days',
      });
      sendSmtpEmail.sender = {
        name: 'Tikiti',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@tikiti.com',
      };
      sendSmtpEmail.to = [{ email: data.email, name: data.inviteeName || data.email }];

      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`Invitation email sent to ${data.email}`);
      return true;
    } catch (error) {
      console.error('Error sending invitation email:', error);
      return false;
    }
  },

  /**
   * Send ticket confirmation email with QR code
   */
  async sendTicketEmail(data: {
    email: string;
    attendeeName: string;
    eventName: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    ticketType: string;
    quantity: number;
    ticketId: string;
    bookingId: string;
    eventId: string;
  }): Promise<boolean> {
    try {
      // Generate QR code data (booking ID for scanning)
      const qrCodeData = JSON.stringify({
        bookingId: data.bookingId,
        eventId: data.eventId,
        ticketId: data.ticketId,
      });

      // Generate ticket PDF URL
      const ticketData = encodeURIComponent(JSON.stringify({
        event: {
          name: data.eventName,
          date: data.eventDate,
          time: data.eventTime,
          location: data.eventLocation,
        },
        user: {
          name: data.attendeeName,
        },
        ticket: {
          ticketId: data.ticketId,
          bookingId: data.bookingId,
          eventId: data.eventId,
          quantity: data.quantity,
        },
      }));
      const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/ticket-pdf.html?data=${ticketData}`;

      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.subject = EMAIL_TEMPLATES.ticketConfirmation.subject.replace('{eventName}', data.eventName);
      sendSmtpEmail.htmlContent = EMAIL_TEMPLATES.ticketConfirmation.getHtml({
        attendeeName: data.attendeeName,
        eventName: data.eventName,
        eventDate: data.eventDate,
        eventTime: data.eventTime,
        eventLocation: data.eventLocation,
        ticketType: data.ticketType,
        quantity: data.quantity,
        ticketId: data.ticketId,
        qrCodeData,
        ticketUrl,
      });
      sendSmtpEmail.sender = {
        name: 'Tikiti',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@tikiti.com',
      };
      sendSmtpEmail.to = [{ email: data.email, name: data.attendeeName }];

      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`Ticket email sent to ${data.email} for event: ${data.eventName}`);
      return true;
    } catch (error) {
      console.error('Error sending ticket email:', error);
      return false;
    }
  },

  /**
   * Send speaker invitation email
   */
  async sendSpeakerInvitationEmail(data: {
    email: string;
    speakerName?: string;
    eventName: string;
    sessionTitle?: string;
    organizationName: string;
    inviterName: string;
    role: string;
    inviteToken: string;
    personalMessage?: string;
  }): Promise<boolean> {
    try {
      const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/speaker/${data.inviteToken}`;

      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.subject = EMAIL_TEMPLATES.speakerInvitation.subject.replace(
        '{eventName}',
        data.eventName
      );
      sendSmtpEmail.htmlContent = EMAIL_TEMPLATES.speakerInvitation.getHtml({
        speakerName: data.speakerName || '',
        eventName: data.eventName,
        sessionTitle: data.sessionTitle,
        organizationName: data.organizationName,
        inviterName: data.inviterName,
        role: data.role,
        profileUrl,
        personalMessage: data.personalMessage,
        expiresIn: '14 days',
      });
      sendSmtpEmail.sender = {
        name: 'Tikiti',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@tikiti.com',
      };
      sendSmtpEmail.to = [
        { email: data.email, name: data.speakerName || data.email },
      ];

      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`Speaker invitation email sent to ${data.email}`);
      return true;
    } catch (error) {
      console.error('Error sending speaker invitation email:', error);
      return false;
    }
  },

  /**
   * Send event update notification email
   */
  async sendEventUpdateEmail(data: {
    email: string;
    attendeeName: string;
    eventName: string;
    organizationName: string;
    changes: Array<{
      field: string;
      oldValue: string;
      newValue: string;
    }>;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    eventId: string;
  }): Promise<boolean> {
    try {
      const eventUrl = `${process.env.NEXT_PUBLIC_WEB_URL || 'https://gettikiti.com'}/events/${data.eventId}`;

      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.subject = EMAIL_TEMPLATES.eventUpdate.subject.replace(
        '{eventName}',
        data.eventName
      );
      sendSmtpEmail.htmlContent = EMAIL_TEMPLATES.eventUpdate.getHtml({
        attendeeName: data.attendeeName,
        eventName: data.eventName,
        organizationName: data.organizationName,
        changes: data.changes,
        eventDate: data.eventDate,
        eventTime: data.eventTime,
        eventLocation: data.eventLocation,
        eventUrl,
      });
      sendSmtpEmail.sender = {
        name: 'Tikiti',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@tikiti.com',
      };
      sendSmtpEmail.to = [{ email: data.email, name: data.attendeeName }];

      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`Event update email sent to ${data.email}`);
      return true;
    } catch (error) {
      console.error('Error sending event update email:', error);
      return false;
    }
  },

  /**
   * Send event cancellation notification email
   */
  async sendEventCancellationEmail(data: {
    email: string;
    attendeeName: string;
    eventName: string;
    organizationName: string;
    eventDate: string;
    eventLocation: string;
    refundInfo?: string;
    contactEmail?: string;
  }): Promise<boolean> {
    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.subject = EMAIL_TEMPLATES.eventCancellation.subject.replace(
        '{eventName}',
        data.eventName
      );
      sendSmtpEmail.htmlContent = EMAIL_TEMPLATES.eventCancellation.getHtml({
        attendeeName: data.attendeeName,
        eventName: data.eventName,
        organizationName: data.organizationName,
        eventDate: data.eventDate,
        eventLocation: data.eventLocation,
        refundInfo: data.refundInfo,
        contactEmail: data.contactEmail,
      });
      sendSmtpEmail.sender = {
        name: 'Tikiti',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@tikiti.com',
      };
      sendSmtpEmail.to = [{ email: data.email, name: data.attendeeName }];

      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`Event cancellation email sent to ${data.email}`);
      return true;
    } catch (error) {
      console.error('Error sending event cancellation email:', error);
      return false;
    }
  },

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      const accountApi = new brevo.AccountApi();
      accountApi.setApiKey(
        brevo.AccountApiApiKeys.apiKey,
        process.env.BREVO_API_KEY || ''
      );
      await accountApi.getAccount();
      console.log('Brevo connection successful');
      return true;
    } catch (error) {
      console.error('Brevo connection failed:', error);
      return false;
    }
  },
};

export default emailService;
