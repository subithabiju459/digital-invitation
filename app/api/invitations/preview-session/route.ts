import { NextResponse } from "next/server";
import { draftPreviewAccess } from "@/lib/invitation-access";
import {
  paymentPreviewCookieName,
  PREVIEW_TOKEN_TTL_SECONDS,
  previewCookieName,
  previewCookiePaths,
} from "@/lib/draft-preview";
import { createAdminClient } from "@/utils/supabase/admin";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const requestLog = new Map<string, number[]>();

function tooManyRequests(request: Request) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const recent = (requestLog.get(key) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) return true;
  recent.push(now);
  requestLog.set(key, recent);
  if (requestLog.size > 5000) requestLog.clear();
  return false;
}

function privateJson(body: Record<string, string>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, private, max-age=0",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

export async function POST(request: Request) {
  if (tooManyRequests(request)) return privateJson({ error: "Too many preview attempts. Please try again later." }, 429);

  try {
    const body = await request.json() as { slug?: unknown; token?: unknown };
    if (typeof body.slug !== "string" || typeof body.token !== "string") {
      return privateJson({ error: "This preview link is unavailable." }, 401);
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("invitations")
      .select("slug, status, wedding_date, wedding_time, preview_token_hash, preview_token_expires_at, template_id")
      .eq("slug", body.slug)
      .eq("template_id", "velvet-vows")
      .maybeSingle();

    if (error) return privateJson({ error: "We could not open this preview. Please try again." }, 500);
    if (!data) return privateJson({ error: "This preview link is unavailable." }, 401);

    const access = draftPreviewAccess({
      status: data.status,
      weddingDate: data.wedding_date,
      weddingTime: data.wedding_time,
      previewTokenHash: data.preview_token_hash,
      previewTokenExpiresAt: data.preview_token_expires_at,
    }, body.token);
    if (access === "expired") return privateJson({ error: "This invitation is no longer available." }, 410);
    if (access !== "available") return privateJson({ error: "This preview link is unavailable." }, 401);

    const response = privateJson({ previewPath: `/preview/${data.slug}` });
    const paths = previewCookiePaths(data.slug);
    response.cookies.set(previewCookieName(data.slug), body.token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: paths.preview,
      maxAge: PREVIEW_TOKEN_TTL_SECONDS,
    });
    response.cookies.set(paymentPreviewCookieName(data.slug), body.token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: paths.payment,
      maxAge: PREVIEW_TOKEN_TTL_SECONDS,
    });
    return response;
  } catch {
    return privateJson({ error: "We could not open this preview. Please try again." }, 400);
  }
}
