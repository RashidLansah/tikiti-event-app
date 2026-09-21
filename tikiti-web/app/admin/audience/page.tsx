'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase/config';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Megaphone, RefreshCw, Loader2 } from 'lucide-react';
import type { SegmentCounts } from '@/lib/audience/segments';

async function api(path: string) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

const SOURCE_LABELS: Record<string, string> = {
  google_form: 'Google Form', web_event_prompt: 'Event page prompt', web_signup: 'Web sign-up', registration: 'Registration',
  whatsapp_bot: 'WhatsApp bot', ussd: 'USSD', import: 'Import', backfill: 'Backfill',
};

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Card className="rounded-[24px] border-black/10 bg-white shadow-none">
      <CardContent className="p-5">
        <p className="text-xs text-[#86868b]">{label}</p>
        <p className="text-3xl font-semibold text-[#1d1d1f] mt-1 tabular-nums">{value.toLocaleString()}</p>
        {hint && <p className="text-xs text-[#86868b] mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function CountTable({ title, rows, labels }: { title: string; rows: Array<{ key: string; count: number }>; labels?: Record<string, string> }) {
  return (
    <Card className="rounded-[24px] border-black/10 bg-white shadow-none">
      <CardContent className="p-5">
        <h2 className="text-sm font-semibold text-[#1d1d1f] mb-3">{title}</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-[#86868b]">Nothing yet.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-black/5 first:border-t-0">
                  <td className="py-2 text-[#333]">{labels?.[r.key] || r.key}</td>
                  <td className="py-2 text-right tabular-nums text-[#1d1d1f] font-medium">{r.count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

export default function AudiencePage() {
  const { user } = useAuth();
  const [data, setData] = useState<SegmentCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setData(await api('/api/admin/audience/summary'));
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f] flex items-center gap-2"><Megaphone className="w-6 h-6" /> Audience</h1>
          <p className="text-sm text-[#86868b] mt-1">People Tikiti knows about, and who has agreed to hear about events.</p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}Refresh
        </Button>
      </div>

      <p className="text-sm text-[#333] bg-[#f5f5f7] rounded-2xl px-4 py-3">
        Contacts without consent are kept for insight only and are never messaged.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!data && loading && <p className="text-sm text-[#86868b]">Loading…</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Total contacts" value={data.total} hint={`${data.reachableAny.toLocaleString()} reachable on any channel`} />
            <Stat label="Reachable on WhatsApp" value={data.reachable.whatsapp} />
            <Stat label="Reachable on SMS" value={data.reachable.sms} />
            <Stat label="Reachable on Email" value={data.reachable.email} />
            <Stat label="Paid before" value={data.paidBefore} />
            <Stat label="New in 7 days" value={data.createdLast7Days} />
            <Stat label="New in 30 days" value={data.createdLast30Days} />
          </div>
          {data.truncated && <p className="text-xs text-amber-700">Counts cover the first 20,000 contacts only.</p>}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <CountTable title="By city (top 10)" rows={data.byCity} />
            <CountTable title="By interest" rows={data.byInterest} />
            <CountTable title="By source" rows={data.bySource} labels={SOURCE_LABELS} />
          </div>
        </>
      )}
    </div>
  );
}
