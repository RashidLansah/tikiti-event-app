'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import Arrow from '@/components/ui/Arrow';
import { CONSENT_TEXT, CONSENT_VERSION } from '@/lib/audience/consent';
import { INTEREST_TAGS } from '@/lib/audience/interests';
import { normaliseGhPhone } from '@/lib/events/contact';

export type AudienceChannel = 'whatsapp' | 'sms' | 'email';
export type SubscribeSource = 'web_event_prompt' | 'web_signup' | 'registration';

export const SUBSCRIBED_KEY = 'tk_subscribed';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const VISIBLE_INTERESTS = 8;

export function readSubscribed(): boolean {
  try {
    return window.localStorage.getItem(SUBSCRIBED_KEY) === '1';
  } catch {
    return false;
  }
}

function markSubscribed() {
  try {
    window.localStorage.setItem(SUBSCRIBED_KEY, '1');
  } catch {
    /* storage unavailable: prompts simply keep showing */
  }
}

/** True once the visitor has subscribed (checked after mount, so SSR and first paint agree). */
export function useSubscribed(): boolean {
  const [subscribed, setSubscribed] = useState(false);
  useEffect(() => {
    setSubscribed(readSubscribed());
  }, []);
  return subscribed;
}

/** Phone present: whatsapp + sms. Email present: email. Narrowed to `allowed` when given. */
export function channelsFor(phone: string | null, email: string | null, allowed?: AudienceChannel[]): AudienceChannel[] {
  const out: AudienceChannel[] = [];
  if (phone) out.push('whatsapp', 'sms');
  if (email) out.push('email');
  if (!allowed || allowed.length === 0) return out;
  const narrowed = out.filter((c) => allowed.includes(c));
  return narrowed.length ? narrowed : out;
}

const CSS = `
  .tk-sub { font-family: 'DM Sans', Arial, sans-serif; color: #202220; min-width: 0; }
  .tk-sub-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 12px; }
  .tk-sub.compact .tk-sub-grid { grid-template-columns: minmax(0, 1fr); gap: 10px; }
  .tk-sub-field { display: block; min-width: 0; }
  .tk-sub-field > span { display: block; font-size: 12px; font-weight: 600; color: #202220; margin-bottom: 6px; }
  .tk-sub-field > span i { font-style: normal; font-weight: 400; color: #65675d; }
  .tk-sub-field input { width: 100%; min-width: 0; height: 46px; padding: 0 14px; background: #fffef9; color: #202220; border: 1px solid #deded4; border-radius: 10px; font: 400 16px 'DM Sans', Arial, sans-serif; outline: none; transition: border-color 0.15s; }
  .tk-sub-field input:focus { border-color: #202220; }
  .tk-sub-field input[aria-invalid="true"] { border-color: #f44929; }
  .tk-sub-field input::placeholder { color: #9a9b92; }
  .tk-sub-hint { display: block; font-size: 12px; color: #c0351a; margin-top: 5px; }
  .tk-sub-chips-label { display: block; font-size: 12px; font-weight: 600; margin: 16px 0 8px; }
  .tk-sub-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .tk-sub-chip { min-height: 40px; padding: 0 15px; border-radius: 30px; border: 1px solid #deded4; background: #fffef9; color: #202220; font: 600 13px 'DM Sans', Arial, sans-serif; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background 0.15s, color 0.15s, border-color 0.15s; }
  .tk-sub-chip:hover { border-color: #202220; }
  .tk-sub-chip[aria-pressed="true"] { background: #6256e8; border-color: #6256e8; color: #fff; }
  .tk-sub-chip.more { border-style: dashed; color: #65675d; }
  .tk-sub-consent { display: flex; align-items: flex-start; gap: 10px; margin-top: 16px; min-height: 40px; cursor: pointer; font-size: 13px; line-height: 1.5; color: #65675d; }
  .tk-sub-consent input { width: 20px; height: 20px; margin-top: 1px; flex-shrink: 0; accent-color: #f44929; cursor: pointer; }
  .tk-sub-btn { margin-top: 16px; min-height: 48px; padding: 0 22px; background: #f44929; color: #fff; border: 0; border-radius: 40px; font: 700 15px 'DM Sans', Arial, sans-serif; display: inline-flex; align-items: center; justify-content: space-between; gap: 14px; cursor: pointer; transition: transform 0.15s, opacity 0.15s; }
  .tk-sub.compact .tk-sub-btn { width: 100%; }
  .tk-sub-btn:hover:not(:disabled) { transform: translateY(-2px); }
  .tk-sub-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .tk-sub-error { margin-top: 12px; font-size: 13px; color: #c0351a; }
  .tk-sub-done strong { display: block; font-size: 18px; font-weight: 700; color: #202220; }
  .tk-sub-done p { margin-top: 6px; font-size: 13px; line-height: 1.5; color: #65675d; }
`;

export interface SubscribeFields {
  name?: boolean;
  phone?: boolean;
  email?: boolean;
  city?: boolean;
  interests?: boolean;
}

interface SubscribeFormProps {
  fields: SubscribeFields;
  source: SubscribeSource;
  eventId?: string;
  /** Narrows the channels derived from the identifiers entered. */
  defaultChannels?: AudienceChannel[];
  submitLabel?: string;
  compact?: boolean;
  onDone?: () => void;
}

export default function SubscribeForm({ fields, source, eventId, defaultChannels, submitLabel = 'Add me to the list', compact = false, onDone }: SubscribeFormProps) {
  const uid = useId();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState<{ phone?: boolean; email?: boolean }>({});
  const [state, setState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  const phoneValue = fields.phone ? phone.trim() : '';
  const emailValue = fields.email ? email.trim() : '';
  const validPhone = phoneValue ? normaliseGhPhone(phoneValue) : null;
  const validEmail = emailValue && EMAIL_RE.test(emailValue) ? emailValue.toLowerCase() : null;
  const phoneBad = Boolean(phoneValue) && !validPhone;
  const emailBad = Boolean(emailValue) && !validEmail;
  const canSubmit = consent && Boolean(validPhone || validEmail) && !phoneBad && !emailBad && state !== 'submitting';

  const toggleInterest = (tag: string) =>
    setInterests((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setState('submitting');
    setError('');
    const body: Record<string, unknown> = {
      channels: channelsFor(validPhone, validEmail, defaultChannels),
      source,
      consent: true,
      wordingVersion: CONSENT_VERSION,
    };
    if (fields.name && name.trim()) body.name = name.trim();
    if (validPhone) body.phone = phoneValue;
    if (validEmail) body.email = validEmail;
    if (fields.city && city.trim()) body.city = city.trim();
    if (fields.interests && interests.length) body.interests = interests;
    if (eventId) body.eventId = eventId;
    try {
      const res = await fetch('/api/audience/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Something went wrong. Please try again.');
      markSubscribed();
      setState('done');
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <div className={`tk-sub tk-sub-done${compact ? ' compact' : ''}`} role="status">
        <style>{CSS}</style>
        <strong>You&apos;re on the list ✓</strong>
        <p>Reply STOP or use the unsubscribe link anytime.</p>
      </div>
    );
  }

  const shownTags = showAll ? INTEREST_TAGS : INTEREST_TAGS.slice(0, VISIBLE_INTERESTS);
  const busy = state === 'submitting';

  return (
    <form className={`tk-sub${compact ? ' compact' : ''}`} onSubmit={submit} noValidate>
      <style>{CSS}</style>
      <div className="tk-sub-grid">
        {fields.name && (
          <label className="tk-sub-field" htmlFor={`${uid}-name`}>
            <span>Name{fields.phone || fields.email ? <i> (optional)</i> : null}</span>
            <input id={`${uid}-name`} type="text" autoComplete="name" placeholder="Ama Mensah" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} maxLength={80} />
          </label>
        )}
        {fields.phone && (
          <label className="tk-sub-field" htmlFor={`${uid}-phone`}>
            <span>WhatsApp number</span>
            <input id={`${uid}-phone`} type="tel" inputMode="tel" autoComplete="tel" placeholder="024 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, phone: true }))} aria-invalid={touched.phone && phoneBad ? true : undefined} disabled={busy} maxLength={24} />
            {touched.phone && phoneBad && <small className="tk-sub-hint">Enter a valid phone number, e.g. 024 123 4567.</small>}
          </label>
        )}
        {fields.email && (
          <label className="tk-sub-field" htmlFor={`${uid}-email`}>
            <span>Email{fields.phone ? <i> (optional)</i> : null}</span>
            <input id={`${uid}-email`} type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))} aria-invalid={touched.email && emailBad ? true : undefined} disabled={busy} maxLength={120} />
            {touched.email && emailBad && <small className="tk-sub-hint">That email doesn&apos;t look right.</small>}
          </label>
        )}
        {fields.city && (
          <label className="tk-sub-field" htmlFor={`${uid}-city`}>
            <span>City</span>
            <input id={`${uid}-city`} type="text" autoComplete="address-level2" placeholder="Accra" value={city} onChange={(e) => setCity(e.target.value)} disabled={busy} maxLength={60} />
          </label>
        )}
      </div>

      {fields.interests && (
        <div role="group" aria-label="Interests">
          <span className="tk-sub-chips-label">What are you into?</span>
          <div className="tk-sub-chips">
            {shownTags.map((tag) => (
              <button key={tag} type="button" className="tk-sub-chip" aria-pressed={interests.includes(tag)} onClick={() => toggleInterest(tag)} disabled={busy}>
                {tag}
              </button>
            ))}
            {!showAll && INTEREST_TAGS.length > VISIBLE_INTERESTS && (
              <button type="button" className="tk-sub-chip more" onClick={() => setShowAll(true)}>
                {INTEREST_TAGS.length - VISIBLE_INTERESTS} more <Arrow dir="down" size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      <label className="tk-sub-consent" htmlFor={`${uid}-consent`}>
        <input id={`${uid}-consent`} type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} disabled={busy} required />
        <span>{CONSENT_TEXT}</span>
      </label>

      <button type="submit" className="tk-sub-btn" disabled={!canSubmit}>
        <span>{busy ? 'Adding you…' : submitLabel}</span>
        <Arrow dir="right" size={16} />
      </button>
      {state === 'error' && <p className="tk-sub-error" role="alert">{error}</p>}
    </form>
  );
}
