# Editing or withdrawing a WhatsApp submission

People who sent a flyer to the Tikiti WhatsApp number can fix or withdraw it by messaging the same number.
Code: `lib/inbox/submitterEdits.ts`, wired into `app/api/inbox/whatsapp/route.ts` after the admin-command branch.

## What submitters can send

| Message | Effect |
| --- | --- |
| Reply (swipe) to any of our messages about the event with the correction, e.g. `It's at 7pm, not 6` | Edits that event |
| A text with an edit cue, e.g. `change date to 12 Oct`, `venue is now Alliance Française`, `postponed to next Friday`, `new link https://…` | Edits their event |
| `withdraw` / `cancel` / `remove` (optionally + the 6-char ref) or e.g. `please remove my event` | Withdraws it |
| `undo` | Reverts their last applied edit (within 24h), or cancels a change request still waiting for review |
| A new image sent as a reply to one of our messages, or with a caption containing `replace`, `new flyer` or `updated flyer` | Replaces the flyer |
| A number (`2`) after we asked "Which event do you mean?" | Picks the event (the prompt expires after 10 minutes) |

Edit cues: `edit, change, update, correct, correction, new date, now, moved to, postponed, venue, time, link, cancel, withdraw, remove`.
A text with none of these that is not a reply goes through the normal flow (merged into a recent flyer / "please send the flyer").
Messages with a cue are interpreted by one Claude Haiku call; if it decides the message is not about the existing event
(`intent: other`) the normal flow runs as before.

Editable fields: name, description, date, endDate, startTime, endTime, location, address, city, price, isFree,
registrationUrl, joinUrl, meetingDetails, contactPhone, organiserName.

## What happens

- **Pending item** – the change is applied immediately to `extracted`, logged in `editHistory` (last 20) and the sender gets
  `Updated "{name}":` + one `• field: before → after` line per change + `Reply UNDO to revert.`
  A replaced flyer is re-extracted, with earlier manual edits re-applied on top.
- **Published item** – nothing changes on the live event. The request is stored as `pendingEdit` on the inbox item and admins
  get a WhatsApp message with **Approve edit** / **Reject edit** buttons (`editok:{inboxId}` / `editno:{inboxId}`).
  The submitter is told `Thanks — we've sent that change to the Tikiti team for a quick review.` and later either
  `Your change to "{name}" is live ✅ {url}` or `We couldn't apply that change to "{name}". Reply here if you think that's a mistake.`
- **Withdraw** – pending items become `status: rejected, rejectedReason: withdrawn` right away
  (`Done — "{name}" has been withdrawn.`). Published items need admin approval; on approval the event is set to
  `isActive: false, status: archived`.
- Only the original sender (`submittedBy`) or an admin phone can change an item; items older than 60 days are only reachable by
  replying to one of our messages about them.

## Data

- `event_inbox.waMessageIds: string[]` – wamids of the submitter's messages and our replies, used to resolve WhatsApp replies.
- `event_inbox.editHistory`, `event_inbox.pendingEdit`, `event_inbox.lastEditDecision`, `event_inbox.previousImageUrl`.
- `wa_sessions/{waId}` – `{ awaiting: 'pick_item', pendingText, candidateIds, expiresAt }`.
- `wa_outbound/{wamid}` – every message we send (`to`, `type`, `eventId` parsed from the text), so replies to the
  "your event is live" notice resolve too.
- Indexes: the existing composite `event_inbox (submittedBy ASC, createdAt DESC)`. `waMessageIds` array-contains,
  `whatsappMessageId ==` and `publishedEventId ==` use automatic single-field indexes.
