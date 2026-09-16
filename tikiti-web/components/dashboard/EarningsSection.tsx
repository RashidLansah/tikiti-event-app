'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Wallet } from 'lucide-react';
import { auth } from '@/lib/firebase/config';

type Summary = {
  grossPesewas: number; feesPesewas: number; netPesewas: number; availablePesewas: number;
  pendingPesewas: number; paidOutPesewas: number; feePercent: number;
  payoutAccount: { provider: string; phone: string } | null;
};

const ghs = (p: number) => `GH₵${((p || 0) / 100).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function EarningsSection({ orgId }: { orgId?: string }) {
  const [data, setData] = useState<Summary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/payouts/summary?orgId=${orgId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error();
        setData(await res.json());
      } catch { setFailed(true); }
    })();
  }, [orgId]);

  if (!orgId || failed) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[#333]">Earnings</h2>
        <Link href="/dashboard/earnings" className="text-sm font-semibold text-[#f44929] flex items-center gap-1">
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link href="/dashboard/earnings" className="rounded-[24px] px-8 py-7 bg-[#202220] text-white flex flex-col gap-6 md:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-xs tracking-wider uppercase text-white/70">Available to pay out</p>
            <Wallet className="w-5 h-5 text-white/80" />
          </div>
          <p className="text-5xl font-semibold leading-none">{data ? ghs(data.availablePesewas) : '—'}</p>
          <p className="text-sm text-white/70">
            {!data ? 'Loading…' : data.pendingPesewas > 0 ? `${ghs(data.pendingPesewas)} clears when events end` : data.payoutAccount ? `Paying to ${data.payoutAccount.provider.toUpperCase()} ${data.payoutAccount.phone}` : 'Add a payout account to get paid'}
          </p>
        </Link>
        <div className="border border-black/10 rounded-[24px] px-8 py-7 flex flex-col gap-6">
          <p className="text-2xl font-semibold text-[#333]">Gross sales</p>
          <p className="text-5xl font-semibold text-[#333] leading-none">{data ? ghs(data.grossPesewas) : '—'}</p>
          <p className="text-base text-[#333]">{data ? `Tikiti fee ${data.feePercent}% · −${ghs(data.feesPesewas)}` : ' '}</p>
        </div>
        <div className="border border-black/10 rounded-[24px] px-8 py-7 flex flex-col gap-6">
          <p className="text-2xl font-semibold text-[#333]">Paid out</p>
          <p className="text-5xl font-semibold text-[#333] leading-none">{data ? ghs(data.paidOutPesewas) : '—'}</p>
          <p className="text-base text-[#333]">{data ? `Net earned ${ghs(data.netPesewas)}` : ' '}</p>
        </div>
      </div>
    </div>
  );
}
