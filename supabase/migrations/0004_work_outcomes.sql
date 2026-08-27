-- V0.3.1:
-- design -> design_version -> work
-- work media classification
-- final production feedback
-- actual materials used by a work

begin;

-- ============================================================
-- 1. Structured feedback and media classification types
-- ============================================================

create type public.work_restoration_level as enum (
  'very_close',
  'adjusted',
  'major_changes'
);

create type public.work_change_reason as enum (
  'material_limit',
  'production_difficulty',
  'aesthetic_change',
  'color_adjustment',
  'composition_adjustment',
  'decoration_adjustment',
  'shape_length_adjustment',
  'other'
);

create type public.work_media_kind as enum (
  'press_on',
  'worn',
  'detail',
  'other'
);

-- ============================================================
-- 2. Extend works
-- ============================================================

alter table public.works
  add column source_design_version_id uuid,
  add column restoration_level public.work_restoration_level,
  add column change_reasons public.work_change_reason[]
    not null default '{}'::public.work_change_reason[],
  add column feedback_notes text;

-- Composite unique key used by the ownership-aware foreign key.
-- id remains the primary key; this additional constraint lets the FK verify
-- that the referenced design version belongs to the same user as the work.
alter table public.design_versions
  add constraint design_versions_id_user_id_unique
  unique (id, user_id);

alter table public.works
  add constraint works_source_design_version_owner_fk
  foreign key (source_design_version_id, user_id)
  references public.design_versions (id, user_id)
  on delete set null (source_design_version_id);

create index works_source_design_version_idx
  on public.works (source_design_version_id)
  where source_design_version_id is not null;

-- ============================================================
-- 3. Extend media with work-specific image classification
-- ============================================================

alter table public.media
  add column work_media_kind public.work_media_kind;

-- A work media classification is valid only for media attached to a work.
-- NULL remains valid for all historical rows and for non-work media.
alter table public.media
  add constraint media_work_media_kind_entity_check
  check (
    work_media_kind is null
    or entity_type = 'work'::public.entity_kind
  )
  not valid;

alter table public.media
  validate constraint media_work_media_kind_entity_check;

create index media_work_kind_sort_idx
  on public.media (
    user_id,
    entity_id,
    work_media_kind,
    sort_order
  )
  where entity_type = 'work'::public.entity_kind
    and deleted_at is null;

-- ============================================================
-- 4. Work <-> actual asset usage
-- ============================================================

-- Composite unique keys allow work_assets to enforce ownership in the
-- database rather than relying only on UI or RLS.
alter table public.works
  add constraint works_id_user_id_unique
  unique (id, user_id);

alter table public.assets
  add constraint assets_id_user_id_unique
  unique (id, user_id);

create table public.work_assets (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  work_id uuid not null,
  asset_id uuid not null,

  created_at timestamptz not null default now(),

  constraint work_assets_work_owner_fk
    foreign key (work_id, user_id)
    references public.works (id, user_id)
    on delete cascade,

  constraint work_assets_asset_owner_fk
    foreign key (asset_id, user_id)
    references public.assets (id, user_id)
    on delete cascade,

  constraint work_assets_user_work_asset_unique
    unique (user_id, work_id, asset_id)
);

create index work_assets_user_work_idx
  on public.work_assets (user_id, work_id);

create index work_assets_user_asset_idx
  on public.work_assets (user_id, asset_id);

-- ============================================================
-- 5. RLS for work_assets
-- ============================================================

alter table public.work_assets enable row level security;

create policy "own rows select"
  on public.work_assets
  for select
  using (user_id = (select auth.uid()));

create policy "own rows insert"
  on public.work_assets
  for insert
  with check (user_id = (select auth.uid()));

create policy "own rows update"
  on public.work_assets
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own rows delete"
  on public.work_assets
  for delete
  using (user_id = (select auth.uid()));

-- ============================================================
-- 6. Data API privileges
-- ============================================================

grant usage on type
  public.work_restoration_level,
  public.work_change_reason,
  public.work_media_kind
to authenticated;

grant select, insert, update, delete
  on table public.work_assets
  to authenticated;

commit;
