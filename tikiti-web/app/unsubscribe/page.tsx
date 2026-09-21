'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const PAPER = '#faf9f2';
const INK = '#202220';
const RED = '#f44929';

function Unsubscribe() {
  const token = useSearchParams().get('t') || '';
  const [masked, setMasked] = useState<string | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'working' | 'done' | 'invalid'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    // The token is an opaque HMAC-signed id, not personal data.
    fetch(`/api/audience/unsubscribe?t=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) { setState('invalid'); return; }
        setMasked(j.masked || null);
        setState('ready');
      })
      .catch(() => setState('invalid'));
  }, [token]);

  const confirm = async () => {
    setState('working');
    setError(null);
    try {
      const r = await fetch('/api/audience/unsubscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, channel: 'all' }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Something went wrong');
      setState('done');
    } catch (e: any) {
      setError(e.message);
      setState('ready');
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: PAPER, color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <p style={{ fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.6, margin: 0 }}>Tikiti</p>
        {state === 'loading' && <p style={{ marginTop: 24 }}>Loading…</p>}
        {state === 'invalid' && (
          <>
            <h1 style={{ fontSize: 28, lineHeight: 1.15, margin: '16px 0 8px' }}>This link is not valid</h1>
            <p style={{ opacity: 0.7 }}>It may have been copied incompletely. You can also reply STOP to any Tikiti message.</p>
          </>
        )}
        {(state === 'ready' || state === 'working') && (
          <>
            <h1 style={{ fontSize: 28, lineHeight: 1.15, margin: '16px 0 8px' }}>Stop event updates?</h1>
            <p style={{ opacity: 0.7 }}>Tikiti will stop sending event suggestions to</p>
            <p style={{ fontSize: 20, fontWeight: 600, margin: '8px 0 28px' }}>{masked}</p>
            <button
              onClick={confirm}
              disabled={state === 'working'}
              style={{ background: RED, color: '#fff', border: 0, borderRadius: 999, padding: '14px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer', opacity: state === 'working' ? 0.6 : 1 }}
            >
              {state === 'working' ? 'Unsubscribing…' : 'Unsubscribe'}
            </button>
            <p style={{ fontSize: 13, opacity: 0.6, marginTop: 16 }}>Tickets you buy will still be delivered.</p>
            {error && <p role="alert" style={{ color: RED, marginTop: 12 }}>{error}</p>}
          </>
        )}
        {state === 'done' && (
          <>
            <h1 style={{ fontSize: 28, lineHeight: 1.15, margin: '16px 0 8px' }}>You are unsubscribed</h1>
            <p style={{ opacity: 0.7 }}>We will not send event suggestions to {masked}. You can opt in again anytime from an event page.</p>
          </>
        )}
      </div>
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<main style={{ minHeight: '100vh', background: PAPER }} />}>
      <Unsubscribe />
    </Suspense>
  );
}
