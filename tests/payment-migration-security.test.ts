import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/202610130002_add_payments.sql", import.meta.url), "utf8");

test("payment settlement migration limits publication to an exact verified payment and locks rows", () => {
  assert.match(migration, /p_invitation_id bigint/);
  assert.match(migration, /p_amount numeric/);
  assert.match(migration, /p_currency char\(3\)/);
  assert.match(migration, /p_provider_order_status <> 'PAID'/);
  assert.match(migration, /p_invitation_id is null/);
  assert.match(migration, /p_amount is null/);
  assert.match(migration, /p_currency <> 'INR'/);
  assert.match(migration, /payment_record\.invitation_id <> p_invitation_id/);
  assert.match(migration, /payment_record\.amount <> p_amount/);
  assert.match(migration, /payment_record\.currency <> p_currency/);
  assert.match(migration, /from public\.payments[\s\S]*?for update/);
  assert.match(migration, /from public\.invitations[\s\S]*?for update/);
  assert.match(migration, /payment_record\.status not in \('created', 'pending'\)/);
});

test("payment settlement migration has a pinned search path and no PUBLIC execution or table access", () => {
  assert.match(migration, /security definer\s+set search_path = pg_catalog, public/);
  assert.match(migration, /revoke all on table public\.payments from public, anon, authenticated/);
  assert.match(migration, /revoke all on function public\.mark_invitation_payment_paid\(text, bigint, numeric, char\(3\), text, text, jsonb\) from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.mark_invitation_payment_paid\(text, bigint, numeric, char\(3\), text, text, jsonb\) to service_role/);
});
