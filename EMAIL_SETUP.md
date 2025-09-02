# Email Setup Instructions

## SendGrid Configuration

To enable welcome emails from Lansah (Founder & CEO), you need to set up SendGrid:

### 1. Get SendGrid API Key

1. Sign up for a SendGrid account at [sendgrid.com](https://sendgrid.com)
2. Go to Settings > API Keys
3. Create a new API key with "Full Access" permissions
4. Copy the API key

### 2. Set Environment Variables

Create a `.env` file in your project root with:

```env
# SendGrid Configuration (same as existing email service)
EXPO_PUBLIC_SENDGRID_API_KEY=your-sendgrid-api-key-here

# Email Configuration
FROM_EMAIL=lansah@gettikiti.com
FROM_NAME=Lansah (Founder & CEO)
```

### 3. Update Email Service

In `src/services/emailService.js`, the API key is already configured to use the same key as your existing email service:

```javascript
// Already configured to use the same API key as ticket confirmations
sgMail.setApiKey(process.env.EXPO_PUBLIC_SENDGRID_API_KEY || 'YOUR_SENDGRID_API_KEY_HERE');
```

### 4. Domain Authentication (Recommended)

For better deliverability:

1. In SendGrid dashboard, go to Settings > Sender Authentication
2. Set up Domain Authentication for `gettikiti.com`
3. Add the required DNS records to your domain

### 5. Test the Integration

1. Create a new user account
2. Check the console logs for email sending status
3. Verify the welcome email is received

## Email Templates

The system includes:

- **Welcome Email**: Sent when users create an account
- **Event Reminder Email**: Sent 24 hours before events (future feature)

## Features

- ✅ Personalized welcome emails from Founder & CEO
- ✅ Professional HTML email templates
- ✅ Plain text fallback
- ✅ Error handling (email failures won't break registration)
- ✅ Branded with Tikiti colors and styling

## Troubleshooting

### Common Issues:

1. **API Key Not Working**
   - Verify the API key is correct
   - Check API key permissions
   - Ensure the key has "Full Access"

2. **Emails Not Delivered**
   - Check spam folder
   - Verify sender authentication
   - Check SendGrid activity logs

3. **Template Issues**
   - Verify HTML is valid
   - Test with different email clients
   - Check console for errors

## Support

For issues with email functionality, contact:
- Email: lansah@gettikiti.com
- Or check SendGrid documentation
