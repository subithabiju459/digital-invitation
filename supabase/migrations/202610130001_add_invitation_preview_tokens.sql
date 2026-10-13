-- Required before deploying the private draft-preview flow.
-- These columns remain nullable so legacy invitations can remain in the database.
alter table public.invitations
  add column preview_token_hash text,
  add column preview_token_expires_at timestamptz;

alter table public.invitations
  add constraint invitations_preview_token_hash_sha256_check
  check (preview_token_hash is null or preview_token_hash ~ '^[a-f0-9]{64}$');

create unique index invitations_preview_token_hash_unique
  on public.invitations (preview_token_hash)
  where preview_token_hash is not null;
