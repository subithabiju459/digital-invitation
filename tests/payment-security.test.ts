import assert from "node:assert/strict";
import test from "node:test";
// Node's native TypeScript test runner requires explicit local extensions at runtime.
// @ts-expect-error TypeScript's project build intentionally does not enable this import style.
import { cashfreeWebhookSignature, cashfreeWebhookSignatureMatches } from "../lib/cashfree-webhook.ts";
// @ts-expect-error Node's native TypeScript test runner requires explicit local extensions at runtime.
import { verifiedCashfreePayment } from "../lib/payment-verification.ts";
// @ts-expect-error Node's native TypeScript test runner requires explicit local extensions at runtime.
import { getTemplatePrice } from "../lib/template-pricing.ts";

test("Velvet Vows price is supplied by the server-side template catalogue", () => {
  assert.deepEqual(getTemplatePrice("velvet-vows"), { amount: 999, currency: "INR" });
  assert.equal(getTemplatePrice("browser-supplied-price"), null);
});

test("only a paid Cashfree order with a matching successful payment is verified", () => {
  const result = verifiedCashfreePayment(
    { order_id: "amora_0123456789abcdef0123456789abcdef", order_status: "PAID", order_amount: 999, order_currency: "INR", order_tags: { invitation_id: "42" } },
    [{ cf_payment_id: "123", payment_status: "SUCCESS", payment_amount: 999, payment_currency: "INR" }],
    { orderId: "amora_0123456789abcdef0123456789abcdef", invitationId: 42, amount: 999, currency: "INR" },
  );
  assert.deepEqual(result, { cashfreePaymentId: "123", providerOrderStatus: "PAID" });
});

test("a paid status with the wrong amount cannot be verified or published", () => {
  const result = verifiedCashfreePayment(
    { order_id: "amora_0123456789abcdef0123456789abcdef", order_status: "PAID", order_amount: 1, order_currency: "INR", order_tags: { invitation_id: "42" } },
    [{ cf_payment_id: "123", payment_status: "SUCCESS", payment_amount: 1, payment_currency: "INR" }],
    { orderId: "amora_0123456789abcdef0123456789abcdef", invitationId: 42, amount: 999, currency: "INR" },
  );
  assert.equal(result, null);
});

test("a Cashfree PAID order for a different invitation cannot be verified or published", () => {
  const result = verifiedCashfreePayment(
    { order_id: "amora_0123456789abcdef0123456789abcdef", order_status: "PAID", order_amount: 999, order_currency: "INR", order_tags: { invitation_id: "99" } },
    [{ cf_payment_id: "123", payment_status: "SUCCESS", payment_amount: 999, payment_currency: "INR" }],
    { orderId: "amora_0123456789abcdef0123456789abcdef", invitationId: 42, amount: 999, currency: "INR" },
  );
  assert.equal(result, null);
});

test("a Cashfree response without a successful payment ID cannot be verified or published", () => {
  const result = verifiedCashfreePayment(
    { order_id: "amora_0123456789abcdef0123456789abcdef", order_status: "PAID", order_amount: 999, order_currency: "INR", order_tags: { invitation_id: "42" } },
    [{ payment_status: "SUCCESS", payment_amount: 999, payment_currency: "INR" }],
    { orderId: "amora_0123456789abcdef0123456789abcdef", invitationId: 42, amount: 999, currency: "INR" },
  );
  assert.equal(result, null);
});

test("Cashfree webhook signatures must match the raw body and timestamp", () => {
  const rawBody = '{"type":"PAYMENT_SUCCESS_WEBHOOK"}';
  const timestamp = "2026-10-13T10:00:00+05:30";
  const signature = cashfreeWebhookSignature(rawBody, timestamp, "test-secret");
  assert.equal(cashfreeWebhookSignatureMatches(rawBody, timestamp, signature, "test-secret"), true);
  assert.equal(cashfreeWebhookSignatureMatches(`${rawBody} `, timestamp, signature, "test-secret"), false);
});
