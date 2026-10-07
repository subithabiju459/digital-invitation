import { notFound } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import VelvetVowsInvitation, {
  type VelvetVowsDetails,
  type VelvetVowsPhotos,
} from "@/app/templates/velvet-vows/page";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("slug, bride_name, groom_name, wedding_date, wedding_time, venue_name, venue_address, maps_url, welcome_message, story, rsvp_phone, cover_photo_url, bride_photo_url, groom_photo_url, gallery_urls, template_id, status")
    .eq("slug", slug)
    .eq("template_id", "velvet-vows")
    .single();

  if (error || !data) notFound();

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

  return <VelvetVowsInvitation invitation={{ details, photos }} />;
}
