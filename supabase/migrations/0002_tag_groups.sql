-- V0.2-1.1: user-owned tag groups for reusable many-to-many labels.
-- Existing tags are preserved and assigned to the "other" group.

alter table public.tags
  add column if not exists tag_group text not null default 'other';

alter table public.tags
  drop constraint if exists tags_user_id_name_key;

alter table public.tags
  add constraint tags_user_id_tag_group_name_key
  unique (user_id, tag_group, name);

create index if not exists tags_user_id_tag_group_idx
  on public.tags (user_id, tag_group, name);

-- The grants from 0001 apply to the table after adding this column. This
-- explicit grant keeps fresh and incrementally migrated projects equivalent.
grant select, insert, update, delete on table public.tags, public.entity_tags
  to authenticated;
