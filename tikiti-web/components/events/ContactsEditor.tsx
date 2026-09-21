'use client';

import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { EventContact, displayPhone, normaliseContacts, normaliseGhPhone } from '@/lib/events/contact';

export const MAX_FORM_CONTACTS = 3;

export interface ContactRow {
  name: string;
  phone: string;
  whatsapp: boolean;
}

export const emptyContactRow = (): ContactRow => ({ name: '', phone: '', whatsapp: false });

/** Stored contacts → editable rows (always at least one row). */
export function contactsToRows(raw: unknown): ContactRow[] {
  const rows = normaliseContacts(raw, MAX_FORM_CONTACTS).map((c) => ({
    name: c.name || '',
    phone: displayPhone(c.phone),
    whatsapp: c.whatsapp === true,
  }));
  return rows.length ? rows : [emptyContactRow()];
}

/** Validates rows. Rows with no phone and no name are ignored. `errors` is keyed by row index. */
export function validateContactRows(rows: ContactRow[]): { contacts: EventContact[]; errors: Record<number, string> } {
  const errors: Record<number, string> = {};
  const usable: ContactRow[] = [];
  rows.forEach((row, i) => {
    const phone = row.phone.trim();
    if (!phone) {
      if (row.name.trim()) errors[i] = 'Add a phone number for this contact, or remove the row.';
      return;
    }
    if (!normaliseGhPhone(phone)) {
      errors[i] = 'Enter a valid phone number, e.g. 024 123 4567 or +233 24 123 4567.';
      return;
    }
    usable.push(row);
  });
  return { contacts: normaliseContacts(usable, MAX_FORM_CONTACTS), errors };
}

interface Props {
  rows: ContactRow[];
  onChange: (rows: ContactRow[]) => void;
  errors?: Record<number, string>;
  /** 'lg' matches the create wizard, 'sm' the card-based edit form. */
  size?: 'sm' | 'lg';
  idPrefix?: string;
}

export function ContactsEditor({ rows, onChange, errors = {}, size = 'sm', idPrefix = 'contact' }: Props) {
  const lg = size === 'lg';
  const inputClass = lg ? 'h-12 rounded-xl border-[#333]/10 bg-[#f0f0f0]' : '';
  const muted = lg ? 'text-sm text-[#86868b]' : 'text-xs text-gray-500';

  const patch = (i: number, p: Partial<ContactRow>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...p } : r)));

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              aria-label={`Contact ${i + 1} name`}
              value={row.name}
              onChange={(e) => patch(i, { name: e.target.value })}
              placeholder="Name (optional)"
              className={inputClass}
            />
            <Input
              aria-label={`Contact ${i + 1} phone`}
              type="tel"
              inputMode="tel"
              value={row.phone}
              onChange={(e) => patch(i, { phone: e.target.value })}
              placeholder="Phone, e.g. 024 123 4567"
              aria-invalid={Boolean(errors[i])}
              className={`${inputClass} ${errors[i] ? 'border-red-500' : ''}`}
            />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor={`${idPrefix}-wa-${i}`} className="flex items-center gap-2 cursor-pointer text-sm">
              <Checkbox
                id={`${idPrefix}-wa-${i}`}
                checked={row.whatsapp}
                onCheckedChange={(v) => patch(i, { whatsapp: v === true })}
              />
              On WhatsApp
            </label>
            {(rows.length > 1 || row.name || row.phone) && (
              <button
                type="button"
                onClick={() => {
                  const next = rows.filter((_, idx) => idx !== i);
                  onChange(next.length ? next : [emptyContactRow()]);
                }}
                className="text-sm text-red-500 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
          {errors[i] && <p className="text-sm text-red-600">{errors[i]}</p>}
        </div>
      ))}
      {rows.length < MAX_FORM_CONTACTS && (
        <button
          type="button"
          onClick={() => onChange([...rows, emptyContactRow()])}
          className={`text-sm font-medium hover:underline ${lg ? 'text-[#333]' : ''}`}
        >
          + Add another contact
        </button>
      )}
      <p className={muted}>
        Shown on your event page with Call and WhatsApp buttons. Leave blank to hide.
      </p>
    </div>
  );
}
