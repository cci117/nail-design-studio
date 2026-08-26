-- V0.2-2.1: explicit draft lifecycle for image-first library creation.
-- Existing records remain active. Draft records may temporarily omit fields
-- that are required before completion.

begin;

do $$
begin
  create type public.library_item_status as enum ('draft', 'active');
exception
  when duplicate_object then null;
end
$$;

alter table public.inspirations
  add column if not exists status public.library_item_status
  not null default 'active';

alter table public.favorite_assets
  add column if not exists status public.library_item_status
  not null default 'active';

alter table public.assets
  add column if not exists status public.library_item_status
  not null default 'active';

alter table public.works
  add column if not exists status public.library_item_status
  not null default 'active';

-- Draft records may be created before users provide textual metadata.
alter table public.inspirations
  alter column title drop not null;

alter table public.favorite_assets
  alter column name drop not null;

alter table public.assets
  alter column name drop not null,
  alter column category drop not null;

alter table public.works
  alter column title drop not null;

-- Active records must still contain the fields required by the existing
-- product rules. Draft records are the only exception.
alter table public.inspirations
  drop constraint if exists inspirations_active_title_required;

alter table public.inspirations
  add constraint inspirations_active_title_required
  check (status = 'draft' or title is not null)
  not valid;

alter table public.inspirations
  validate constraint inspirations_active_title_required;

alter table public.favorite_assets
  drop constraint if exists favorite_assets_active_name_required;

alter table public.favorite_assets
  add constraint favorite_assets_active_name_required
  check (status = 'draft' or name is not null)
  not valid;

alter table public.favorite_assets
  validate constraint favorite_assets_active_name_required;

alter table public.assets
  drop constraint if exists assets_active_fields_required;

alter table public.assets
  add constraint assets_active_fields_required
  check (
    status = 'draft'
    or (name is not null and category is not null)
  )
  not valid;

alter table public.assets
  validate constraint assets_active_fields_required;

alter table public.works
  drop constraint if exists works_active_title_required;

alter table public.works
  add constraint works_active_title_required
  check (status = 'draft' or title is not null)
  not valid;

alter table public.works
  validate constraint works_active_title_required;

create index if not exists inspirations_user_status_updated_idx
  on public.inspirations (user_id, status, updated_at desc);

create index if not exists favorite_assets_user_status_updated_idx
  on public.favorite_assets (user_id, status, updated_at desc);

create index if not exists assets_user_status_updated_idx
  on public.assets (user_id, status, updated_at desc);

create index if not exists works_user_status_updated_idx
  on public.works (user_id, status, updated_at desc);

-- Existing table grants continue to cover newly added columns.
-- The enum itself requires usage permission for authenticated Data API calls.
grant usage on type public.library_item_status to authenticated;

commit;
