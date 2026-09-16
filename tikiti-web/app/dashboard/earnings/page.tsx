'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wallet, ArrowUpRight, Loader2, Smartphone, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

type Summary = {
  grossPesewas: number; feesPesewas: number; netPesewas: number; availablePesewas: number;
  pendingPesewas: number; paidOutPesewas: number; inFlightPesewas: number;
  entries: Array<{ bookingId: string; eventName: string; quantity: number; gross: number; net: number; paidAt: string | null; cleared: boolean }>;
  payouts: Array<{ id: string; amount: number; status: string; createdAt: string | null; reference: string }>;
  feePercent: number; minPayoutPesewas: number; canManagePayouts: boolean;
  payoutAccount: { provider: string; phone: string; name: string } | null;
};

const ghs = (p: number) => `GH₵${((p || 0) / 100).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const PROVIDERS = [{ key: 'mtn', label: 'MTN MoMo' }, { key: 'telecel', label: 'Telecel Cash' }, { key: 'airteltigo', label: 'AT Money' }];
const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-gray-100 text-gray-700' },
  processing: { label: 'Processing', cls: 'bg-indigo-100 text-indigo-700' },
  success: { label: 'Paid', cls: 'bg-green-100 text-green-700' },
  failed: { label: 'Failed', cls: 'bg-red-100 text-red-700' },
  reversed: { label: 'Reversed', cls: 'bg-red-100 text-red-700' },
};

async function api(path: string, init?: RequestInit) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers || {}) } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

export default function EarningsPage() {
  const { currentOrganization } = useAuth();
  const orgId = currentOrganization?.id;
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ provider: 'mtn', phone: '', name: '' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!orgId) return;
    setError(null);
    try {
      const d = await api(`/api/payouts/summary?orgId=${orgId}`);
      setData(d);
      if (d.payoutAccount) setForm(d.payoutAccount);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  const saveAccount = async () => {
    setSaving(true); setNotice(null);
    try {
      await api('/api/payouts/recipient', { method: 'POST', body: JSON.stringify({ orgId, ...form }) });
      setEditing(false); setNotice('Payout account saved.'); load();
    } catch (e: any) { setNotice(e.message); }
    setSaving(false);
  };

  const requestPayout = async () => {
    if (!data) return;
    if (!confirm(`Send ${ghs(data.availablePesewas)} to ${data.payoutAccount?.provider.toUpperCase()} ${data.payoutAccount?.phone}?`)) return;
    setRequesting(true); setNotice(null);
    try {
      const r = await api('/api/payouts/request', { method: 'POST', body: JSON.stringify({ orgId }) });
      setNotice(r.status === 'success' ? 'Payout sent.' : 'Payout is processing — it usually lands within minutes.');
      load();
    } catch (e: any) { setNotice(e.message); }
    setRequesting(false);
  };

  if (!orgId) return <div className="p-8 text-gray-500">Select an organisation to see earnings.</div>;
  if (loading) return <div className="p-8 flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading earnings…</div>;
  if (error || !data) return <div className="p-8"><p className="text-red-600">{error}</p><Button variant="outline" className="mt-3" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Try again</Button></div>;

  const canRequest = data.canManagePayouts && !!data.payoutAccount && data.availablePesewas >= data.minPayoutPesewas && data.inFlightPesewas === 0;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-500">Ticket sales for {currentOrganization?.name}. Tikiti keeps {data.feePercent}% per paid ticket; the rest is yours.</p>
      </div>

      {notice && <div className="rounded-lg border bg-white px-4 py-3 text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4 text-gray-500" />{notice}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 bg-gray-900 text-white border-0">
          <CardHeader className="pb-2"><CardDescription className="text-gray-300 uppercase tracking-wider text-xs">Available to pay out</CardDescription>
            <CardTitle className="text-4xl">{ghs(data.availablePesewas)}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-300">{data.pendingPesewas > 0 ? `${ghs(data.pendingPesewas)} more clears once those events end.` : 'Ticket money clears once each event ends.'}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={requestPayout} disabled={!canRequest || requesting} className="bg-[#f44929] hover:bg-[#d93d1f] text-white">
                {requesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowUpRight className="h-4 w-4 mr-2" />}
                {data.inFlightPesewas > 0 ? 'Payout processing…' : 'Request payout'}
              </Button>
              <span className="text-xs text-gray-400">
                {data.payoutAccount ? `To ${data.payoutAccount.provider.toUpperCase()} ${data.payoutAccount.phone} · min ${ghs(data.minPayoutPesewas)}` : 'Add a payout account to get paid'}
                {!data.canManagePayouts && ' · Only owners and admins can request payouts'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Smartphone className="h-4 w-4" />Payout account</CardTitle></CardHeader>
          <CardContent>
            {!editing ? (
              <div className="space-y-3">
                {data.payoutAccount ? (
                  <div><p className="font-semibold">{data.payoutAccount.name}</p><p className="text-sm text-gray-500">{data.payoutAccount.provider.toUpperCase()} · {data.payoutAccount.phone}</p></div>
                ) : <p className="text-sm text-gray-500">No mobile money account yet.</p>}
                {data.canManagePayouts && <Button variant="outline" size="sm" onClick={() => setEditing(true)}>{data.payoutAccount ? 'Change' : 'Add account'}</Button>}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {PROVIDERS.map((p) => (
                    <button key={p.key} type="button" onClick={() => setForm({ ...form, provider: p.key })}
                      className={`px-3 py-1.5 rounded-full border text-sm ${form.provider === p.key ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold' : 'border-gray-200'}`}>{p.label}</button>
                  ))}
                </div>
                <div><Label htmlFor="phone">Mobile money number</Label><Input id="phone" value={form.phone} maxLength={10} placeholder="0244000000" onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label htmlFor="name">Registered name</Label><Input id="name" value={form.name} placeholder="Name on the MoMo account" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveAccount} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Gross sales" value={ghs(data.grossPesewas)} />
        <Stat label={`Tikiti fee (${data.feePercent}%)`} value={`−${ghs(data.feesPesewas)}`} />
        <Stat label="Paid out" value={ghs(data.paidOutPesewas)} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Ticket sales</CardTitle><CardDescription>Your share of each paid booking.</CardDescription></CardHeader>
        <CardContent>
          {data.entries.length === 0 ? <p className="text-sm text-gray-500">No paid tickets yet.</p> : (
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500"><tr><th className="py-2">Event</th><th>Qty</th><th>Paid</th><th>Status</th><th className="text-right">Your share</th></tr></thead>
              <tbody>
                {data.entries.map((e) => (
                  <tr key={e.bookingId} className="border-t">
                    <td className="py-2 font-medium">{e.eventName}</td><td>{e.quantity}</td>
                    <td>{e.paidAt ? new Date(e.paidAt).toLocaleDateString() : '—'}</td>
                    <td>{e.cleared ? <Badge className="bg-green-100 text-green-700">Cleared</Badge> : <Badge className="bg-gray-100 text-gray-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>}</td>
                    <td className="text-right font-semibold text-green-700">+{ghs(e.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Payouts</CardTitle></CardHeader>
        <CardContent>
          {data.payouts.length === 0 ? <p className="text-sm text-gray-500">No payouts yet.</p> : (
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500"><tr><th className="py-2">Date</th><th>Reference</th><th>Status</th><th className="text-right">Amount</th></tr></thead>
              <tbody>
                {data.payouts.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="py-2">{p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}</td>
                    <td className="font-mono text-xs">{p.reference}</td>
                    <td><Badge className={STATUS[p.status]?.cls || ''}>{STATUS[p.status]?.label || p.status}</Badge></td>
                    <td className="text-right font-semibold">{ghs(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardHeader className="pb-1"><CardDescription className="uppercase tracking-wider text-xs">{label}</CardDescription><CardTitle className="text-xl">{value}</CardTitle></CardHeader></Card>
  );
}
