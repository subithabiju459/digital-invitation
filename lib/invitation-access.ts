// Node's native TypeScript test runner requires explicit local extensions.
// @ts-expect-error TypeScript's project build intentionally does not enable this import style.
import { isInvitationExpired } from "./invitation-expiry.ts";
// @ts-expect-error TypeScript's project build intentionally does not enable this import style.
import { isPreviewTokenExpired, previewTokenHashesMatch } from "./draft-preview.ts";

export type InvitationAccess = "available" | "expired" | "unavailable";

type InvitationAccessData = {
  status: unknown;
  weddingDate: string;
  weddingTime: string;
};

type DraftPreviewAccessData = InvitationAccessData & {
  previewTokenHash: unknown;
  previewTokenExpiresAt: unknown;
};

export function publicInvitationAccess({ status, weddingDate, weddingTime }: InvitationAccessData, now = Date.now()): InvitationAccess {
  if (status !== "published") return "unavailable";
  return isInvitationExpired(weddingDate, weddingTime, now) ? "expired" : "available";
}

export function draftPreviewAccess(
  { status, weddingDate, weddingTime, previewTokenHash, previewTokenExpiresAt }: DraftPreviewAccessData,
  token: unknown,
  now = Date.now(),
): InvitationAccess {
  if (status !== "draft" || isPreviewTokenExpired(previewTokenExpiresAt, now)) return "unavailable";
  if (!previewTokenHashesMatch(previewTokenHash, token)) return "unavailable";
  return isInvitationExpired(weddingDate, weddingTime, now) ? "expired" : "available";
}
