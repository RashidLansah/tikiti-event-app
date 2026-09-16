import QRCode from 'qrcode';
import { loadPublicTicket } from '@/lib/tickets/publicTicket';

export const dynamic = 'force-dynamic';

const C = { bg: '#faf9f2', fg: '#202220', muted: '#65675d', line: '#deded4', red: '#f44929', purple: '#6256e8' };

const page: React.CSSProperties = {
  minHeight: '100vh', background: C.bg, color: C.fg, padding: '28px 16px 48px',
  fontFamily: '-apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
};
const wrap: React.CSSProperties = { maxWidth: 420, margin: '0 auto' };
const card: React.CSSProperties = { border: `1px solid ${C.line}`, borderRadius: 19, overflow: 'hidden', background: '#fffef9' };
const label: React.CSSProperties = { fontSize: 11, letterSpacing: 1, color: C.muted, textTransform: 'uppercase' };
const value: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: C.fg, marginTop: 4 };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={page}>
      <div style={wrap}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, marginBottom: 18 }}>
          tikiti<span style={{ color: C.red }}>✳</span>
        </div>
        {children}
      </div>
    </main>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <Shell>
      <div style={{ ...card, padding: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 8px', lineHeight: 1.1 }}>{title}</h1>
        <p style={{ color: C.muted, margin: 0, fontSize: 15 }}>{body}</p>
      </div>
    </Shell>
  );
}

export default async function PublicTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ k?: string | string[] }>;
}) {
  const { bookingId } = await params;
  const { k } = await searchParams;
  const token = Array.isArray(k) ? k[0] : k;
  const t = await loadPublicTicket(bookingId, token);

  if (!t) return <Message title="Ticket not found" body="This link is invalid or has expired. Check the link in your SMS or email and try again." />;
  if (t.state === 'inactive') return <Message title="This ticket isn't active" body="This booking is not confirmed. If you think this is a mistake, contact the organiser." />;

  if (t.state === 'used') {
    return (
      <Shell>
        <div style={{ ...card, background: '#ecece4', borderColor: '#cfcfc5', padding: '40px 28px', textAlign: 'center' }}>
          <div style={{ width: 84, height: 84, borderRadius: 999, background: C.fg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 44, fontWeight: 900 }}>✓</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 8px', lineHeight: 1.05 }}>Already scanned</h1>
          <p style={{ color: C.muted, margin: 0, fontSize: 15 }}>
            This ticket was scanned at the door{t.usedAtLabel ? ` on ${t.usedAtLabel}` : ''}.
          </p>
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px dashed #b6b6ad`, fontSize: 13, color: C.muted }}>
            <strong style={{ color: C.fg }}>{t.eventName}</strong><br />Ref {t.refId}
          </div>
        </div>
      </Shell>
    );
  }

  const qrSvg = await QRCode.toString(t.qrPayload, { type: 'svg', margin: 1, color: { dark: C.fg, light: '#ffffff' } });
  const qrSrc = `data:image/svg+xml;base64,${Buffer.from(qrSvg).toString('base64')}`;
  const pngHref = `/t/${encodeURIComponent(t.bookingId)}/ticket.png?k=${encodeURIComponent(token!)}`;

  return (
    <Shell>
      <div style={card}>
        <div style={{ background: C.purple, color: '#fff', padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, letterSpacing: 1, opacity: 0.8, marginBottom: 10 }}>
            <span>TIKITI</span><span>{t.category.toUpperCase()}</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{t.eventName}</div>
          <div style={{ fontSize: 13, marginTop: 8, opacity: 0.9 }}>{t.eventLocation}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '18px 20px', borderBottom: '1px dashed #b6b6ad' }}>
          <div><div style={label}>Date</div><div style={value}>{t.eventDate}{t.eventTime ? ` · ${t.eventTime}` : ''}</div></div>
          <div><div style={label}>Attendee</div><div style={value}>{t.attendee}</div></div>
          <div style={{ textAlign: 'right' }}><div style={label}>Admission</div><div style={value}>{t.quantity} {t.quantity === 1 ? 'person' : 'people'}</div></div>
        </div>
        <div style={{ padding: 22, textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} width={220} height={220} alt="Your ticket QR code" style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 8, background: '#fff' }} />
          <div style={{ fontSize: 12, color: C.muted, marginTop: 12 }}>{t.refId}<br />Scan at the door · {t.amount}</div>
        </div>
      </div>
      <a href={pngHref} download={`tikiti-ticket-${t.refId}.png`} style={{ display: 'block', textAlign: 'center', marginTop: 18, background: C.red, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 15, padding: '14px 28px', borderRadius: 999 }}>
        Save ticket image
      </a>
      <p style={{ fontSize: 12, color: C.muted, marginTop: 18, textAlign: 'center' }}>Please don’t share this link or QR code.</p>
    </Shell>
  );
}
