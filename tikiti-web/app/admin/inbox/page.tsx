'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase/config';
import { eventCategories } from '@/lib/data/categories';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Inbox, Upload, Loader2, CheckCircle2, XCircle, AlertTriangle, ExternalLink, RefreshCw, X, Plus } from 'lucide-react';
import { classifyUrl, platformFromUrl, platformLabel, URL_KIND_LABEL } from '@/lib/events/links';
import type { ExtractedEvent, ExtractedSpeaker, InboxItem, InboxRejectedReason, InboxStatus } from '@/lib/inbox/admin';

const DEFAULT_ORG = { id: '1Mvh7AnKIphfnDeOgWUd', name: 'Tikiti Community' };

async function api(path: string, init?: RequestInit) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(new Error('Could not read file'));
    r.readAsDataURL(file);
  });

type Pending = { key: string; file: File; preview: string; caption: string; state: 'queued' | 'extracting' | 'done' | 'error'; error?: string };

const inputCls = 'bg-white rounded-xl border-black/10 text-[#333]';
const FIELD_LABELS: Record<string, string> = {
  name: 'Event name', description: 'Description', category: 'Category', date: 'Date', endDate: 'End date',
  startTime: 'Start time', endTime: 'End time', location: 'Venue', address: 'Address', city: 'City', price: 'Price (GHS)',
  registrationUrl: 'Registration URL', joinUrl: 'Join link (Zoom/Meet…)', meetingDetails: 'Meeting details', contactPhone: 'Contact phone', organiserName: 'Organiser name',
};

// Mirrors REJECT_REASON_LABEL in lib/inbox/notifySubmitter.ts (that module is server-only)
const REJECT_REASONS: { code: InboxRejectedReason; label: string }[] = [
  { code: 'not_event', label: 'Not an event' },
  { code: 'past', label: 'Already happened' },
  { code: 'duplicate', label: 'Duplicate' },
  { code: 'missing_details', label: 'Missing key details' },
  { code: 'other', label: 'Other' },
];

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round((value || 0) * 100);
  const cls = pct >= 80 ? 'bg-green-100 text-green-700' : pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  return <Badge className={`${cls} border-0 rounded-full`}>{pct}% confidence</Badge>;
}

export default function CommunityInboxPage() {
  const { user, organizations } = useAuth();
  const [status, setStatus] = useState<InboxStatus>('pending');
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const orgOptions = useMemo(() => {
    const list = (organizations || []).map((o) => ({ id: o.id!, name: o.name }));
    if (!list.some((o) => o.id === DEFAULT_ORG.id)) list.unshift(DEFAULT_ORG);
    return list;
  }, [organizations]);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const d = await api(`/api/inbox?status=${status}`);
      setItems(d.items || []);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [status, user]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const addFiles = (files: FileList | File[]) => {
    const next: Pending[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => ({ key: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`, file: f, preview: URL.createObjectURL(f), caption: '', state: 'queued' }));
    setPending((p) => [...p, ...next]);
  };

  const updatePending = (key: string, patch: Partial<Pending>) =>
    setPending((p) => p.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const extractAll = async () => {
    const queue = pending.filter((p) => p.state === 'queued' || p.state === 'error');
    for (const p of queue) {
      updatePending(p.key, { state: 'extracting', error: undefined });
      try {
        const imageBase64 = await fileToBase64(p.file);
        const d = await api('/api/inbox/submit', {
          method: 'POST',
          body: JSON.stringify({ imageBase64, mimeType: p.file.type, caption: p.caption, source: 'upload' }),
        });
        updatePending(p.key, { state: 'done' });
        if (status === 'pending') setItems((cur) => [d.item, ...cur]);
      } catch (e: any) {
        updatePending(p.key, { state: 'error', error: e.message });
      }
    }
    setPending((p) => p.filter((x) => x.state !== 'done'));
  };

  const busy = pending.some((p) => p.state === 'extracting');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f] flex items-center gap-2"><Inbox className="w-6 h-6" /> Community inbox</h1>
          <p className="text-sm text-[#86868b] mt-1">Upload flyers, let Claude extract the details, then review and publish.</p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={load}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
      </div>

      {/* Upload zone */}
      <Card className="rounded-[24px] border-black/10 bg-white shadow-none">
        <CardContent className="p-6 space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            onClick={() => fileInput.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-[20px] p-10 text-center transition-colors ${dragOver ? 'border-[#333] bg-[#f5f5f7]' : 'border-black/15 hover:bg-[#fafafa]'}`}
          >
            <Upload className="w-8 h-8 mx-auto text-[#86868b]" />
            <p className="mt-3 text-[#333] font-medium">Drop flyer images here or click to choose</p>
            <p className="text-xs text-[#86868b] mt-1">JPEG, PNG or WebP. Multiple files supported.</p>
            <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
          </div>

          {pending.length > 0 && (
            <div className="space-y-3">
              {pending.map((p) => (
                <div key={p.key} className="flex gap-4 items-start border border-black/10 rounded-2xl p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="" className="w-20 h-20 object-cover rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-[#333] truncate">{p.file.name}</p>
                    <Input className={inputCls} placeholder="Optional caption (e.g. the WhatsApp message text)" value={p.caption} disabled={p.state === 'extracting'} onChange={(e) => updatePending(p.key, { caption: e.target.value })} />
                    {p.state === 'extracting' && <p className="text-xs text-[#86868b] flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Extracting event details…</p>}
                    {p.state === 'error' && <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {p.error}</p>}
                  </div>
                  <button className="text-[#86868b] hover:text-[#333]" disabled={p.state === 'extracting'} onClick={() => setPending((cur) => cur.filter((x) => x.key !== p.key))}><X className="w-4 h-4" /></button>
                </div>
              ))}
              <div className="flex justify-end">
                <Button className="rounded-full bg-[#333] text-white hover:bg-black" disabled={busy} onClick={extractAll}>
                  {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Extracting…</> : `Extract ${pending.filter((p) => p.state !== 'done').length} flyer(s)`}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status tabs */}
      <div className="flex items-center gap-1 bg-[#f5f5f7] rounded-full p-1 w-fit">
        {(['pending', 'published', 'rejected'] as InboxStatus[]).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${status === s ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}>{s}</button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <div className="flex items-center gap-2 text-[#86868b]"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : items.length === 0 ? (
        <p className="text-sm text-[#86868b]">No {status} items.</p>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <InboxCard key={item.id} item={item} orgOptions={orgOptions} onChange={(updated) => setItems((cur) => cur.map((x) => (x.id === updated.id ? updated : x)))} />
          ))}
        </div>
      )}
    </div>
  );
}

const SPEAKER_COLS: { key: keyof ExtractedSpeaker; label: string }[] = [
  { key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }, { key: 'title', label: 'Title' }, { key: 'organisation', label: 'Organisation' },
];

function SpeakersEditor({ speakers, readOnly, onChange }: { speakers: ExtractedSpeaker[]; readOnly: boolean; onChange: (s: ExtractedSpeaker[]) => void }) {
  const update = (i: number, key: keyof ExtractedSpeaker, value: string) =>
    onChange(speakers.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)));
  const remove = (i: number) => onChange(speakers.filter((_, idx) => idx !== i));
  const add = () => onChange([...speakers, { name: '', role: 'Speaker', title: '', organisation: '' }]);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-[#86868b]">Speakers{speakers.length ? ` (${speakers.length})` : ''}</Label>
        {!readOnly && <button type="button" onClick={add} className="text-xs text-[#333] underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add speaker</button>}
      </div>
      {speakers.length === 0 ? (
        <p className="text-xs text-[#86868b]">No speakers found on the flyer.</p>
      ) : (
        <div className="space-y-2">
          {speakers.map((s, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[1.3fr_1fr_1fr_1fr_auto] gap-2 items-center">
              {SPEAKER_COLS.map((c) => (
                <Input key={c.key} className={`${inputCls} h-8 text-sm`} placeholder={c.label} value={s[c.key] || ''} disabled={readOnly} onChange={(e) => update(i, c.key, e.target.value)} />
              ))}
              {!readOnly ? (
                <button type="button" className="text-[#86868b] hover:text-red-600 justify-self-end" onClick={() => remove(i)} aria-label="Remove speaker"><X className="w-4 h-4" /></button>
              ) : <span />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InboxCard({ item, orgOptions, onChange }: { item: InboxItem; orgOptions: { id: string; name: string }[]; onChange: (i: InboxItem) => void }) {
  const [form, setForm] = useState<ExtractedEvent>({ ...item.extracted, joinUrl: item.extracted?.joinUrl || '', meetingPlatform: item.extracted?.meetingPlatform || '', meetingDetails: item.extracted?.meetingDetails || '', speakers: item.extracted?.speakers || [] });
  const [orgId, setOrgId] = useState(DEFAULT_ORG.id);
  const [customOrg, setCustomOrg] = useState('');
  const [working, setWorking] = useState<'publish' | 'reject' | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState<InboxRejectedReason>('other');
  const [rejectNote, setRejectNote] = useState('');
  const missing = new Set(item.missingFields || []);
  const readOnly = item.status !== 'pending';

  const set = <K extends keyof ExtractedEvent>(k: K, v: ExtractedEvent[K]) => setForm((f) => ({ ...f, [k]: v }));
  const field = (k: keyof ExtractedEvent, type = 'text') => (
    <div>
      <Label className={`text-xs ${missing.has(k) ? 'text-red-600' : 'text-[#86868b]'}`}>{FIELD_LABELS[k] || k}{missing.has(k) && ' · missing'}</Label>
      <Input type={type} className={`${inputCls} ${missing.has(k) ? 'border-red-300 bg-red-50/40' : ''}`} value={String(form[k] ?? '')} disabled={readOnly} onChange={(e) => set(k, (type === 'number' ? Number(e.target.value) : e.target.value) as any)} />
    </div>
  );

  const publish = async () => {
    setWorking('publish'); setErr(null);
    try {
      const organizationId = orgId === '__custom' ? customOrg.trim() : orgId;
      if (!organizationId) throw new Error('Organisation id is required');
      const d = await api(`/api/inbox/${item.id}/publish`, { method: 'POST', body: JSON.stringify({ ...form, organizationId }) });
      onChange(d.item);
    } catch (e: any) { setErr(e.message); }
    setWorking(null);
  };
  const reject = async () => {
    setWorking('reject'); setErr(null);
    try {
      const d = await api(`/api/inbox/${item.id}/reject`, { method: 'POST', body: JSON.stringify({ reason: rejectReason, note: rejectNote.trim() || undefined }) });
      setRejectOpen(false);
      onChange(d.item);
    } catch (e: any) { setErr(e.message); }
    setWorking(null);
  };

  const noTicketing = !form.isFree && !form.registrationUrl && !form.joinUrl;
  const urlHint = (url: string, expected: 'registration' | 'join') => {
    if (!url.trim()) return null;
    const kind = classifyUrl(url, `${form.name} ${form.description}`);
    const platform = kind === 'join' ? platformLabel(platformFromUrl(url)) : '';
    const wrong = kind !== 'info' && kind !== expected;
    return (
      <p className={`text-[11px] mt-1 ${wrong ? 'text-amber-700' : 'text-[#86868b]'}`}>
        Detected: {URL_KIND_LABEL[kind]}{platform ? ` · ${platform}` : ''}{wrong ? ` — looks like it belongs in "${expected === 'join' ? FIELD_LABELS.registrationUrl : FIELD_LABELS.joinUrl}"` : ''}
      </p>
    );
  };

  return (
    <Card className="rounded-[24px] border-black/10 bg-white shadow-none">
      <CardContent className="p-6 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        <div className="space-y-3">
          {item.imageUrl ? (
            <a href={item.imageUrl} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt={form.name || 'Flyer'} className="w-full rounded-2xl object-cover border border-black/10" />
            </a>
          ) : (
            <div className="w-full aspect-[4/5] rounded-2xl border border-dashed border-black/20 flex items-center justify-center text-xs text-[#86868b] text-center px-4">No flyer image yet</div>
          )}
          <div className="flex flex-wrap gap-2">
            <ConfidenceBadge value={item.confidence} />
            <Badge className={`border-0 rounded-full ${item.source === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-[#f5f5f7] text-[#333] capitalize'}`}>{item.source === 'whatsapp' ? 'WhatsApp' : item.source}</Badge>
            {item.needsImage && <Badge className="bg-amber-100 text-amber-700 border-0 rounded-full">Needs image</Badge>}
            {(item.triage?.isPast || item.rejectedReason === 'past') && <Badge className="bg-amber-100 text-amber-700 border-0 rounded-full">Past event</Badge>}
            {(item.triage?.duplicate || item.rejectedReason === 'duplicate') && (
              <Badge className="bg-amber-100 text-amber-700 border-0 rounded-full" title={item.triage?.duplicate?.name || ''}>
                Possible duplicate{item.triage?.duplicate?.name ? ` of ${item.triage.duplicate.name}` : ''}
              </Badge>
            )}
            {(item.triage?.kind === 'not_event' || item.rejectedReason === 'not_event') && <Badge className="bg-red-100 text-red-700 border-0 rounded-full">Not an event</Badge>}
            {item.status !== 'pending' && <Badge className={`border-0 rounded-full capitalize ${item.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.status}</Badge>}
          </div>
          {item.source === 'whatsapp' && <p className="text-xs text-[#86868b]">From: {item.senderName ? `${item.senderName} · ` : ''}+{item.submittedBy}</p>}
          {item.caption && <p className="text-xs text-[#86868b] whitespace-pre-wrap">Caption: {item.caption}</p>}
          {item.rejectedReason && item.triage?.reason && <p className="text-xs text-[#86868b]">Auto-rejected: {item.triage.reason}</p>}
          {item.status === 'rejected' && item.rejectedReason && !item.triage?.reason && (
            <p className="text-xs text-[#86868b]">Rejected: {REJECT_REASONS.find((r) => r.code === item.rejectedReason)?.label || item.rejectedReason}{item.rejectedNote ? ` · ${item.rejectedNote}` : ''}</p>
          )}
          {item.status !== 'pending' && item.submitterNotified && (
            item.submitterNotified.status === 'sent' || item.submitterNotified.status === 'template' ? (
              <p className="text-xs text-green-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Submitter notified ✓</p>
            ) : item.submitterNotified.status === 'failed' ? (
              <p className="text-xs text-amber-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Couldn&apos;t notify submitter</p>
            ) : null
          )}
          {item.triage?.duplicate?.publishedEventId && item.status !== 'published' && (
            <Link href={`/events/${item.triage.duplicate.publishedEventId}`} target="_blank" className="inline-flex items-center gap-1 text-xs text-[#333] underline"><ExternalLink className="w-3 h-3" /> View existing event</Link>
          )}
          {item.extractionError && <p className="text-xs text-red-600 flex items-start gap-1"><AlertTriangle className="w-3 h-3 mt-0.5" /> Extraction failed: {item.extractionError}. Fill in the details manually.</p>}
          {item.missingFields.length > 0 && <p className="text-xs text-red-600">Missing: {item.missingFields.map((m) => FIELD_LABELS[m] || m).join(', ')}</p>}
          {item.status === 'published' && item.publishedEventId && (
            <Link href={`/events/${item.publishedEventId}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-[#333] underline"><ExternalLink className="w-4 h-4" /> View event</Link>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">{field('name')}</div>
            <div className="sm:col-span-2">
              <Label className="text-xs text-[#86868b]">Description</Label>
              <Textarea className={inputCls} rows={3} value={form.description} disabled={readOnly} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div>
              <Label className={`text-xs ${missing.has('category') ? 'text-red-600' : 'text-[#86868b]'}`}>Category</Label>
              <select className={`w-full h-9 px-3 border rounded-xl border-black/10 text-sm text-[#333] bg-white`} value={form.category} disabled={readOnly} onChange={(e) => set('category', e.target.value)}>
                {eventCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {field('organiserName')}
            {field('date', 'date')}
            {field('endDate', 'date')}
            {field('startTime', 'time')}
            {field('endTime', 'time')}
            {field('location')}
            {field('address')}
            {field('city')}
            {field('contactPhone')}
            <div className="sm:col-span-2">
              <SpeakersEditor speakers={form.speakers || []} readOnly={readOnly} onChange={(s) => set('speakers', s)} />
            </div>
            <div>{field('registrationUrl', 'url')}{urlHint(form.registrationUrl || '', 'registration')}</div>
            <div>{field('joinUrl', 'url')}{urlHint(form.joinUrl || '', 'join')}</div>
            <div className="sm:col-span-2">{field('meetingDetails')}</div>
            <div className="flex items-center gap-2 pt-5">
              <input id={`free-${item.id}`} type="checkbox" checked={form.isFree} disabled={readOnly} onChange={(e) => { set('isFree', e.target.checked); if (e.target.checked) set('price', 0); }} />
              <Label htmlFor={`free-${item.id}`} className="text-sm text-[#333]">Free event</Label>
            </div>
            {!form.isFree && field('price', 'number')}
          </div>

          {noTicketing && !readOnly && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> Paid event with no registration link: it will be published with ticketing disabled (Tikiti does not sell tickets on behalf of third parties).</p>
          )}

          {!readOnly && (
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1">
                <Label className="text-xs text-[#86868b]">Publish under organisation</Label>
                <select className="w-full h-9 px-3 border rounded-xl border-black/10 text-sm text-[#333] bg-white" value={orgId} onChange={(e) => setOrgId(e.target.value)}>
                  {orgOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  <option value="__custom">Other organisation id…</option>
                </select>
                {orgId === '__custom' && <Input className={`${inputCls} mt-2`} placeholder="Organisation document id" value={customOrg} onChange={(e) => setCustomOrg(e.target.value)} />}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-full" disabled={working !== null} onClick={() => setRejectOpen((o) => !o)}>
                  <XCircle className="w-4 h-4 mr-2" />Reject
                </Button>
                <Button className="rounded-full bg-[#333] text-white hover:bg-black" disabled={working !== null} onClick={publish}>
                  {working === 'publish' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}Publish
                </Button>
              </div>
            </div>
          )}
          {!readOnly && rejectOpen && (
            <div className="rounded-2xl border border-black/10 bg-[#fafafa] p-4 space-y-3">
              <p className="text-sm font-medium text-[#1d1d1f]">Why is this being rejected?</p>
              <p className="text-xs text-[#86868b]">{item.source === 'whatsapp' ? 'The submitter will get a WhatsApp message with this reason.' : 'Recorded on the item (no submitter to notify).'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {REJECT_REASONS.map((r) => (
                  <label key={r.code} className="flex items-center gap-2 text-sm text-[#333] cursor-pointer">
                    <input type="radio" name={`reject-reason-${item.id}`} value={r.code} checked={rejectReason === r.code} onChange={() => setRejectReason(r.code)} />
                    {r.label}
                  </label>
                ))}
              </div>
              <Textarea className={inputCls} rows={2} maxLength={500} placeholder="Optional note to the submitter (e.g. what to fix and resend)" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="rounded-full" disabled={working !== null} onClick={() => setRejectOpen(false)}>Cancel</Button>
                <Button className="rounded-full bg-red-600 text-white hover:bg-red-700" disabled={working !== null} onClick={reject}>
                  {working === 'reject' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}Confirm reject
                </Button>
              </div>
            </div>
          )}
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
