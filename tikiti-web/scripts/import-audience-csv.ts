// Imports a Google Forms CSV export into the `audience` collection. Captures data only — sends nothing.
// Run: npx tsx scripts/import-audience-csv.ts <file.csv> [--commit]      (default is a dry run)
//
// EXACT column headers expected (Google Form question titles):
//   Timestamp
//   Full name
//   WhatsApp number
//   Email (optional)
//   City or area
//   What kinds of events interest you?      semicolon- or comma-separated INTEREST_TAGS
//   What would you pay for a ticket?        Free events only | Up to GH₵50 | Up to GH₵100 | Up to GH₵200 | More than GH₵200
//   How should we reach you?                WhatsApp; SMS; Email
//   Consent                                 must contain "I agree"
// Rows without consent are imported WITHOUT any channel consent.
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: resolve(__dirname, '../.env.local') });

import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { contactIdFor, normaliseEmail, upsertContact, validInterests } from '../lib/audience/contacts';
import { normaliseGhPhone } from '../lib/events/contact';
import { CONSENT_VERSION } from '../lib/audience/consent';
import type { AudienceChannel, PriceComfort } from '../lib/audience/types';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tikiti-45ac4';

const H = {
  timestamp: 'Timestamp', name: 'Full name', phone: 'WhatsApp number', email: 'Email (optional)', city: 'City or area',
  interests: 'What kinds of events interest you?', price: 'What would you pay for a ticket?',
  reach: 'How should we reach you?', consent: 'Consent',
} as const;

const PRICE: Record<string, PriceComfort> = {
  'free events only': 'free', 'up to gh₵50': 'up_to_50', 'up to gh₵100': 'up_to_100', 'up to gh₵200': 'up_to_200', 'more than gh₵200': 'over_200',
};

/** Minimal RFC-4180 parser: quoted fields, escaped quotes, commas and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

const splitList = (v: string) => v.split(/[;,]/).map((x) => x.trim()).filter(Boolean);

function parseTimestamp(v: string): Date | undefined {
  const d = new Date(v.trim());
  return Number.isFinite(d.getTime()) ? d : undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const commit = args.includes('--commit');
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) { console.error('Usage: npx tsx scripts/import-audience-csv.ts <file.csv> [--commit]'); process.exit(1); }

  const rows = parseCsv(readFileSync(resolve(file), 'utf8'));
  if (rows.length < 2) throw new Error('CSV has no data rows');
  const header = rows[0].map((h) => h.trim());
  const missing = Object.values(H).filter((h) => !header.includes(h));
  if (missing.length) throw new Error(`Missing column(s): ${missing.join(' | ')}`);
  const col = (r: string[], h: string) => (r[header.indexOf(h)] || '').trim();

  let db: FirebaseFirestore.Firestore | null = null;
  if (commit) {
    if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
    db = getFirestore();
  }

  const totals = { rows: 0, skipped: 0, withConsent: 0, withoutConsent: 0, created: 0, updated: 0, whatsapp: 0, sms: 0, email: 0 };
  const seen = new Set<string>();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    totals.rows++;
    const phone = normaliseGhPhone(col(r, H.phone));
    const email = normaliseEmail(col(r, H.email));
    const id = contactIdFor({ phone, email });
    if (!id) { totals.skipped++; console.log(`row ${i + 1}: SKIP (no usable phone or email)`); continue; }

    const rawInterests = splitList(col(r, H.interests));
    const interests = validInterests(rawInterests);
    const unknown = rawInterests.filter((t) => !interests.some((k) => k.toLowerCase() === t.toLowerCase()));
    const priceComfort = PRICE[col(r, H.price).toLowerCase()];
    const agreed = /i agree/i.test(col(r, H.consent));
    const channels = splitList(col(r, H.reach)).map((c) => c.toLowerCase())
      .filter((c): c is AudienceChannel => c === 'whatsapp' || c === 'sms' || c === 'email')
      .filter((c) => (c === 'email' ? !!email : !!phone));
    const consentChannels = agreed ? channels : [];
    if (consentChannels.length) { totals.withConsent++; for (const c of consentChannels) totals[c]++; } else totals.withoutConsent++;

    const masked = phone ? `…${phone.slice(-4)}` : 'email-only';
    console.log(`row ${i + 1}: ${seen.has(id) ? 'MERGE' : 'UPSERT'} ${masked} | city=${col(r, H.city) || '-'} | interests=${interests.length}${unknown.length ? ` (ignored: ${unknown.join(', ')})` : ''} | price=${priceComfort || '-'} | consent=${consentChannels.join('+') || 'none'}`);
    seen.add(id);

    if (db) {
      const res = await upsertContact(db, {
        phone: phone || undefined, email: email || undefined, name: col(r, H.name), city: col(r, H.city),
        interests, priceComfort, source: 'google_form',
        consent: consentChannels.length ? { channels: consentChannels, wordingVersion: CONSENT_VERSION, at: parseTimestamp(col(r, H.timestamp)) } : undefined,
      });
      if (res?.created) totals.created++; else if (res) totals.updated++;
    }
  }

  console.log(`\n${commit ? 'COMMITTED' : 'DRY RUN (nothing written; pass --commit to write)'}`);
  console.log(`rows ${totals.rows} | unique contacts ${seen.size} | skipped ${totals.skipped}`);
  console.log(`with consent ${totals.withConsent} (whatsapp ${totals.whatsapp}, sms ${totals.sms}, email ${totals.email}) | without consent ${totals.withoutConsent}`);
  if (commit) console.log(`created ${totals.created} | updated ${totals.updated}`);
}

if (require.main === module) main().catch((e) => { console.error(e.message || e); process.exit(1); });
