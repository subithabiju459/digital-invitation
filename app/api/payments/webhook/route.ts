import { NextResponse } from "next/server";
import { verifyCashfreeWebhookSignature } from "@/lib/cashfree.server";
import { verifyAndSettlePayment } from "@/lib/payment-settlement.server";

export async function POST(request: Request) {
  const rawBody = await request.text();
  try {
    if (!verifyCashfreeWebhookSignature(rawBody, request.headers.get("x-webhook-timestamp"), request.headers.get("x-webhook-signature"))) {
      return new NextResponse("Invalid webhook signature", { status: 401 });
    }
    const event = JSON.parse(rawBody) as { data?: { order?: { order_id?: unknown } } };
    const orderId = event.data?.order?.order_id;
    if (typeof orderId !== "string" || !/^amora_[a-f0-9]{32}$/.test(orderId)) {
      return new NextResponse("Ignored", { status: 200 });
    }
    await verifyAndSettlePayment(orderId);
    return new NextResponse("OK", { status: 200 });
  } catch {
    return new NextResponse("Webhook processing failed", { status: 500 });
  }
}
