# WhatsApp discovery & Q&A bot

The Tikiti WhatsApp number that accepts flyers also answers people looking for events. Code: `lib/bot/`
(`plan.ts` decides, `send.ts` sends, `store.ts` writes session + logs, `catalogue.ts` loads events), wired into
`app/api/inbox/whatsapp/route.ts`.

## What people can ask

| They send | Intent | Reply |
| --- | --- | --- |
| hi / hello / hey / good morning / menu / help / start (≤ 4 words) | `greeting` | Welcome + buttons: Find events · List my event · My submissions |
| button **Find events** | `menu_find` | Prompt with example searches |
| button **List my event** | `menu_list` | How to submit a flyer |
| button **My submissions** | `menu_mine` | Their 5 newest submissions: Pending review / Live (+ link) / Not listed |
| "tech events this weekend in Accra", "free workshops", "anything online tonight" | `discover` | One lead line, then up to 3 events (one message each, with link preview), then "Reply 1, 2 or 3…" |
| `1` / `2` / `3` after results | `event_question` | Summary of that event |
| "how much is it?", "how do I register?", "who is speaking?" | `event_question` | 2–4 sentences answered only from the listing, then the event link. Unknown detail → "That isn't in the listing" + organiser contact or the event page |
| thanks / chit-chat | `other` | Menu nudge at most once per 6 h, otherwise silence |
| event details they want listed ("please list my event, 5 Oct at Alisa Hotel") | `submit_text` | Not the bot — the normal inbox flow handles it |

Rules run first (button ids, greeting regex, bare number when results are in the session); everything else is one
Claude Haiku (`claude-haiku-4-5-20251001`) classification call. `discover` and `event_question` each make one more
Haiku call. Relative dates ("this weekend", "next week") are computed in code for Africa/Accra and handed to the model.

Which event a question is about: a number picks from the last results → else the session's focus event → else an event
name mentioned in the text (token overlap against the catalogue) → else the bot asks which event.

Privacy: the catalogue reads a whitelist of event fields. `submittedBy`, `communityContact` and `organizerPhone` are
never fetched, so a submitter's number cannot reach the model or a reply. Only `contacts` (numbers printed on the flyer)
are shown, via `displayPhone`.

## Order in the webhook (per message)

1. Signature check, then per message:
2. **Admin commands** (sender in `INBOX_ADMIN_PHONES`): `approve:` / `reject:` / `editok:` / `editno:` buttons, `approve|reject|pending` text.
3. Type gate: only `image`, `text`, and interactive button replies whose id starts with `menu:` continue. De-dupe with `claimMessage`.
4. **Submitter edits** (`handleSubmitterMessage`): edit / withdraw / undo / flyer replacement. Handled → stop.
5. **Bot** — text and `menu:*` buttons only, never images: `hasRecentFlyer` = sender has a pending inbox item from the
   last 30 min → `planBotReply`. A plan → `sendBotPlan`, merge session, write `bot_logs`, stop (no `needsImage` item is
   created). `null` or any error → step 6.
6. **Existing flow, unchanged**: text merges into the sender's recent flyer or becomes a `needsImage` item; images are triaged, extracted and stored.

The bot returns `null` (falls through) when: the message is classified `submit_text`; `hasRecentFlyer` is true and the
message is not clearly discover / event_question; a submitter-edit "pick a number" prompt is live in `wa_sessions`;
the text is empty; or anything throws (Haiku timeout, Firestore error). The webhook always answers 200.

## Session, limits, logs

- `wa_sessions/{from}` (shared with submitter edits; always written with merge): `lastResults`, `focusEvent`, `lastQuery`,
  `lastNudgeAt`, `botCount`, `botDay`, `updatedAt`, `expiresAt`. Results / focus / last query are ignored 30 min after they
  were set. Expired `awaiting` / `pendingText` / `candidateIds` leftovers are removed on write so the bot's `expiresAt`
  cannot revive an old pick prompt. (The submitter-edit flow overwrites the doc when it starts a pick prompt, which resets
  the bot fields including the day counter.)
- 40 bot replies per sender per Africa/Accra day. The 41st message gets the limit notice once; after that messages are
  consumed silently (flyer follow-up texts still fall through to the inbox). The check happens before any model call.
- Catalogue: `events` (`isActive !== false`, status not draft / archived / cancelled / inactive, not ended) +
  `scraped_events` (status `active`, not ended), cached in module memory for 5 minutes, at most 150 soonest events sent to the model.
  Scraped events link to their `registrationUrl`; Tikiti events to `https://www.gettikiti.com/events/{id}?src=wa`.
- `bot_logs/{auto}`: `{ from, text, intent, pickedIds, eventId, ms, at }` (+ `itemIds`, `catalogueSize`, `limited` where relevant).
- Each Haiku call times out after 12 s. Env: `ANTHROPIC_API_KEY`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`.

## Simulator (sends nothing)

```
npx tsx scripts/bot-sim.ts
```

Runs a scripted conversation through `planBotReply` only — `sendBotPlan` is never imported and the WhatsApp env vars are
removed from the process. It reads live Firestore and makes real Haiku calls, keeps its session in
`wa_sessions/sim-bot-user`, tags its `bot_logs` docs `sim: true`, and deletes both at the end. Needs `.env.local`
(`ANTHROPIC_API_KEY`) and `gcloud auth application-default login` for project `tikiti-45ac4`.
