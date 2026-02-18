import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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
    } = await request.json();

    // Validate required fields
    if (!userEmail || !userName || !eventName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get Brevo API key from environment variable
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      console.error('❌ Brevo API key not found in environment variables');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
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

    // Generate ticket ID
    const ticketId = bookingReference || `TK-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();

    // Generate QR code data for scanning at check-in
    const qrCodeData = JSON.stringify({
      bookingId: bookingId || 'N/A',
      eventId: eventId || 'N/A',
      ticketId: ticketId,
    });

    // Generate QR code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrCodeData)}`;

    // Generate ticket PDF URL
    const ticketPdfData = encodeURIComponent(JSON.stringify({
      event: {
        name: eventName,
        date: eventDate || 'TBD',
        time: eventTime || 'TBD',
        location: locationText,
      },
      user: {
        name: userName,
      },
      ticket: {
        ticketId: ticketId,
        bookingId: bookingId,
        eventId: eventId,
        quantity: quantity || 1,
      },
    }));
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tikiti-event-app.vercel.app';
    const ticketUrl = `${baseUrl}/ticket-pdf.html?data=${ticketPdfData}`;

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Ticket for ${eventName}</title>
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
            Hi ${userName}, your ticket is ready
          </p>

          <!-- Event Card -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
            <tr>
              <td style="background-color: #333333; border-radius: 20px; padding: 32px;">
                <h3 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #ffffff;">${eventName}</h3>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding-bottom: 16px;">
                      <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: #999999; letter-spacing: 1px;">Date & Time</p>
                      <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #ffffff;">${eventDate || 'TBD'} at ${eventTime || 'TBD'}</p>
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
                            <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #ffffff;">${quantity || 1} ticket${(quantity || 1) > 1 ? 's' : ''}</p>
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

          <!-- Download Button -->
          <a href="${ticketUrl}" style="display: block; background-color: #333; color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center;">
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
    `;

    // Send email via Brevo API
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
        to: [
          {
            email: userEmail,
            name: userName,
          }
        ],
        subject: `🎫 Your Ticket for ${eventName}`,
        htmlContent: emailHtml,
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Email sent successfully via Brevo:', result.messageId);
      return NextResponse.json({
        success: true,
        message: 'Ticket email sent successfully!',
        ticketId: ticketId,
      });
    } else {
      const errorData = await response.text();
      console.error('❌ Brevo API error:', response.status, errorData);
      return NextResponse.json({
        success: false,
        error: `Email service error: ${response.status}`
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Email sending failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send email. Please try again.'
    }, { status: 500 });
  }
}
