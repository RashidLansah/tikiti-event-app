# Email Setup Instructions

## Brevo (Sendinblue) Configuration

Tikiti uses Brevo for all transactional emails across both the mobile app and web dashboard.

### 1. Get Brevo API Key

1. Sign up for a Brevo account at [app.brevo.com](https://app.brevo.com)
2. Go to **Settings > SMTP & API > API Keys**
3. Create a new API key (or copy the existing one)
4. The key starts with `xkeysib-...`

### 2. Set Environment Variables

#### Mobile App (Expo)

Create a `.env` file in the project root:

```env
# Brevo Configuration
EXPO_PUBLIC_BREVO_API_KEY=xkeysib-your-api-key-here
EXPO_PUBLIC_BREVO_SENDER_EMAIL=noreply@gettikiti.com
```

#### Web Dashboard (Vercel)

Set these in your Vercel project dashboard under **Settings > Environment Variables**:

```
BREVO_API_KEY=xkeysib-your-api-key-here
BREVO_SENDER_EMAIL=noreply@gettikiti.com
```

### 3. Domain Authentication (Recommended)

For better deliverability:

1. In the Brevo dashboard, go to **Settings > Senders, Domains & Dedicated IPs**
2. Add and verify `gettikiti.com` as a sender domain
3. Add the required DNS records (DKIM, SPF) to your domain

### 4. Test the Integration

1. Create a new user account on the mobile app
2. Check the console logs for email sending status
3. Verify the welcome email is received

## Email Types

| Email | Trigger | Platform |
|-------|---------|----------|
| Welcome Email | New user registration | Mobile |
| Ticket Confirmation | Event booking/RSVP | Mobile + Web |
| Event Reminder | 24hrs before event | Mobile |
| Welcome Organization | New org created | Web Dashboard |
| Team Invitation | Member invited | Web Dashboard |
| Speaker Invitation | Speaker invited | Web Dashboard |
| Event Update | Event details changed | Web Dashboard |
| Event Cancellation | Event cancelled | Web Dashboard |

## Features

- Personalized emails from Lansah (Founder & CEO)
- Professional HTML email templates matching Tikiti design system
- Plain text fallback for welcome & reminder emails
- Error handling (email failures won't break core functionality)
- QR code generation in ticket confirmation emails
- Branded with Tikiti colors (#333, #fefff7) and styling

## Troubleshooting

### Common Issues:

1. **API Key Not Working**
   - Verify the key starts with `xkeysib-`
   - Check that the key is active in Brevo dashboard
   - Ensure environment variable is correctly set

2. **Emails Not Delivered**
   - Check spam/junk folder
   - Verify sender domain is authenticated in Brevo
   - Check Brevo dashboard > Transactional > Logs for delivery status

3. **"Email service not configured" Error**
   - The `EXPO_PUBLIC_BREVO_API_KEY` (mobile) or `BREVO_API_KEY` (web) is missing
   - Restart the dev server after adding env variables

## Support

For issues with email functionality, contact:
- Email: lansah@gettikiti.com
- Brevo docs: https://developers.brevo.com/
