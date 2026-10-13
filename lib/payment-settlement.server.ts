import "server-only";

import { getCashfreeOrder, getCashfreePaymentAttempts } from "@/lib/cashfree.server";
import { verifiedCashfreePayment } from "@/lib/payment-verification";
import { getTemplatePrice } from "@/lib/template-pricing";
import { createAdminClient } from "@/utils/supabase/admin";

type PaymentRecord = {
  id: number;
  invitation_id: number;
  order_id: string;
  amount: number | string;
  currency: string;
  status: string;
  template_id: string;
};

export type PaymentSettlement = {
  status: "paid" | "pending" | "failed" | "not_found";
  invitationSlug?: string;
};

export async function verifyAndSettlePayment(orderId: string): Promise<PaymentSettlement> {
  const supabase = createAdminClient();
  const { data: payment, error } = await supabase
    .from("payments")
    .select("id, invitation_id, order_id, amount, currency, status, template_id")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error || !payment) return { status: "not_found" };

  const record = payment as PaymentRecord;
  const configuredPrice = getTemplatePrice(record.template_id);
  if (!configuredPrice
    || Number(record.amount) !== configuredPrice.amount
    || record.currency !== configuredPrice.currency) {
    return { status: "failed" };
  }
  const [order, attempts] = await Promise.all([
    getCashfreeOrder(record.order_id),
    getCashfreePaymentAttempts(record.order_id),
  ]);
  const verified = verifiedCashfreePayment(order, attempts, {
    orderId: record.order_id,
    invitationId: record.invitation_id,
    amount: Number(record.amount),
    currency: record.currency,
  });

  if (verified) {
    const { data: published, error: publishError } = await supabase.rpc("mark_invitation_payment_paid", {
      p_order_id: record.order_id,
      p_invitation_id: record.invitation_id,
      p_amount: Number(record.amount),
      p_currency: record.currency,
      p_cashfree_payment_id: verified.cashfreePaymentId,
      p_provider_order_status: verified.providerOrderStatus,
      p_verification_details: {
        order_status: order.order_status,
        order_amount: order.order_amount,
        order_currency: order.order_currency,
        verified_payment_status: "SUCCESS",
      },
    });
    if (publishError || published !== true) {
      throw new Error("We could not complete payment verification.");
    }
    const { data: invitation } = await supabase.from("invitations").select("slug").eq("id", record.invitation_id).maybeSingle();
    return { status: "paid", invitationSlug: invitation?.slug };
  }

  const providerStatus = typeof order.order_status === "string" ? order.order_status : "UNKNOWN";
  const localStatus = ["EXPIRED", "FAILED", "TERMINATED"].includes(providerStatus) ? "failed" : "pending";
  await supabase.from("payments").update({
    status: localStatus,
    provider_order_status: providerStatus,
    verification_details: {
      order_status: order.order_status,
      order_amount: order.order_amount,
      order_currency: order.order_currency,
      verified_payment_status: "NOT_SUCCESSFUL",
    },
    updated_at: new Date().toISOString(),
  }).eq("id", record.id);
  return { status: localStatus };
}
