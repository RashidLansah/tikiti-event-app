# Audience data foundation

One record per person, keyed by phone, with per-channel consent, behaviour signals and opt-out.

> **Not built yet: sending.** Nothing in this code sends WhatsApp, SMS or email promotions. There is no blast,
> campaign or export feature. `lastContactedAt` and `unsubscribeToken()` exist so a future sender can use them.
> Contacts without an opted-in channel are insight-only and must never be messaged.

## Data model — collection `audience` (`lib/audience/types.ts`)

Doc id: normalised phone digits (E.164 without plus, e.g. `233241234567`), or `e_` + first 24 hex of
sha256(lowercased email) when there is no phone. If an email-keyed contact later supplies a phone, it is merged
into the phone-keyed doc and the old doc is deleted.

| Field | Notes |
| --- | --- |
| `phone?`, `email?` | E.164 digits / lowercased |
| `name?`, `city?`, `profession?`, `uid?` | never overwritten by an empty value |
| `interests: string[]` | subset of `INTEREST_TAGS` (`lib/audience/interests.ts`, re-exported by `userProfileService`) |
| `priceComfort?` | `free` \| `up_to_50` \| `up_to_100` \| `up_to_200` \| `over_200` |
| `channels` | `{ whatsapp?, sms?, email? }`, each `{ optedIn, at, source, wordingVersion }` |
| `consentLog` | `{ channel \| 'all', action: 'opt_in' \| 'opt_out', at, source, wordingVersion? }`, max 40, newest last |
| `sources` | every `AudienceSource` that touched the contact |
| `signals` | `views, registerClicks, contactClicks, registrations, paidBookings, paidTotalPesewas, attended, botQueries`, `categories{slug:n}`, `cities{slug:n}`, `lastActiveAt` |
| `createdAt`, `updatedAt`, `lastContactedAt?` | |

Firestore rules deny all client access (`match /audience/{id}`); only the Admin SDK reads/writes.

## Consent (`lib/audience/consent.ts`)

- `CONSENT_VERSION = 'v1-2026-09'`
- `CONSENT_TEXT`: "Tikiti may send me events that match my interests. I can stop anytime by replying STOP or using the unsubscribe link."
- `SHORT_CONSENT_TEXT`: "Tell me about similar events"

A channel is only marked `optedIn` by a call that carries explicit consent, and only if the contact has that
channel's identifier (whatsapp/sms need a phone, email needs an email). Merges without consent never touch
`channels`, so an opted-out channel stays opted out. Bump the version whenever the wording changes.

## Capture sources

| Source | Where | Consent? |
| --- | --- | --- |
| `google_form` | `scripts/import-audience-csv.ts` | yes if the row says "I agree" |
| `web_event_prompt`, `web_signup` | `POST /api/audience/subscribe` | always (required) |
| `registration` | `deliverTicket` in `lib/payments/tickets.ts` (paid + free bookings), or subscribe API | only if booking has `marketingConsent` |
| `ussd` | same hook, when `booking.source === 'ussd'` | only if `marketingConsent` |
| `backfill` | `scripts/backfill-audience.ts` | never |
| `whatsapp_bot`, `import` | reserved for later capture points | — |

Booking hook: bookings may carry `marketingConsent?: { channels: AudienceChannel[]; wordingVersion?: string }`.
The hook upserts the contact, records a `registration` or `paid_booking` signal (with `amountPesewas = gross`
and the event's category/city) and sets `audienceRecorded: true` on the booking so it runs once. It never throws.

## API

### `POST /api/audience/subscribe` (public, 8 requests / 10 min / IP)

```
{ name?, phone?, email?, city?, interests?, priceComfort?,
  channels: AudienceChannel[],
  source: 'web_event_prompt' | 'web_signup' | 'registration',
  eventId?, consent: true, wordingVersion? }
```

Rejected (400) unless `consent === true`, there is a usable phone or email, and at least one channel has its
identifier. With `eventId`, the event (`events`, then `scraped_events`) contributes `categoryToInterest(category)`
and, when `city` is absent, its city (text before the first comma of `city`/`location`). Returns `{ ok: true }`
only and sets the `tk_cid` cookie.

### `POST /api/audience/unsubscribe`

`{ token, channel?: 'whatsapp' | 'sms' | 'email' | 'all' }` (default `all`) → `{ ok: true }`.
`GET /api/audience/unsubscribe?t=<token>` returns `{ masked }` for the confirm page at `/unsubscribe?t=<token>`.
Tokens: `unsubscribeToken(contactId)` = `${contactId}.${first 16 hex of HMAC-SHA256}` using `AUDIENCE_SECRET`
(falls back to `CRON_SECRET`).

### `GET /api/admin/audience/summary` (admin bearer token)

Returns `segmentCounts`: totals, reachable per channel, paid before, new in 7/30 days, by city (top 10), by
interest, by source. Shown at `/admin/audience`. No contact records, no export.

## How `tk_cid` links later activity

`/api/audience/subscribe` sets `tk_cid=<contactId>` (httpOnly, sameSite lax, secure in production, 1 year).
`POST /api/events/[id]/track` reads it and mirrors `view` / `register_click` / `contact_click` onto the contact's
`signals`, with the event's category and city. Unknown or malformed ids are ignored.

## Google Form — exact questions

| Column header | Type / options |
| --- | --- |
| `Timestamp` | added by Google Forms |
| `Full name` | short answer |
| `WhatsApp number` | short answer |
| `Email (optional)` | short answer |
| `City or area` | short answer |
| `What kinds of events interest you?` | checkboxes, options = `INTEREST_TAGS` exactly |
| `What would you pay for a ticket?` | `Free events only` \| `Up to GH₵50` \| `Up to GH₵100` \| `Up to GH₵200` \| `More than GH₵200` |
| `How should we reach you?` | checkboxes: `WhatsApp`, `SMS`, `Email` |
| `Consent` | checkbox whose label starts "I agree" followed by `CONSENT_TEXT` |

Rows without "I agree" are imported without any channel consent.

## Scripts

Both need `gcloud auth application-default login` with access to `tikiti-45ac4`. Both default to a dry run.

```
npx tsx scripts/import-audience-csv.ts responses.csv            # per-row plan + totals
npx tsx scripts/import-audience-csv.ts responses.csv --commit   # writes, source google_form, consent at = row Timestamp
npx tsx scripts/backfill-audience.ts                            # counts only
npx tsx scripts/backfill-audience.ts --commit                   # contacts (no consent) + signals from confirmed/used bookings
```

The backfill dry run counts a person twice if one booking has their phone and another only their email; the
commit path merges them when a booking carries both.
