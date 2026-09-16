import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import QRCode from 'qrcode';
import { loadPublicTicket } from '@/lib/tickets/publicTicket';

export const dynamic = 'force-dynamic';

const C = { bg: '#faf9f2', fg: '#202220', muted: '#65675d', line: '#deded4', red: '#f44929', purple: '#6256e8' };
const W = 720, H = 1100;
const headers = { 'Cache-Control': 'no-store' };

export async function GET(req: NextRequest, ctx: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await ctx.params;
  const token = req.nextUrl.searchParams.get('k') ?? undefined;
  const t = await loadPublicTicket(bookingId, token);

  if (!t || t.state === 'inactive') {
    return new Response('Ticket not found', { status: 404, headers });
  }

  if (t.state === 'used') {
    return new ImageResponse(
      (
        <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.bg, color: C.fg, fontFamily: 'sans-serif', padding: 60 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 600, background: '#ecece4', border: '2px solid #cfcfc5', borderRadius: 32, padding: '70px 48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 150, height: 150, borderRadius: 999, background: C.fg, color: '#fff', fontSize: 34, fontWeight: 900, letterSpacing: 4, marginBottom: 36 }}>USED</div>
            <div style={{ fontSize: 48, fontWeight: 900, marginBottom: 16 }}>Already scanned</div>
            <div style={{ fontSize: 24, color: C.muted, textAlign: 'center', lineHeight: 1.4 }}>
              {`This ticket was scanned at the door${t.usedAtLabel ? ` on ${t.usedAtLabel}` : ''}.`}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40, paddingTop: 30, borderTop: '2px dashed #b6b6ad', width: '100%', fontSize: 22, color: C.muted }}>
              <div style={{ color: C.fg, fontWeight: 700 }}>{t.eventName}</div>
              <div>{`Ref ${t.refId}`}</div>
            </div>
          </div>
        </div>
      ),
      { width: W, height: H, headers },
    );
  }

  const qr = await QRCode.toDataURL(t.qrPayload, { width: 360, margin: 1, color: { dark: C.fg, light: '#ffffff' } });

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', background: C.bg, color: C.fg, fontFamily: 'sans-serif', padding: 40 }}>
        <div style={{ display: 'flex', fontSize: 40, fontWeight: 800, letterSpacing: -2, marginBottom: 24 }}>
          <span>tikiti</span><span style={{ color: C.red }}>*</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', border: `2px solid ${C.line}`, borderRadius: 32, overflow: 'hidden', background: '#fffef9', flexGrow: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', background: C.purple, color: '#fff', padding: 36 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, letterSpacing: 2, opacity: 0.8, marginBottom: 16 }}>
              <span>TIKITI</span><span>{t.category.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.1 }}>{t.eventName}</div>
            <div style={{ fontSize: 22, marginTop: 14, opacity: 0.9 }}>{t.eventLocation}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '28px 36px', borderBottom: '2px dashed #b6b6ad' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 16, letterSpacing: 2, color: C.muted }}>DATE</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{`${t.eventDate}${t.eventTime ? ` · ${t.eventTime}` : ''}`}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 16, letterSpacing: 2, color: C.muted }}>ATTENDEE</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{t.attendee}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ fontSize: 16, letterSpacing: 2, color: C.muted }}>ADMISSION</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{`${t.quantity} ${t.quantity === 1 ? 'person' : 'people'}`}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, padding: 36 }}>
            <img src={qr} width={380} height={380} style={{ border: `2px solid ${C.line}`, borderRadius: 20, padding: 12, background: '#fff' }} />
            <div style={{ fontSize: 22, color: C.muted, marginTop: 24, textAlign: 'center' }}>{t.refId}</div>
            <div style={{ fontSize: 20, color: C.muted, marginTop: 6 }}>{`Scan at the door · ${t.amount.replace('GH₵', 'GHS ')}`}</div>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, headers },
  );
}
