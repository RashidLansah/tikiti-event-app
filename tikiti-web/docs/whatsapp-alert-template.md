# WhatsApp admin-alert template

Admins get a WhatsApp text whenever an accepted flyer lands in the community inbox
(`lib/inbox/notifyAdmins.ts`, phones from `INBOX_ADMIN_PHONES`). Free-form texts only
deliver inside the 24-hour customer-service window, i.e. when the admin has messaged the
Tikiti number in the last 24 hours. Outside that window Meta rejects the text (error
131047), so we fall back to an approved **utility template**.

## Create the template

1. Open **WhatsApp Manager → Account tools → Message templates → Create template**.
2. Category: **Utility**. Name: `tikiti_new_submission`. Language: **English**.
3. Body (no header/footer/buttons needed):

   ```
   New event flyer submitted: {{1}} (from {{2}}). Review it in the Tikiti admin inbox.
   ```

   Sample values for review: `{{1}}` = `Accra Jazz Night`, `{{2}}` = `Kofi`.
4. Submit and wait for approval (usually minutes to a few hours).

## Enable it

After approval, set in `.env.local` (and the production env):

```
WHATSAPP_ALERT_TEMPLATE=tikiti_new_submission
```

Until it is set, alerts outside the 24h window are logged as failures and skipped.
Admins can reopen the window at any time by sending any message to the Tikiti number.
