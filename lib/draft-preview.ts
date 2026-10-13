import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const PREVIEW_TOKEN_TTL_SECONDS = 60 * 60;
const PREVIEW_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const SHA_256_HEX_PATTERN = /^[a-f0-9]{64}$/;

export function createPreviewToken() {
  return randomBytes(32).toString("base64url");
}

export function hashPreviewToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isPreviewToken(value: unknown): value is string {
  return typeof value === "string" && PREVIEW_TOKEN_PATTERN.test(value);
}

export function previewTokenHashesMatch(storedHash: unknown, token: unknown) {
  if (typeof storedHash !== "string" || !SHA_256_HEX_PATTERN.test(storedHash) || !isPreviewToken(token)) return false;
  const expected = Buffer.from(storedHash, "hex");
  const candidate = Buffer.from(hashPreviewToken(token), "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

export function previewTokenExpiresAt(now = Date.now()) {
  return new Date(now + PREVIEW_TOKEN_TTL_SECONDS * 1000).toISOString();
}

export function isPreviewTokenExpired(expiresAt: unknown, now = Date.now()) {
  if (typeof expiresAt !== "string") return true;
  const timestamp = Date.parse(expiresAt);
  return Number.isNaN(timestamp) || now >= timestamp;
}

export function previewCookieName(slug: string) {
  return `amora_preview_${createHash("sha256").update(slug).digest("hex").slice(0, 24)}`;
}

// Keep payment authorization separate from the preview-page cookie. This
// allows a browser to send it only to the payment API instead of giving a
// preview credential site-wide scope.
export function paymentPreviewCookieName(slug: string) {
  return `amora_payment_preview_${createHash("sha256").update(slug).digest("hex").slice(0, 24)}`;
}

export function previewCookiePaths(slug: string) {
  return {
    preview: `/preview/${slug}`,
    payment: "/api/payments",
  };
}
