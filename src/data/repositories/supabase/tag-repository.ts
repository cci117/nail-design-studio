import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { EntityKind } from "@/types/domain";
import type { EntityTag, Tag } from "@/features/tags/tag-types";

async function client() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase 未配置");
  return supabase;
}

export const tagRepository = {
  async list() {
    const supabase = await client();
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("tag_group")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as Tag[];
  },

  async create(userId: string, tagGroup: string, name: string) {
    const supabase = await client();
    const { data, error } = await supabase
      .from("tags")
      .insert({ user_id: userId, tag_group: tagGroup, name })
      .select("*")
      .single();
    if (error) throw error;
    return data as Tag;
  },

  async rename(id: string, name: string) {
    const supabase = await client();
    const { data, error } = await supabase
      .from("tags")
      .update({ name })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as Tag;
  },

  async usageCount(id: string) {
    const supabase = await client();
    const { count, error } = await supabase
      .from("entity_tags")
      .select("id", { count: "exact", head: true })
      .eq("tag_id", id);
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async delete(id: string) {
    const supabase = await client();
    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async links(entityType: EntityKind, entityIds?: string[]) {
    if (entityIds && entityIds.length === 0) return [];
    const supabase = await client();
    let query = supabase.from("entity_tags").select("*").eq("entity_type", entityType);
    if (entityIds) query = query.in("entity_id", entityIds);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as EntityTag[];
  },

  async tagsForEntity(entityType: EntityKind, entityId: string) {
    const [tags, links] = await Promise.all([
      this.list(),
      this.links(entityType, [entityId]),
    ]);
    const selected = new Set(links.map((link) => link.tag_id));
    return tags.filter((tag) => selected.has(tag.id));
  },

  async syncEntityTags(
    userId: string,
    entityType: EntityKind,
    entityId: string,
    requestedTagIds: string[],
  ) {
    const supabase = await client();
    const uniqueIds = [...new Set(requestedTagIds)];
    let allowedIds: string[] = [];
    if (uniqueIds.length) {
      const { data, error } = await supabase.from("tags").select("id").in("id", uniqueIds);
      if (error) throw new Error(error.message);
      allowedIds = (data ?? []).map((tag) => tag.id);
      if (allowedIds.length !== uniqueIds.length) throw new Error("包含无效标签，请刷新后重试。");
    }

    const { error: deleteError } = await supabase
      .from("entity_tags")
      .delete()
      .eq("user_id", userId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId);
    if (deleteError) throw new Error(deleteError.message);

    if (allowedIds.length) {
      const { data: inserted, error: insertError } = await supabase.from("entity_tags").insert(
        allowedIds.map((tagId) => ({
          user_id: userId,
          tag_id: tagId,
          entity_type: entityType,
          entity_id: entityId,
        })),
      ).select("tag_id");
      if (insertError) throw new Error(insertError.message);
      if ((inserted ?? []).length !== allowedIds.length) throw new Error("标签关联未完整保存，请重试。");
    }

    const { data: saved, error: readError } = await supabase
      .from("entity_tags")
      .select("tag_id")
      .eq("user_id", userId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId);
    if (readError) throw new Error(readError.message);
    const savedIds = new Set((saved ?? []).map((link) => link.tag_id));
    if (savedIds.size !== allowedIds.length || allowedIds.some((id) => !savedIds.has(id))) {
      throw new Error("标签关联保存后校验失败，请重试。");
    }
  },
};
