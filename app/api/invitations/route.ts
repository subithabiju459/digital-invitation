import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

const BUCKET = "invitation-images";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 25 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_TOTAL_BYTES + 512 * 1024;
const MAX_GALLERY_FILES = 8;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const requestLog = new Map<string, number[]>();

type FormFields = {
  bride: string;
  groom: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  maps: string;
  welcome: string;
  story: string;
  rsvp: string;
};

const text = (value: FormDataEntryValue | null, maxLength: number) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const slugPart = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const makeSlug = (bride: string, groom: string) =>
  `${slugPart(bride)}-${slugPart(groom)}-${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;

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

function validateFiles(files: File[]) {
  if (files.length > MAX_GALLERY_FILES + 3) return "Too many images were submitted.";
  if (files.some((file) => !allowedTypes.has(file.type))) return "Images must be JPG, PNG, or WebP files.";
  if (files.some((file) => file.size > MAX_FILE_BYTES)) return "Each image must be 5 MB or smaller.";
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_BYTES) return "Total image size must be 25 MB or smaller.";
  return "";
}

export async function POST(request: Request) {
  if (tooManyRequests(request)) return NextResponse.json({ error: "Too many save attempts. Please try again in a few minutes." }, { status: 429 });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) return NextResponse.json({ error: "This upload is too large. Please keep total image size under 25 MB." }, { status: 413 });

  try {
    const formData = await request.formData();
    const fields: FormFields = { bride: text(formData.get("bride"), 80), groom: text(formData.get("groom"), 80), date: text(formData.get("date"), 10), time: text(formData.get("time"), 10), venue: text(formData.get("venue"), 160), address: text(formData.get("address"), 500), maps: text(formData.get("maps"), 2048), welcome: text(formData.get("welcome"), 240), story: text(formData.get("story"), 2000), rsvp: text(formData.get("rsvp"), 80) };
    const missing = [["Bride name", fields.bride], ["Groom name", fields.groom], ["Wedding date", fields.date], ["Wedding time", fields.time], ["Venue name", fields.venue], ["Venue address", fields.address], ["RSVP phone", fields.rsvp]].filter(([, value]) => !value).map(([label]) => label);
    if (missing.length) return NextResponse.json({ error: `Please complete: ${missing.join(", ")}.` }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.date) || !/^\d{2}:\d{2}$/.test(fields.time)) return NextResponse.json({ error: "Please provide a valid wedding date and time." }, { status: 400 });
    if (fields.maps) { try { new URL(fields.maps); } catch { return NextResponse.json({ error: "Please provide a valid Google Maps link." }, { status: 400 }); } }

    const cover = formData.get("cover");
    const bride = formData.get("bridePhoto");
    const groom = formData.get("groomPhoto");
    const gallery = formData.getAll("gallery");
    const coverFile = cover instanceof File && cover.size > 0 ? cover : null;
    const brideFile = bride instanceof File && bride.size > 0 ? bride : null;
    const groomFile = groom instanceof File && groom.size > 0 ? groom : null;
    const singleFiles = [coverFile, brideFile, groomFile].filter((entry): entry is File => entry !== null);
    const galleryFiles = gallery.filter((entry): entry is File => entry instanceof File && entry.size > 0);
    if (galleryFiles.length > MAX_GALLERY_FILES) return NextResponse.json({ error: "You can upload up to eight gallery images." }, { status: 400 });
    const imageError = validateFiles([...singleFiles, ...galleryFiles]);
    if (imageError) return NextResponse.json({ error: imageError }, { status: 400 });

    const slug = makeSlug(fields.bride, fields.groom);
    const supabase = createAdminClient();
    const uploadedPaths: string[] = [];
    const upload = async (file: File | null, kind: string) => {
      if (!file) return "";
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${slug}/${kind}-${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (error) {
        const message = error.message.toLowerCase().includes("bucket not found")
          ? "Image storage is not configured yet. Please contact the site owner."
          : "We could not upload one of your images. Please try again.";
        throw new Error(message);
      }
      uploadedPaths.push(path);
      return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    };

    try {
      const coverUrl = await upload(coverFile, "cover");
      const brideUrl = await upload(brideFile, "bride");
      const groomUrl = await upload(groomFile, "groom");
      const galleryUrls: string[] = [];
      for (const [index, file] of galleryFiles.entries()) {
        galleryUrls.push(await upload(file, `gallery-${index + 1}`));
      }
      const { error } = await supabase.from("invitations").insert({ slug, bride_name: fields.bride, groom_name: fields.groom, wedding_date: fields.date, wedding_time: fields.time, venue_name: fields.venue, venue_address: fields.address, maps_url: fields.maps, welcome_message: fields.welcome, story: fields.story, rsvp_phone: fields.rsvp, cover_photo_url: coverUrl || null, bride_photo_url: brideUrl || null, groom_photo_url: groomUrl || null, gallery_urls: galleryUrls, template_id: "velvet-vows", status: "draft" });
      if (error) throw new Error("We could not save your invitation. Please try again.");
    } catch (error) {
      if (uploadedPaths.length) await supabase.storage.from(BUCKET).remove(uploadedPaths);
      throw error;
    }
    return NextResponse.json({ slug }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "We could not save your invitation. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
