import assert from "node:assert/strict";
import test from "node:test";
// Node's native TypeScript test runner requires an explicit extension at runtime.
// @ts-expect-error TypeScript's project build intentionally does not enable this import style.
import { draftPreviewAccess, publicInvitationAccess } from "../lib/invitation-access.ts";
// @ts-expect-error Node's native TypeScript test runner requires an explicit extension at runtime.
import { createPreviewToken, hashPreviewToken, paymentPreviewCookieName, previewCookieName, previewCookiePaths, previewTokenExpiresAt } from "../lib/draft-preview.ts";

const futureDate = "2027-01-16";
const futureTime = "17:30";
const now = Date.UTC(2026, 9, 13, 12, 0, 0);
const token = createPreviewToken();
const previewData = {
  status: "draft",
  weddingDate: futureDate,
  weddingTime: futureTime,
  previewTokenHash: hashPreviewToken(token),
  previewTokenExpiresAt: previewTokenExpiresAt(now),
};

test("a draft invitation is unavailable from the public invitation route", () => {
  assert.equal(publicInvitationAccess({ status: "draft", weddingDate: futureDate, weddingTime: futureTime }, now), "unavailable");
});

test("a valid preview token authorizes its matching draft", () => {
  assert.equal(draftPreviewAccess(previewData, token, now), "available");
});

test("a valid preview token remains authorized when Supabase returns wedding_time with seconds", () => {
  assert.equal(draftPreviewAccess({ ...previewData, weddingTime: "17:30:00" }, token, now), "available");
});

test("an invalid preview token cannot authorize a draft", () => {
  assert.equal(draftPreviewAccess(previewData, createPreviewToken(), now), "unavailable");
});

test("payment authorization uses a separate cookie scoped to the payment API", () => {
  const slug = "rhea-arjun-velvet-vows";
  const paths = previewCookiePaths(slug);
  assert.equal(paths.preview, `/preview/${slug}`);
  assert.equal(paths.payment, "/api/payments");
  assert.notEqual(paymentPreviewCookieName(slug), previewCookieName(slug));
});

test("a published invitation is available from its public route before expiry", () => {
  assert.equal(publicInvitationAccess({ status: "published", weddingDate: futureDate, weddingTime: futureTime }, now), "available");
});

test("a published invitation is expired at the existing 30-day boundary", () => {
  const eventDate = "2026-10-13";
  const expiry = Date.UTC(2026, 10, 12, 12, 0, 0);
  assert.equal(publicInvitationAccess({ status: "published", weddingDate: eventDate, weddingTime: "17:30" }, expiry), "expired");
});
