import assert from "node:assert/strict";
import test from "node:test";
// Node's native TypeScript test runner requires an explicit extension at runtime.
// @ts-expect-error TypeScript's project build intentionally does not enable this import style.
import { invitationExpiryAt, isInvitationExpired } from "../lib/invitation-expiry.ts";

const expiry = invitationExpiryAt("2026-10-13", "17:30");

test("an invitation is available immediately before its 30-day expiry", () => {
  assert.notEqual(expiry, null);
  assert.equal(isInvitationExpired("2026-10-13", "17:30", expiry! - 1), false);
});

test("an invitation expires at the exact 30-day event-time boundary", () => {
  assert.notEqual(expiry, null);
  assert.equal(isInvitationExpired("2026-10-13", "17:30", expiry!), true);
});

test("an invitation remains unavailable after its expiry", () => {
  assert.notEqual(expiry, null);
  assert.equal(isInvitationExpired("2026-10-13", "17:30", expiry! + 1), true);
});

test("a PostgreSQL-normalized HH:mm:ss wedding time keeps a future invitation available", () => {
  const storedTime = "17:30:00";
  const futureExpiry = invitationExpiryAt("2027-01-16", storedTime);
  assert.notEqual(futureExpiry, null);
  assert.equal(isInvitationExpired("2027-01-16", storedTime, Date.UTC(2026, 9, 13, 12, 0, 0)), false);
});
