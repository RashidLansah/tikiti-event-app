// Paystack Billing Service
// Raw fetch wrapper for Paystack REST API — no SDK needed

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }
  return key;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getSecretKey()}`,
    'Content-Type': 'application/json',
  };
}

async function paystackRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  body?: Record<string, any>
): Promise<{ status: boolean; message: string; data: T }> {
  const url = `${PAYSTACK_BASE_URL}${endpoint}`;

  const options: RequestInit = {
    method,
    headers: headers(),
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const result = await response.json();

  if (!response.ok) {
    console.error(`Paystack API error [${method} ${endpoint}]:`, result);
    throw new Error(result.message || `Paystack API error: ${response.status}`);
  }

  return result;
}

// ─── Transaction ────────────────────────────────────────────

export interface InitializeTransactionParams {
  email: string;
  amount: number; // in smallest currency unit (cents for USD, kobo for NGN)
  currency?: string;
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
  plan?: string; // Paystack plan code — if provided, amount is ignored
  channels?: string[];
}

export interface TransactionData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface VerifyTransactionData {
  id: number;
  status: string; // 'success' | 'failed' | 'abandoned'
  reference: string;
  amount: number;
  currency: string;
  customer: {
    id: number;
    email: string;
    customer_code: string;
    first_name: string | null;
    last_name: string | null;
  };
  authorization: {
    authorization_code: string;
    card_type: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    bin: string;
    bank: string;
    channel: string;
    signature: string;
    reusable: boolean;
  };
  plan_object?: {
    id: number;
    name: string;
    plan_code: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Initialize a transaction — returns a Paystack checkout URL
 */
export async function initializeTransaction(
  params: InitializeTransactionParams
): Promise<TransactionData> {
  const result = await paystackRequest<TransactionData>(
    'POST',
    '/transaction/initialize',
    params
  );
  return result.data;
}

/**
 * Verify a transaction by reference
 */
export async function verifyTransaction(
  reference: string
): Promise<VerifyTransactionData> {
  const result = await paystackRequest<VerifyTransactionData>(
    'GET',
    `/transaction/verify/${encodeURIComponent(reference)}`
  );
  return result.data;
}

// ─── Subscriptions ──────────────────────────────────────────

export interface SubscriptionData {
  id: number;
  status: string; // 'active' | 'non-renewing' | 'attention' | 'completed' | 'cancelled'
  subscription_code: string;
  email_token: string;
  amount: number;
  plan: {
    id: number;
    name: string;
    plan_code: string;
    amount: number;
    interval: string;
  };
  authorization: {
    authorization_code: string;
    last4: string;
    card_type: string;
    bank: string;
  };
  customer: {
    customer_code: string;
    email: string;
  };
  next_payment_date: string;
  created_at: string;
}

/**
 * Create a subscription for a customer using their card authorization
 */
export async function createSubscription(
  customerCode: string,
  planCode: string,
  authorizationCode: string
): Promise<SubscriptionData> {
  const result = await paystackRequest<SubscriptionData>(
    'POST',
    '/subscription',
    {
      customer: customerCode,
      plan: planCode,
      authorization: authorizationCode,
    }
  );
  return result.data;
}

/**
 * Get subscription details by code
 */
export async function getSubscription(
  subscriptionCode: string
): Promise<SubscriptionData> {
  const result = await paystackRequest<SubscriptionData>(
    'GET',
    `/subscription/${encodeURIComponent(subscriptionCode)}`
  );
  return result.data;
}

/**
 * Disable (cancel) a subscription
 */
export async function cancelSubscription(
  subscriptionCode: string,
  emailToken: string
): Promise<void> {
  await paystackRequest('POST', '/subscription/disable', {
    code: subscriptionCode,
    token: emailToken,
  });
}

/**
 * Enable a previously disabled subscription
 */
export async function enableSubscription(
  subscriptionCode: string,
  emailToken: string
): Promise<void> {
  await paystackRequest('POST', '/subscription/enable', {
    code: subscriptionCode,
    token: emailToken,
  });
}

// ─── Customers ──────────────────────────────────────────────

export interface CustomerData {
  id: number;
  email: string;
  customer_code: string;
  first_name: string | null;
  last_name: string | null;
  authorizations: Array<{
    authorization_code: string;
    card_type: string;
    last4: string;
    bank: string;
    reusable: boolean;
  }>;
  subscriptions: Array<{
    subscription_code: string;
    plan: { plan_code: string; name: string };
    status: string;
  }>;
}

/**
 * Create a Paystack customer
 */
export async function createCustomer(
  email: string,
  firstName?: string,
  lastName?: string
): Promise<CustomerData> {
  const result = await paystackRequest<CustomerData>('POST', '/customer', {
    email,
    first_name: firstName,
    last_name: lastName,
  });
  return result.data;
}

/**
 * Fetch a customer by email or customer code
 */
export async function getCustomer(
  emailOrCode: string
): Promise<CustomerData> {
  const result = await paystackRequest<CustomerData>(
    'GET',
    `/customer/${encodeURIComponent(emailOrCode)}`
  );
  return result.data;
}

/**
 * Get or create a Paystack customer for an email
 */
export async function getOrCreateCustomer(
  email: string,
  firstName?: string,
  lastName?: string
): Promise<CustomerData> {
  try {
    return await getCustomer(email);
  } catch {
    // Customer doesn't exist, create one
    return await createCustomer(email, firstName, lastName);
  }
}

// ─── Webhook Verification ───────────────────────────────────

import crypto from 'crypto';

/**
 * Verify Paystack webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const hash = crypto
    .createHmac('sha512', getSecretKey())
    .update(body)
    .digest('hex');
  return hash === signature;
}
