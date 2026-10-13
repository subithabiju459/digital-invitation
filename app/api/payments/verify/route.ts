import { NextResponse } from "next/server";
import { verifyAndSettlePayment } from "@/lib/payment-settlement.server";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { orderId?: unknown };
    if (typeof body.orderId !== "string" || !/^amora_[a-f0-9]{32}$/.test(body.orderId)) {
      return NextResponse.json({ error: "This payment could not be found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    const payment = await verifyAndSettlePayment(body.orderId);
    if (payment.status === "not_found") return NextResponse.json({ error: "This payment could not be found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json(payment, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "We could not verify this payment yet. Please try again." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
