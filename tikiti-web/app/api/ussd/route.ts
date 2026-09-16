/**
 * POST /api/ussd — Arkesel USSD callback.
 *
 * Assumed Arkesel contract (source: https://github.com/ArkeselDev/express-ussd-sample/blob/main/app.js,
 * documented at https://developers.arkesel.com/ under "USSD"):
 *
 *   Request (JSON, POSTed on every user input):
 *     { sessionID: string, userID: string, newSession: boolean, msisdn: string, userData: string, network: string }
 *     - newSession is true on the first hit (userData is the dialled code); afterwards userData is the text the user typed.
 *     - network is the carrier name, e.g. "MTN", "Vodafone"/"Telecel", "AirtelTigo".
 *
 *   Response (JSON, always HTTP 200):
 *     { sessionID: string, userID: string, msisdn: string, message: string, continueSession: boolean }
 *     - continueSession true = show `message` and wait for input; false = show `message` and end the session.
 *
 * Adjust `parseArkeselBody` / `respond` below if Arkesel's field names differ.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { clearSession, INITIAL_SESSION, loadSession, saveSession } from '@/lib/ussd/session';
import { handleInput, welcome, type MenuResult } from '@/lib/ussd/menu';
import { loadUssdEvents } from '@/lib/ussd/events';
import { createUssdPurchase } from '@/lib/ussd/payment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ArkeselRequest {
  sessionID: string;
  userID: string;
  newSession: boolean;
  msisdn: string;
  userData: string;
  network?: string;
}

async function parseArkeselBody(req: NextRequest): Promise<ArkeselRequest> {
  const ct = req.headers.get('content-type') || '';
  let raw: Record<string, any> = {};
  if (ct.includes('application/json')) raw = await req.json().catch(() => ({}));
  else if (ct.includes('form')) raw = Object.fromEntries((await req.formData()).entries());
  else {
    const text = await req.text();
    try { raw = JSON.parse(text); } catch { raw = Object.fromEntries(new URLSearchParams(text).entries()); }
  }
  const msisdn = String(raw.msisdn || raw.userID || raw.phoneNumber || '');
  return {
    sessionID: String(raw.sessionID || raw.sessionId || ''),
    userID: String(raw.userID || raw.userId || msisdn),
    newSession: raw.newSession === true || raw.newSession === 'true' || raw.newSession === 1 || raw.newSession === '1',
    msisdn,
    userData: String(raw.userData ?? raw.text ?? ''),
    network: raw.network ? String(raw.network) : undefined,
  };
}

function respond(r: Pick<ArkeselRequest, 'sessionID' | 'userID' | 'msisdn'>, message: string, continueSession: boolean) {
  return NextResponse.json(
    { sessionID: r.sessionID, userID: r.userID, msisdn: r.msisdn, message, continueSession },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  let parsed: ArkeselRequest = { sessionID: '', userID: '', newSession: true, msisdn: '', userData: '' };
  try {
    parsed = await parseArkeselBody(req);
    const db = getAdminFirestore();
    const events = await loadUssdEvents(db);

    let result: MenuResult;
    const existing = parsed.newSession || !parsed.sessionID ? null : await loadSession(db, parsed.sessionID);
    if (!existing) {
      result = welcome(events);
    } else {
      result = handleInput(existing, parsed.userData, events);
    }

    if (result.action?.type === 'purchase') {
      const purchase = await createUssdPurchase(db, {
        eventId: result.action.eventId,
        quantity: result.action.quantity,
        msisdn: parsed.msisdn,
        network: parsed.network,
        sessionId: parsed.sessionID,
      });
      if (!purchase.ok) result = { ...result, message: purchase.error, continueSession: false, nextState: INITIAL_SESSION };
    }

    if (parsed.sessionID) {
      if (result.continueSession) await saveSession(db, parsed.sessionID, result.nextState, { msisdn: parsed.msisdn, network: parsed.network });
      else await clearSession(db, parsed.sessionID);
    }
    return respond(parsed, result.message, result.continueSession);
  } catch (error) {
    console.error('[ussd]', error);
    return respond(parsed, 'Sorry, something went wrong. Please try again.', false);
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'tikiti-ussd' });
}
