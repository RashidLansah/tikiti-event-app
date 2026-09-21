'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase/config';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Send } from 'lucide-react';

type Channel = 'whatsapp' | 'sms' | 'email';
type Mode = 'both' | 'interest' | 'city' | 'either';

interface EventOption { id: string; name: string; date: string; location: string; category: string }
interface Match {
  event: { id: string; name: string; date: string; location: string; category: string; city: string; interest: string | null; isOnline: boolean };
  cityIgnored: boolean;
  matched: number;
  byReason: { interestAndCity: number; interestOnly: number; cityOnly: number };
  reachable: Record<Channel, number>;
  excluded: { noConsent: number; alreadyBooked: number; recentlyContacted: number };
  legacyAttested: Record<Channel, number>;
  truncated: boolean;
  channelStatus: Record<Channel, string | null>;
  preview: Record<Channel, string>;
  defaultLimit: number;
  maxLimit: number;
}
interface SendResult { status: string; channel: Channel; dryRun: boolean; test: boolean; requested: number; sent: number; failed: number; blockedReason?: string; sampleErrors: string[] }
interface SendRow extends SendResult { id: string; eventName: string; mode: string; by: string; createdAt: string | null }

async function api(path: string, body?: unknown) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.error || `Request failed (${res.status})`), { status: res.status, current: json.current });
  return json;
}

const MODES: Array<{ id: Mode; label: string }> = [
  { id: 'both', label: 'Interest + location' }, { id: 'interest', label: 'Interest only' },
  { id: 'city', label: 'Location only' }, { id: 'either', label: 'Either' },
];
const CHANNEL_LABELS: Record<Channel, string> = { whatsapp: 'WhatsApp', sms: 'SMS', email: 'Email' };
const CHANNELS: Channel[] = ['whatsapp', 'sms', 'email'];

function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-[24px] border-black/10 bg-white shadow-none">
      <CardContent className="p-5">
        {title && <h2 className="text-sm font-semibold text-[#1d1d1f] mb-3">{title}</h2>}
        {children}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <tr className="border-t border-black/5 first:border-t-0">
      <td className="py-2 text-[#333]">{label}</td>
      <td className="py-2 text-right tabular-nums text-[#1d1d1f] font-medium">{value.toLocaleString()}</td>
    </tr>
  );
}

const inputCls = 'w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-black/10';

export default function PromotePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventId, setEventId] = useState('');
  const [mode, setMode] = useState<Mode>('both');
  const [channel, setChannel] = useState<Channel>('sms');
  const [limit, setLimit] = useState(200);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testTo, setTestTo] = useState('');
  const [busy, setBusy] = useState<'test' | 'send' | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<SendResult | null>(null);
  const [sends, setSends] = useState<SendRow[]>([]);

  const loadSends = useCallback(async () => {
    try { setSends((await api('/api/admin/audience/sends')).sends || []); } catch { /* list is optional */ }
  }, []);

  useEffect(() => {
    if (!user) return;
    api('/api/admin/audience/events').then((j) => setEvents(j.events || [])).catch((e) => setError(e.message));
    loadSends();
  }, [user, loadSends]);

  const loadMatch = useCallback(async () => {
    if (!user || !eventId) { setMatch(null); return; }
    setLoading(true);
    setError(null);
    try {
      setMatch(await api(`/api/admin/audience/match?eventId=${encodeURIComponent(eventId)}&mode=${mode}`));
    } catch (e: any) { setError(e.message); setMatch(null); }
    setLoading(false);
  }, [user, eventId, mode]);

  useEffect(() => { loadMatch(); }, [loadMatch]);

  const willSend = match ? Math.min(match.reachable[channel], Math.max(1, Math.min(limit || 1, match.maxLimit))) : 0;
  const blocked = match?.channelStatus[channel] || null;

  async function send(kind: 'test' | 'send') {
    if (!match) return;
    setBusy(kind);
    setError(null);
    setResult(null);
    try {
      const r = await api('/api/admin/audience/send', {
        eventId, channel, mode, limit,
        ...(kind === 'test' ? { testTo: testTo.trim() } : { confirmCount: willSend }),
      });
      setResult(r);
      setConfirmOpen(false);
      setTyped('');
      if (kind === 'send') await loadMatch();
    } catch (e: any) {
      setError(e.message);
      if (e.status === 409) { setConfirmOpen(false); setTyped(''); await loadMatch(); }
    }
    setBusy(null);
    loadSends();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link href="/admin/audience" className="text-sm text-[#86868b] inline-flex items-center gap-1 hover:text-[#1d1d1f]"><ArrowLeft className="w-4 h-4" /> Audience</Link>
        <h1 className="text-2xl font-semibold text-[#1d1d1f] flex items-center gap-2 mt-2"><Send className="w-6 h-6" /> Promote an event</h1>
        <p className="text-sm text-[#86868b] mt-1">Tell people who agreed to hear from Tikiti about an event that fits them. Counts only — no contact details are shown here.</p>
      </div>

      <Panel title="1. Event and audience">
        <div className="space-y-4">
          <select className={inputCls} value={eventId} onChange={(e) => { setEventId(e.target.value); setResult(null); }} aria-label="Event">
            <option value="">Choose an upcoming event…</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.date} · {e.name}{e.location ? ` · ${e.location}` : ''}</option>)}
          </select>
          <div className="flex flex-wrap gap-x-5 gap-y-2" role="radiogroup" aria-label="Match mode">
            {MODES.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-sm text-[#333] cursor-pointer">
                <input type="radio" name="mode" checked={mode === m.id} onChange={() => setMode(m.id)} /> {m.label}
              </label>
            ))}
          </div>
        </div>
      </Panel>

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      {loading && <p className="text-sm text-[#86868b] flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Matching…</p>}

      {match && !loading && (
        <>
          <Panel>
            <p className="text-xs text-[#86868b]">{match.event.name} · {match.event.interest || 'no interest tag'} · {match.event.isOnline ? 'Online' : match.event.city || 'no city'}</p>
            <p className="text-5xl font-semibold text-[#1d1d1f] mt-1 tabular-nums">{match.matched.toLocaleString()}</p>
            <p className="text-sm text-[#333] mt-1">{match.matched === 1 ? 'person matches' : 'people match'}</p>
            {match.cityIgnored && <p className="text-xs text-amber-700 mt-2">{match.event.isOnline ? 'This event is online — location ignored.' : 'This event has no city — location ignored.'}</p>}
            {!match.event.interest && <p className="text-xs text-amber-700 mt-1">The category “{match.event.category || 'none'}” does not map to an interest, so interest matching relies on past behaviour only.</p>}
            {match.truncated && <p className="text-xs text-amber-700 mt-1">Only the first 20,000 contacts were checked.</p>}
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel title="Reachable by channel">
              <table className="w-full text-sm"><tbody>{CHANNELS.map((c) => <Row key={c} label={CHANNEL_LABELS[c]} value={match.reachable[c]} />)}</tbody></table>
            </Panel>
            <Panel title="Why they match">
              <table className="w-full text-sm"><tbody>
                <Row label="Interest and location" value={match.byReason.interestAndCity} />
                <Row label="Interest only" value={match.byReason.interestOnly} />
                <Row label="Location only" value={match.byReason.cityOnly} />
              </tbody></table>
            </Panel>
            <Panel title="Left out">
              <table className="w-full text-sm"><tbody>
                <Row label="No consent on any channel" value={match.excluded.noConsent} />
                <Row label="Already booked this event" value={match.excluded.alreadyBooked} />
                <Row label="Contacted in the last 3 days" value={match.excluded.recentlyContacted} />
              </tbody></table>
            </Panel>
          </div>

          <Panel title="2. Channel and message">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-x-5 gap-y-2" role="radiogroup" aria-label="Channel">
                {CHANNELS.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm text-[#333] cursor-pointer">
                    <input type="radio" name="channel" checked={channel === c} onChange={() => { setChannel(c); setResult(null); }} />
                    {CHANNEL_LABELS[c]} <span className="text-[#86868b] tabular-nums">({match.reachable[c].toLocaleString()})</span>
                  </label>
                ))}
              </div>
              {blocked && <p className="text-sm text-red-600">{CHANNEL_LABELS[channel]} is blocked: {blocked}.</p>}
              {match.legacyAttested[channel] > 0 && (
                <p className="text-xs text-amber-700">{match.legacyAttested[channel].toLocaleString()} of the {match.reachable[channel].toLocaleString()} on {CHANNEL_LABELS[channel]} rely on legacy owner-attested consent, not the opt-in checkbox.</p>
              )}
              <div>
                <p className="text-xs text-[#86868b] mb-1">Message preview</p>
                <pre className="text-sm text-[#333] bg-[#f5f5f7] rounded-2xl px-4 py-3 whitespace-pre-wrap break-words font-sans">{match.preview[channel]}</pre>
              </div>
              <label className="block text-sm text-[#333]">
                Send to at most
                <input type="number" min={1} max={match.maxLimit} value={limit} onChange={(e) => setLimit(Number(e.target.value) || 0)} className={`${inputCls} max-w-[120px] ml-2 inline-block`} />
                <span className="text-xs text-[#86868b] ml-2">best matches first, max {match.maxLimit.toLocaleString()}</span>
              </label>
            </div>
          </Panel>

          <Panel title="3. Test, then send">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <input className={inputCls} value={testTo} onChange={(e) => setTestTo(e.target.value)} aria-label="Test recipient"
                  placeholder={channel === 'email' ? 'Your email' : 'Your phone, e.g. 024 000 0000'} />
                <Button variant="outline" className="rounded-full shrink-0" disabled={!!busy || !!blocked || !testTo.trim()} onClick={() => send('test')}>
                  {busy === 'test' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Send test to me
                </Button>
              </div>
              <Button className="rounded-full" disabled={!!busy || !!blocked || willSend === 0} onClick={() => { setTyped(''); setConfirmOpen(true); }}>
                Send to {willSend.toLocaleString()} {willSend === 1 ? 'person' : 'people'} by {CHANNEL_LABELS[channel]}
              </Button>
            </div>
          </Panel>

          {result && (
            <Panel title="Result">
              <p className="text-sm text-[#333]">
                {result.status === 'blocked' ? `Blocked: ${result.blockedReason}. Nothing was sent.`
                  : `${result.test ? 'Test' : 'Send'}${result.dryRun ? ' (dry run — nothing left the server)' : ''}: ${result.sent.toLocaleString()} sent, ${result.failed.toLocaleString()} failed of ${result.requested.toLocaleString()}.`}
              </p>
              {result.sampleErrors?.length > 0 && <ul className="text-xs text-[#86868b] mt-2 list-disc pl-4">{result.sampleErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
            </Panel>
          )}
        </>
      )}

      <Panel title="Recent sends">
        {sends.length === 0 ? <p className="text-sm text-[#86868b]">Nothing yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-[#86868b]"><th className="py-2 font-normal">When</th><th className="font-normal">Event</th><th className="font-normal">Channel</th><th className="font-normal text-right">Sent</th><th className="font-normal text-right">Failed</th><th className="font-normal pl-4">Note</th></tr></thead>
              <tbody>
                {sends.map((s) => (
                  <tr key={s.id} className="border-t border-black/5">
                    <td className="py-2 text-[#86868b] whitespace-nowrap">{s.createdAt ? new Date(s.createdAt).toLocaleString() : ''}</td>
                    <td className="py-2 text-[#333]">{s.eventName}</td>
                    <td className="py-2 text-[#333]">{CHANNEL_LABELS[s.channel] || s.channel}</td>
                    <td className="py-2 text-right tabular-nums font-medium text-[#1d1d1f]">{s.sent}/{s.requested}</td>
                    <td className="py-2 text-right tabular-nums">{s.failed}</td>
                    <td className="py-2 pl-4 text-xs text-[#86868b]">{[s.test && 'test', s.dryRun && 'dry run', s.blockedReason && `blocked: ${s.blockedReason}`].filter(Boolean).join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {confirmOpen && match && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Confirm send">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold text-[#1d1d1f]">Send to {willSend.toLocaleString()} {willSend === 1 ? 'person' : 'people'}?</h2>
            <p className="text-sm text-[#333]">“{match.event.name}” by {CHANNEL_LABELS[channel]}. This cannot be undone. Type <strong>{willSend}</strong> to confirm.</p>
            <input className={inputCls} inputMode="numeric" autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Type the number to confirm" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-full" onClick={() => setConfirmOpen(false)} disabled={!!busy}>Cancel</Button>
              <Button className="rounded-full" disabled={!!busy || typed.trim() !== String(willSend)} onClick={() => send('send')}>
                {busy === 'send' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Send now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
