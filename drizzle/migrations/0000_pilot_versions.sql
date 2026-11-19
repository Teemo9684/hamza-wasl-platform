create table public.pilot_app_versions (
  id uuid primary key default gen_random_uuid(),
  version text unique not null,
  bundle_url text not null,
  release_notes text,
  is_mandatory boolean not null default false,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.pilot_app_versions enable row level security;
revoke all on public.pilot_app_versions from public, anon, authenticated;
grant select, insert, update, delete on public.pilot_app_versions to service_role;
