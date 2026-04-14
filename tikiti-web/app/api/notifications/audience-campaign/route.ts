import { NextRequest, NextResponse } from 'next/server';
import * as brevo from '@getbrevo/brevo';
import { serverDb } from '@/lib/firebase/server-config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

// Initialise Brevo (same pattern as emailService.ts)
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY || ''
);

interface RequestBody {
  filters: {
    category?: string;
    interests?: string[];
  };
  subject: string;
  message: string;
  organizationName: string;
  organizationEmail?: string;
  eventName?: string;
  eventId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { filters, subject, message, organizationName, organizationEmail, eventName, eventId } = body;

    if (!subject || !message || !organizationName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Query users who have consented to organizer contact
    const usersRef = collection(serverDb, 'users');
    const constraints: any[] = [
      where('allowOrganizerContact', '==', true),
      limit(500),
    ];
    if (filters.category) {
      constraints.push(
        where(`eventStats.categoriesAttended.${filters.category}`, '>=', 1)
      );
    }

    const snap = await getDocs(query(usersRef, ...constraints));

    // 2. Build recipient list — filter by interests client-side (Firestore can't do array-contains-any + other filters)
    const recipients: Array<{ email: string; name: string }> = [];

    snap.forEach((doc) => {
      const data = doc.data();
      const email = data.email || data.userEmail;
      if (!email) return;

      // Interest filter (client-side)
      if (filters.interests && filters.interests.length > 0) {
        const userInterests: string[] = data.interests || [];
        const hasMatch = filters.interests.some((tag) => userInterests.includes(tag));
        if (!hasMatch) return;
      }

      recipients.push({
        email,
        name: data.displayName || data.name || email.split('@')[0],
      });
    });

    if (recipients.length === 0) {
      return NextResponse.json({ success: true, emailsSent: 0, message: 'No matching recipients found' });
    }

    // 3. Build HTML email body
    const eventUrl = eventId
      ? `${process.env.NEXT_PUBLIC_WEB_URL || 'https://gettikiti.com'}/event/${eventId}`
      : null;

    const htmlBody = buildCampaignHtml({
      organizationName,
      subject,
      message,
      eventName,
      eventUrl,
    });

    const senderEmail = organizationEmail || process.env.BREVO_SENDER_EMAIL || 'noreply@tikiti.com';

    // 4. Send emails (sequentially to respect Brevo rate limits)
    let sent = 0;
    let failed = 0;

    // Deduplicate
    const unique = recipients.filter(
      (r, i, self) => i === self.findIndex((s) => s.email === r.email)
    );

    for (const recipient of unique) {
      try {
        const email = new brevo.SendSmtpEmail();
        email.subject = subject;
        email.htmlContent = htmlBody.replace('{{NAME}}', recipient.name);
        email.sender = { name: organizationName, email: senderEmail };
        email.to = [{ email: recipient.email, name: recipient.name }];
        // Reply-to the organizer if they provided an email
        if (organizationEmail) {
          email.replyTo = { email: organizationEmail, name: organizationName };
        }
        await apiInstance.sendTransacEmail(email);
        sent++;
      } catch {
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent: sent,
      failed,
      totalMatched: unique.length,
    });
  } catch (error: any) {
    console.error('[audience-campaign] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── Email template ───────────────────────────────────────────────────────────

function buildCampaignHtml({
  organizationName,
  subject,
  message,
  eventName,
  eventUrl,
}: {
  organizationName: string;
  subject: string;
  message: string;
  eventName?: string;
  eventUrl?: string | null;
}): string {
  const formattedMessage = message
    .split('\n')
    .map((line) => `<p style="margin:0 0 12px 0;color:#333;font-size:15px;line-height:1.6;">${line || '&nbsp;'}</p>`)
    .join('');

  const ctaBlock =
    eventUrl && eventName
      ? `<div style="text-align:center;margin:32px 0;">
           <a href="${eventUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">${eventName ? `See ${eventName}` : 'View Event'}</a>
         </div>`
      : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#111;padding:28px 40px;">
            <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">${organizationName}</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">via Tikiti</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#111;">${subject}</h1>
            <p style="margin:0 0 8px;color:#888;font-size:13px;">Hi {{NAME}},</p>
            ${formattedMessage}
            ${ctaBlock}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:24px 40px;border-top:1px solid #eee;">
            <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6;">
              You're receiving this because you opted in to event recommendations on Tikiti.
              You can update your preferences in your Tikiti profile settings.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
