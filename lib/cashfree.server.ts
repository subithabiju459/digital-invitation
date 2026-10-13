import "server-only";

import { cashfreeWebhookSignatureMatches } from "@/lib/cashfree-webhook";

const API_VERSION = "2025-01-01";
const SANDBOX_BASE_URL = "https://sandbox.cashfree.com";

type CashfreeConfig = {
  clientId: string;
  clientSecret: string;
};

function getCashfreeConfig(): CashfreeConfig {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  const environment = process.env.CASHFREE_ENV;
  if (!clientId || !clientSecret || environment !== "sandbox") {
    throw new Error("Cashfree sandbox configuration is missing.");
  }
  return { clientId, clientSecret };
}

function cashfreeHeaders(config: CashfreeConfig, additional: Record<string, string> = {}) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-api-version": API_VERSION,
    "x-client-id": config.clientId,
    "x-client-secret": config.clientSecret,
    ...additional,
  };
}

export type CashfreeOrder = {
  order_id?: unknown;
  order_amount?: unknown;
  order_currency?: unknown;
  order_status?: unknown;
  order_tags?: unknown;
  payment_session_id?: unknown;
};

export type CashfreePaymentAttempt = {
  cf_payment_id?: unknown;
  payment_status?: unknown;
  payment_amount?: unknown;
  payment_currency?: unknown;
};

export async function createCashfreeOrder(input: {
  orderId: string;
  amount: number;
  currency: string;
  invitationId: number;
  customerId: string;
  customerPhone?: string;
  returnUrl: string;
  notifyUrl: string;
}) {
  const config = getCashfreeConfig();
  const customerDetails: Record<string, string> = { customer_id: input.customerId };
  if (input.customerPhone) customerDetails.customer_phone = input.customerPhone;
  const response = await fetch(`${SANDBOX_BASE_URL}/pg/orders`, {
    method: "POST",
    headers: cashfreeHeaders(config, {
      "x-request-id": crypto.randomUUID(),
      "x-idempotency-key": input.orderId,
    }),
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: input.amount,
      order_currency: input.currency,
      // This is a non-sensitive server-generated association. It is checked
      // again before an order can publish an invitation.
      order_tags: { invitation_id: String(input.invitationId) },
      customer_details: customerDetails,
      order_meta: { return_url: input.returnUrl, notify_url: input.notifyUrl },
    }),
    cache: "no-store",
  });
  const body = await response.json().catch(() => null) as CashfreeOrder | null;
  if (!response.ok || typeof body?.payment_session_id !== "string") {
    throw new Error("Cashfree could not create a payment order.");
  }
  return body;
}

export async function getCashfreeOrder(orderId: string) {
  const config = getCashfreeConfig();
  const response = await fetch(`${SANDBOX_BASE_URL}/pg/orders/${encodeURIComponent(orderId)}`, {
    headers: cashfreeHeaders(config),
    cache: "no-store",
  });
  const body = await response.json().catch(() => null) as CashfreeOrder | null;
  if (!response.ok || !body) throw new Error("Cashfree could not verify this payment order.");
  return body;
}

export async function getCashfreePaymentAttempts(orderId: string) {
  const config = getCashfreeConfig();
  const response = await fetch(`${SANDBOX_BASE_URL}/pg/orders/${encodeURIComponent(orderId)}/payments`, {
    headers: cashfreeHeaders(config),
    cache: "no-store",
  });
  const body = await response.json().catch(() => null) as CashfreePaymentAttempt[] | null;
  if (!response.ok || !Array.isArray(body)) throw new Error("Cashfree could not verify this payment.");
  return body;
}

export function verifyCashfreeWebhookSignature(rawBody: string, timestamp: string | null, signature: string | null) {
  const secret = getCashfreeConfig().clientSecret;
  return cashfreeWebhookSignatureMatches(rawBody, timestamp, signature, secret);
}
