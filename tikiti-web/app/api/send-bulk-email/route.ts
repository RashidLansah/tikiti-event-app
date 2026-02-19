import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/services/emailService';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { canSendBulkEmail, getUpgradeMessage } from '@/lib/billing/featureGate';
import type { Organization } from '@/lib/services/organizationService';

interface Recipient {
  email: string;
  name: string;
}

interface RequestBody {
  recipients: Recipient[];
  subject: string;
  message: string;
  eventName: string;
  orgId?: string; // For feature gating
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { recipients, subject, message, eventName, orgId } = body;

    // Feature gate: check if org can send bulk emails
    if (orgId) {
      try {
        const db = getAdminFirestore();
        const orgDoc = await db.collection('organizations').doc(orgId).get();
        if (orgDoc.exists) {
          const org = orgDoc.data() as Organization;
          const emailCheck = canSendBulkEmail(org);
          if (!emailCheck.allowed) {
            return NextResponse.json(
              { error: getUpgradeMessage(emailCheck.requiredPlan!), upgradeRequired: true, requiredPlan: emailCheck.requiredPlan },
              { status: 403 }
            );
          }
        }
      } catch (gateError) {
        console.error('Feature gate check failed:', gateError);
        // Don't block on gate check failure — allow through
      }
    }

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients provided' },
        { status: 400 }
      );
    }

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // Get Brevo API key
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      console.error('BREVO_API_KEY not set');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    let emailsSent = 0;
    let emailsFailed = 0;

    // Send emails in batches of 10 to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const emailPromises = batch.map(async (recipient) => {
        try {
          const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': brevoApiKey,
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              sender: {
                name: 'Tikiti',
                email: process.env.BREVO_SENDER_EMAIL || 'noreply@tikiti.com',
              },
              to: [{ email: recipient.email, name: recipient.name }],
              subject: subject,
              htmlContent: buildBulkEmailHtml({
                recipientName: recipient.name,
                subject,
                message,
                eventName,
              }),
            }),
          });

          if (response.ok) {
            return true;
          } else {
            const errorText = await response.text();
            console.error(`Failed to send to ${recipient.email}:`, errorText);
            return false;
          }
        } catch (err) {
          console.error(`Error sending to ${recipient.email}:`, err);
          return false;
        }
      });

      const results = await Promise.allSettled(emailPromises);
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value === true) {
          emailsSent++;
        } else {
          emailsFailed++;
        }
      });
    }

    console.log(
      `Bulk email: ${emailsSent} sent, ${emailsFailed} failed out of ${recipients.length}`
    );

    return NextResponse.json({
      success: emailsSent > 0,
      emailsSent,
      emailsFailed,
      totalRecipients: recipients.length,
    });
  } catch (error: any) {
    console.error('Error sending bulk emails:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send bulk emails' },
      { status: 500 }
    );
  }
}

function buildBulkEmailHtml(data: {
  recipientName: string;
  subject: string;
  message: string;
  eventName: string;
}): string {
  // Convert newlines to <br> for HTML
  const htmlMessage = data.message.replace(/\n/g, '<br>');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject}</title>
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
          <h2 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #333;">${data.subject}</h2>

          <p style="margin: 0 0 8px; font-size: 14px; color: #86868b;">
            Regarding: <strong style="color: #333;">${data.eventName}</strong>
          </p>

          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">

          <p style="margin: 0 0 8px; font-size: 16px; color: #333;">
            Hi ${data.recipientName},
          </p>

          <div style="margin: 16px 0; font-size: 15px; color: #333; line-height: 1.6;">
            ${htmlMessage}
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="margin: 0; font-size: 14px; color: #86868b;">
            &copy; ${new Date().getFullYear()} Tikiti Events. All rights reserved.
          </p>
          <p style="margin: 8px 0 0; font-size: 12px; color: #86868b;">
            This message was sent by the organizer of ${data.eventName} via Tikiti.
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
