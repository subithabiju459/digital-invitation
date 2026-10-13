import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { draftPreviewAccess } from "@/lib/invitation-access";
import { previewCookieName } from "@/lib/draft-preview";
import { createAdminClient } from "@/utils/supabase/admin";
import VelvetVowsInvitation, {
  type VelvetVowsDetails,
  type VelvetVowsPhotos,
} from "@/app/templates/velvet-vows/page";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default async function DraftPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const token = (await cookies()).get(previewCookieName(slug))?.value;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("slug, bride_name, groom_name, wedding_date, wedding_time, venue_name, venue_address, maps_url, welcome_message, story, rsvp_phone, cover_photo_url, bride_photo_url, groom_photo_url, gallery_urls, template_id, status, preview_token_hash, preview_token_expires_at")
    .eq("slug", slug)
    .eq("template_id", "velvet-vows")
    .maybeSingle();

  if (error || !data) notFound();
  const access = draftPreviewAccess({
    status: data.status,
    weddingDate: data.wedding_date,
    weddingTime: data.wedding_time,
    previewTokenHash: data.preview_token_hash,
    previewTokenExpiresAt: data.preview_token_expires_at,
  }, token);
  if (access === "expired") return <ExpiredPreview />;
  if (access !== "available") notFound();

  const gallery = Array.isArray(data.gallery_urls)
    ? data.gallery_urls.filter((url): url is string => typeof url === "string")
    : [];
  const details: VelvetVowsDetails = {
    bride: data.bride_name,
    groom: data.groom_name,
    date: data.wedding_date,
    time: data.wedding_time,
    venue: data.venue_name,
    address: data.venue_address,
    maps: data.maps_url,
    welcome: data.welcome_message,
    story: data.story,
    rsvp: data.rsvp_phone,
  };
  const photos: VelvetVowsPhotos = {
    cover: data.cover_photo_url ?? "",
    bride: data.bride_photo_url ?? "",
    groom: data.groom_photo_url ?? "",
    gallery,
  };

  return <VelvetVowsInvitation invitation={{ details, photos }} privatePreview />;
}

function ExpiredPreview() {
  return <main className="invite-expired">
    <div className="invite-expired-card">
      <span aria-hidden="true">✦</span>
      <p>This invitation is no longer available</p>
      <small>Its sharing period has ended.</small>
      <a href="/">Return to AMORA</a>
    </div>
  </main>;
}
