import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createCashfreeOrder } from "@/lib/cashfree.server";
import { draftPreviewAccess } from "@/lib/invitation-access";
import { paymentPreviewCookieName } from "@/lib/draft-preview";
import { getTemplatePrice } from "@/lib/template-pricing";
import { createAdminClient } from "@/utils/supabase/admin";

const privateHeaders = {
  "Cache-Control": "no-store, private, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

function response(body: Record<string, string>, status = 200) {
  return NextResponse.json(body, { status, headers: privateHeaders });
}

function customerPhone(value: unknown) {
  const digits = typeof value === "string" ? value.replace(/\D/g, "") : "";
  return digits.length >= 10 ? digits.slice(-10) : undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { slug?: unknown };
    if (typeof body.slug !== "string" || body.slug.length > 180) return response({ error: "This preview is unavailable." }, 401);

    // Set only after successful preview authorization and scoped to
    // /api/payments so it is not sent to unrelated application routes.
    const token = (await cookies()).get(paymentPreviewCookieName(body.slug))?.value;
    const supabase = createAdminClient();
    const { data: invitation, error: invitationError } = await supabase
      .from("invitations")
      .select("id, slug, status, template_id, wedding_date, wedding_time, rsvp_phone, preview_token_hash, preview_token_expires_at")
      .eq("slug", body.slug)
      .maybeSingle();
    if (invitationError || !invitation) return response({ error: "This preview is unavailable." }, 401);

    const access = draftPreviewAccess({
      status: invitation.status,
      weddingDate: invitation.wedding_date,
      weddingTime: invitation.wedding_time,
      previewTokenHash: invitation.preview_token_hash,
      previewTokenExpiresAt: invitation.preview_token_expires_at,
    }, token);
    if (access === "expired") return response({ error: "This invitation is no longer available." }, 410);
    if (access !== "available") return response({ error: "This preview is unavailable." }, 401);

    const price = getTemplatePrice(invitation.template_id);
    if (!price) return response({ error: "This template is not available for payment." }, 400);

    const { data: activePayment } = await supabase
      .from("payments")
      .select("order_id, payment_session_id")
      .eq("invitation_id", invitation.id)
      .in("status", ["created", "pending"])
      .maybeSingle();
    const orderId = activePayment?.order_id ?? `amora_${crypto.randomUUID().replaceAll("-", "")}`;

    if (!activePayment) {
      const { error: insertError } = await supabase.from("payments").insert({
        invitation_id: invitation.id,
        order_id: orderId,
        provider: "cashfree",
        template_id: invitation.template_id,
        amount: price.amount,
        currency: price.currency,
        status: "created",
      });
      if (insertError) return response({ error: "A payment session is already being prepared. Please try again." }, 409);
    }

    if (activePayment?.payment_session_id) {
      return response({ orderId, paymentSessionId: activePayment.payment_session_id });
    }

    const origin = request.nextUrl.origin;
    const order = await createCashfreeOrder({
      orderId,
      amount: price.amount,
      currency: price.currency,
      invitationId: invitation.id,
      customerId: `invite_${invitation.id}`,
      customerPhone: customerPhone(invitation.rsvp_phone),
      returnUrl: `${origin}/payment/return?order_id={order_id}`,
      notifyUrl: `${origin}/api/payments/webhook`,
    });
    const sessionId = order.payment_session_id as string;
    const { error: updateError } = await supabase.from("payments").update({
      status: "pending",
      payment_session_id: sessionId,
      provider_order_status: typeof order.order_status === "string" ? order.order_status : "ACTIVE",
      updated_at: new Date().toISOString(),
    }).eq("order_id", orderId);
    if (updateError) return response({ error: "We could not prepare checkout. Please try again." }, 500);
    return response({ orderId, paymentSessionId: sessionId });
  } catch {
    return response({ error: "We could not prepare checkout. Please try again." }, 500);
  }
}
