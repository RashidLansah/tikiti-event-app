import { auth } from '../config/firebase';

const BASE_URL = __DEV__ ? 'http://localhost:3000' : 'https://gettikiti.com';

async function request(path, { method = 'GET', body } = {}) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

export const paymentsApi = {
  initializeTicket: (payload) => request('/api/tickets/initialize', { method: 'POST', body: payload }),
  verifyTicket: (reference) => request('/api/tickets/verify', { method: 'POST', body: { reference } }),
  reconcileTickets: () => request('/api/tickets/reconcile', { method: 'POST' }),
  emailTicket: (bookingId) => request('/api/tickets/notify', { method: 'POST', body: { bookingId } }),
  getEarnings: () => request('/api/payouts/summary'),
  savePayoutAccount: (payload) => request('/api/payouts/recipient', { method: 'POST', body: payload }),
  requestPayout: () => request('/api/payouts/request', { method: 'POST' }),
};

export const formatGhs = (pesewas) => `GH₵${((pesewas || 0) / 100).toFixed(2)}`;
