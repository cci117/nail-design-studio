-- Nail Design Studio V0.1
create extension if not exists pgcrypto;

create type public.design_status as enum ('draft', 'active', 'completed', 'archived');
create type public.design_version_type as enum ('concept', 'ten_finger_plan', 'final_render', 'revision');
create type public.entity_kind as enum ('inspiration', 'favorite_asset', 'asset', 'work', 'design', 'design_version');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inspirations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, notes text, source_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, version integer not null default 1
);
create table public.favorite_assets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, category text, notes text, source_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, version integer not null default 1
);
create table public.assets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, category text not null, brand text, color text, quantity numeric check (quantity is null or quantity >= 0), unit text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, version integer not null default 1
);
create table public.works (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, notes text, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, version integer not null default 1
);
create table public.designs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, status public.design_status not null default 'draft', notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, version integer not null default 1
);
create table public.design_versions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  design_id uuid not null references public.designs(id) on delete cascade,
  version_number integer not null check (version_number > 0), version_type public.design_version_type not null,
  description text, structured_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, version integer not null default 1,
  unique (design_id, version_number)
);
create table public.tags (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, color text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, name)
);
create table public.entity_tags (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade, entity_type public.entity_kind not null, entity_id uuid not null,
  created_at timestamptz not null default now(), unique (tag_id, entity_type, entity_id)
);
create table public.media (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  storage_bucket text not null default 'user-media', storage_path text not null, media_type text not null, mime_type text not null,
  width integer, height integer, file_size bigint, alt_text text, checksum text,
  entity_type public.entity_kind, entity_id uuid, role text, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique (storage_bucket, storage_path)
);

create index on public.inspirations (user_id, updated_at desc);
create index on public.favorite_assets (user_id, updated_at desc);
create index on public.assets (user_id, updated_at desc);
create index on public.works (user_id, updated_at desc);
create index on public.designs (user_id, updated_at desc);
create index on public.design_versions (design_id, version_number desc);
create index on public.entity_tags (user_id, entity_type, entity_id);
create index on public.media (user_id, entity_type, entity_id);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
do $$ declare table_name text; begin
  foreach table_name in array array['profiles','inspirations','favorite_assets','assets','works','designs','design_versions','tags','media'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
  end loop;
end $$;

create or replace function public.create_profile_for_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles (user_id) values (new.id) on conflict do nothing; return new; end; $$;
create trigger create_profile_after_signup after insert on auth.users for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.inspirations enable row level security;
alter table public.favorite_assets enable row level security;
alter table public.assets enable row level security;
alter table public.works enable row level security;
alter table public.designs enable row level security;
alter table public.design_versions enable row level security;
alter table public.tags enable row level security;
alter table public.entity_tags enable row level security;
alter table public.media enable row level security;

do $$ declare table_name text; begin
  foreach table_name in array array['profiles','inspirations','favorite_assets','assets','works','designs','design_versions','tags','entity_tags','media'] loop
    execute format('create policy "own rows select" on public.%I for select using (user_id = (select auth.uid()))', table_name);
    execute format('create policy "own rows insert" on public.%I for insert with check (user_id = (select auth.uid()))', table_name);
    execute format('create policy "own rows update" on public.%I for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', table_name);
    execute format('create policy "own rows delete" on public.%I for delete using (user_id = (select auth.uid()))', table_name);
  end loop;
end $$;

-- Simple ownership checks for polymorphic links are intentionally deferred until CRUD is implemented.
-- RLS still prevents cross-account reads and writes through user_id.

insert into storage.buckets (id, name, public) values ('user-media', 'user-media', false) on conflict (id) do nothing;
create policy "user media read" on storage.objects for select to authenticated using (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "user media insert" on storage.objects for insert to authenticated with check (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "user media update" on storage.objects for update to authenticated using (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid()::text)) with check (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "user media delete" on storage.objects for delete to authenticated using (bucket_id = 'user-media' and (storage.foldername(name))[1] = (select auth.uid()::text));
