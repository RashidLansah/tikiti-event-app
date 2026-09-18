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

## Submitter templates (approved / rejected)

When an admin approves or rejects a WhatsApp submission, the submitter gets a text
(`lib/inbox/notifySubmitter.ts`). Outside their 24h window the same fallback applies, so
create two more **Utility** templates (English, body only) and set their names in the env:

| Env var | Template name | Body |
| --- | --- | --- |
| `WHATSAPP_TPL_EVENT_LIVE` | `tikiti_event_live` | `Your event "{{1}}" is now live on Tikiti: {{2}}` |
| `WHATSAPP_TPL_EVENT_NOT_LISTED` | `tikiti_event_not_listed` | `Thanks for sending "{{1}}". We couldn't list it because {{2}}. You're welcome to send other upcoming events anytime.` |

Sample values: live `{{1}}` = `Accra Jazz Night`, `{{2}}` = `https://www.gettikiti.com/events/abc123`;
not listed `{{1}}` = `Accra Jazz Night`, `{{2}}` = `the event has already taken place`.

```
WHATSAPP_TPL_EVENT_LIVE=tikiti_event_live
WHATSAPP_TPL_EVENT_NOT_LISTED=tikiti_event_not_listed
```

The outcome is stored on the inbox doc as `submitterNotified` (`sent` / `template` / `failed` /
`skipped`) and shown on the admin inbox cards.
