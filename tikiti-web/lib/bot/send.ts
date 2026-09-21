// Turns a BotPlan into WhatsApp Cloud API calls. This is the ONLY bot file that sends anything.
import { postMessage } from '@/lib/inbox/notifyAdmins';
import type { BotMessage, BotPlan } from './types';

function payloadFor(to: string, m: BotMessage): Record<string, any> {
  if (m.kind === 'buttons') {
    return {
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: m.body.slice(0, 1024) },
        action: {
          buttons: m.buttons.slice(0, 3).map((b) => ({ type: 'reply', reply: { id: b.id.slice(0, 256), title: b.title.slice(0, 20) } })),
        },
      },
    };
  }
  return { to, type: 'text', text: { body: m.body.slice(0, 4096), ...(m.previewUrl ? { preview_url: true } : {}) } };
}

/** Sends the plan's messages in order; resolves with the wamids that were accepted. Never throws. */
export async function sendBotPlan(to: string, plan: BotPlan): Promise<string[]> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const wamids: string[] = [];
  if (!plan.messages.length) return wamids;
  if (!token || !phoneNumberId) {
    console.warn('bot: send skipped, WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID not configured');
    return wamids;
  }
  for (const m of plan.messages) {
    try {
      const r = await postMessage(phoneNumberId, token, payloadFor(to.replace(/^\+/, ''), m));
      const id = r.ok ? r.body?.messages?.[0]?.id : null;
      if (typeof id === 'string' && id) wamids.push(id);
      else if (!r.ok) console.error('bot: send failed', r.status, JSON.stringify(r.body).slice(0, 300));
    } catch (e) {
      console.error('bot: send error', e);
    }
  }
  return wamids;
}
