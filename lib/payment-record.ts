export type PaymentInsertInput = {
  invitationId: number;
  orderId: string;
  templateId: string;
  amount: number;
  currency: string;
};

// Matches the non-default, required fields in the payments migration. The
// server supplies every value; nothing here is taken from the browser.
export function paymentInsertPayload(input: PaymentInsertInput) {
  return {
    invitation_id: input.invitationId,
    order_id: input.orderId,
    provider: "cashfree",
    template_id: input.templateId,
    amount: input.amount,
    currency: input.currency,
    status: "created",
  };
}
