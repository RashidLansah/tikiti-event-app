// Organiser contact helpers (phone normalisation + WhatsApp / tel links). Safe on client and server.
// PRIVACY: contacts are ONLY numbers printed on the flyer or written in the caption as organiser contacts.
// Never feed `submittedBy` (the WhatsApp sender's number) into any of this.

export interface EventContact {
  name?: string;
  /** E.164 digits without the plus, e.g. 233241234567 */
  phone: string;
  whatsapp?: boolean;
}

export type RegistrationMethod = 'link' | 'contact' | 'walk_in' | 'unknown';
export const REGISTRATION_METHODS: RegistrationMethod[] = ['link', 'contact', 'walk_in', 'unknown'];
export const MAX_CONTACTS = 4;

/** → E.164 digits without plus (Ghana local 0XXXXXXXXX → 233XXXXXXXXX), or null if unusable. */
export function normaliseGhPhone(raw: unknown): string | null {
  const s = raw == null ? '' : String(raw).trim();
  if (!s) return null;
  const hasPlus = s.startsWith('+');
  let d = s.replace(/\D/g, '');
  if (!d) return null;
  if (!hasPlus && d.startsWith('00')) {
    d = d.slice(2);
    if (d.startsWith('233')) return ghana(d.slice(3));
    return d.length >= 8 && d.length <= 15 ? d : null;
  }
  if (d.startsWith('233') && (hasPlus || d.length >= 12)) return ghana(d.slice(3));
  if (hasPlus) return d.length >= 8 && d.length <= 15 ? d : null;
  if (d.length === 10 && d.startsWith('0')) return ghana(d.slice(1));
  if (d.length === 9 && !d.startsWith('0')) return ghana(d);
  return null;
}

function ghana(national: string): string | null {
  const n = national.replace(/^0+/, '');
  return /^\d{9}$/.test(n) ? `233${n}` : null;
}

/** 233241234567 → "+233 24 123 4567" */
export function displayPhone(e164: string): string {
  const d = (e164 || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('233') && d.length === 12) return `+233 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
  return `+${d}`;
}

export function waLink(e164: string, eventName: string): string {
  const d = (e164 || '').replace(/\D/g, '');
  return `https://wa.me/${d}?text=${encodeURIComponent(`Hi, I saw "${eventName}" on Tikiti and would like more details.`)}`;
}

/** True when the flyer flagged the number as WhatsApp, or it is a mobile number (Ghana 02x/05x; any non-Ghana number). Ghana landlines (03x) are excluded. */
export function canWhatsApp(c: { phone: string; whatsapp?: boolean }): boolean {
  if (c.whatsapp === true) return true;
  const d = String(c.phone || '').replace(/\D/g, '');
  if (d.startsWith('233')) return /^233[25]\d{8}$/.test(d);
  return d.length >= 8;
}

export function telLink(e164: string): string {
  return `tel:+${(e164 || '').replace(/\D/g, '')}`;
}

/** Normalises, de-duplicates and caps a raw contacts array. Entries with unusable numbers are dropped. */
export function normaliseContacts(raw: unknown, max = MAX_CONTACTS): EventContact[] {
  if (!Array.isArray(raw)) return [];
  const out: EventContact[] = [];
  for (const c of raw) {
    const phone = normaliseGhPhone(typeof c === 'string' || typeof c === 'number' ? c : (c as any)?.phone);
    if (!phone) continue;
    const existing = out.find((o) => o.phone === phone);
    const name = typeof c === 'object' && c ? String((c as any).name ?? '').trim() : '';
    const whatsapp = typeof c === 'object' && c ? (c as any).whatsapp === true : false;
    if (existing) {
      if (!existing.name && name) existing.name = name;
      if (whatsapp) existing.whatsapp = true;
      continue;
    }
    if (out.length >= max) continue;
    const entry: EventContact = { phone };
    if (name) entry.name = name;
    if (whatsapp) entry.whatsapp = true;
    out.push(entry);
  }
  return out;
}

/** Sets `phone` as the first contact (keeping that entry's name/whatsapp flag when it already was first or present). */
export function upsertFirstContact(contacts: unknown, rawPhone: unknown): EventContact[] {
  const list = normaliseContacts(contacts);
  const phone = normaliseGhPhone(rawPhone);
  if (!phone) return list;
  const at = list.findIndex((c) => c.phone === phone);
  if (at === 0) return list;
  if (at > 0) {
    const [hit] = list.splice(at, 1);
    return [hit, ...list].slice(0, MAX_CONTACTS);
  }
  if (list.length) {
    // Replace the first entry's number but keep its label
    const first: EventContact = { ...list[0], phone };
    delete first.whatsapp;
    return [first, ...list.slice(1)];
  }
  return [{ phone }];
}
