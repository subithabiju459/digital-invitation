import type { CashfreeOrder, CashfreePaymentAttempt } from "@/lib/cashfree.server";

export type VerifiedPayment = {
  cashfreePaymentId: string;
  providerOrderStatus: string;
};

function orderBelongsToInvitation(order: CashfreeOrder, invitationId: number) {
  if (!order.order_tags || typeof order.order_tags !== "object" || Array.isArray(order.order_tags)) return false;
  const invitationTag = (order.order_tags as Record<string, unknown>).invitation_id;
  return String(invitationTag) === String(invitationId);
}

export function verifiedCashfreePayment(
  order: CashfreeOrder,
  attempts: CashfreePaymentAttempt[],
  expected: { orderId: string; invitationId: number; amount: number; currency: string },
): VerifiedPayment | null {
  if (order.order_id !== expected.orderId || order.order_status !== "PAID") return null;
  if (Number(order.order_amount) !== expected.amount || order.order_currency !== expected.currency) return null;
  if (!orderBelongsToInvitation(order, expected.invitationId)) return null;
  const successfulAttempt = attempts.find((attempt) => attempt.payment_status === "SUCCESS"
    && Number(attempt.payment_amount) === expected.amount
    && attempt.payment_currency === expected.currency
    && (typeof attempt.cf_payment_id === "string" || typeof attempt.cf_payment_id === "number")
    && String(attempt.cf_payment_id).trim().length > 0);
  if (!successfulAttempt) return null;
  const cashfreePaymentId = String(successfulAttempt.cf_payment_id).trim();
  if (!cashfreePaymentId) return null;
  return {
    cashfreePaymentId,
    providerOrderStatus: "PAID",
  };
}
