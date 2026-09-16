// Drives the pure USSD menu functions in memory (no network, no Firestore).
// Run: npx tsx scripts/ussd-sim.ts
import { handleInput, welcome, type UssdEvent } from '../lib/ussd/menu';
import type { UssdSessionState } from '../lib/ussd/session';

const events: UssdEvent[] = [
  { id: 'ev1', name: 'Afrochella Accra', date: '2026-12-28', priceGhs: 150 },
  { id: 'ev2', name: 'Tech Meetup Kumasi', date: '2026-10-03', priceGhs: 0 },
  { id: 'ev3', name: 'Jazz Night at +233', date: '2026-10-10', priceGhs: 80 },
  { id: 'ev4', name: 'Startup Pitch Day', date: '2026-10-15', priceGhs: 20 },
  { id: 'ev5', name: 'Comedy Night Osu', date: '2026-10-20', priceGhs: 50 },
  { id: 'ev6', name: 'Marathon Cape Coast', date: '2026-11-01', priceGhs: 30 },
];

function show(label: string, r: { message: string; continueSession: boolean }) {
  console.log(`\n--- ${label} (${r.message.length} chars, ${r.continueSession ? 'CON' : 'END'}) ---`);
  console.log(r.message);
}

let r = welcome(events);
show('dial', r);
let state: UssdSessionState = r.nextState;

for (const [label, input] of [['input 1', '1'], ['input 1 (Buy)', '1'], ['input 2 (qty)', '2'], ['input 1 (Confirm)', '1']] as const) {
  r = handleInput(state, input, events);
  show(label, r);
  state = r.nextState;
  if (r.action) console.log('ACTION:', JSON.stringify(r.action));
}

// Free-event path
console.log('\n=== free event path ===');
r = welcome(events); state = r.nextState;
for (const input of ['2', '1', '1', '1']) { r = handleInput(state, input, events); show(`input ${input}`, r); state = r.nextState; if (r.action) console.log('ACTION:', JSON.stringify(r.action)); }

// Pagination
console.log('\n=== pagination ===');
r = welcome(events); state = r.nextState;
r = handleInput(state, '0', events); show('input 0 (More)', r);
