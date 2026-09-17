// Simulates a WhatsApp Cloud API image-message webhook against the local dev server (no Meta needed).
// Run: npx tsx scripts/whatsapp-sim.ts ./path/to/flyer.jpg ["optional caption"]
//   Optional env: WEBHOOK_URL (default http://localhost:3000/api/inbox/whatsapp)
// Signs the payload with WHATSAPP_APP_SECRET from .env.local and passes the image via the dev-only
// `x-tikiti-test-image` header (see the route header comment).
import { createHmac, randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { extname, resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(__dirname, '../.env.local') });

const [, , imageArg, captionArg] = process.argv;
if (!imageArg) {
  console.error('Usage: npx tsx scripts/whatsapp-sim.ts <image-file> ["caption"]');
  process.exit(1);
}
const secret = process.env.WHATSAPP_APP_SECRET;
if (!secret) {
  console.error('WHATSAPP_APP_SECRET is not set in .env.local');
  process.exit(1);
}

const url = process.env.WEBHOOK_URL || 'http://localhost:3000/api/inbox/whatsapp';
const mimeByExt: Record<string, string> = { '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
const mime = mimeByExt[extname(imageArg).toLowerCase()] || 'image/jpeg';
const base64 = readFileSync(resolve(imageArg)).toString('base64');
const messageId = `wamid.SIM.${randomUUID()}`;

const payload = {
  object: 'whatsapp_business_account',
  entry: [{
    id: 'WABA_ID',
    changes: [{
      field: 'messages',
      value: {
        messaging_product: 'whatsapp',
        metadata: { display_phone_number: '233200000000', phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || 'PHONE_NUMBER_ID' },
        contacts: [{ profile: { name: 'Sim Tester' }, wa_id: '233241234567' }],
        messages: [{
          from: '233241234567',
          id: messageId,
          timestamp: String(Math.floor(Date.now() / 1000)),
          type: 'image',
          image: { id: 'SIM_MEDIA_ID', mime_type: mime, sha256: 'sim', caption: captionArg || 'Forwarded flyer' },
        }],
      },
    }],
  }],
};

async function main() {
  const rawBody = JSON.stringify({ ...payload, _tikitiTestImage: `data:${mime};base64,${base64}` });
  const signature = 'sha256=' + createHmac('sha256', secret!).update(rawBody, 'utf8').digest('hex');
  console.log(`POST ${url} (message ${messageId}, ${mime}, ${Math.round(base64.length * 0.75 / 1024)} KB)`);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hub-signature-256': signature,
    },
    body: rawBody,
  });
  console.log(res.status, await res.text());
}

main().catch((e) => { console.error(e); process.exit(1); });
