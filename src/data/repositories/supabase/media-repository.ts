import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { EntityKind, WorkMediaKind } from "@/types/domain";
import { SIGNED_URL_TTL_SECONDS, type MediaItem, type NewMediaMetadata } from "@/features/media/media-types";

async function client() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase 未配置");
  return supabase;
}

async function signed(items: MediaItem[]) {
  const supabase = await client();
  return Promise.all(items.map(async (item) => {
    const { data, error } = await supabase.storage.from(item.storage_bucket).createSignedUrl(item.storage_path, SIGNED_URL_TTL_SECONDS);
    if (error) return item;
    return { ...item, signedUrl: data.signedUrl };
  }));
}

export const mediaRepository = {
  async list(entityType: EntityKind, entityId: string) {
    const supabase = await client();
    const { data, error } = await supabase.from("media").select("*").eq("entity_type", entityType).eq("entity_id", entityId).is("deleted_at", null).order("sort_order").order("created_at");
    if (error) throw new Error(error.message);
    return signed((data ?? []) as MediaItem[]);
  },

  async covers(entityType: EntityKind, entityIds: string[]) {
    if (!entityIds.length) return new Map<string, string>();
    const supabase = await client();
    const { data, error } = await supabase.from("media").select("*").eq("entity_type", entityType).eq("role", "cover").in("entity_id", entityIds).is("deleted_at", null);
    if (error) throw new Error(error.message);
    const items = await signed((data ?? []) as MediaItem[]);
    return new Map(items.filter((item) => item.entity_id && item.signedUrl).map((item) => [item.entity_id!, item.signedUrl!]));
  },

  async count(entityType: EntityKind, entityId: string) {
    const supabase = await client();
    const { count, error } = await supabase.from("media").select("id", { count: "exact", head: true }).eq("entity_type", entityType).eq("entity_id", entityId).is("deleted_at", null);
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async create(userId: string, entityType: EntityKind, entityId: string, metadata: NewMediaMetadata, role: "cover" | "attachment", sortOrder: number) {
    const supabase = await client();
    const { data, error } = await supabase.from("media").insert({ user_id: userId, storage_bucket: "user-media", storage_path: metadata.storagePath, media_type: "image", mime_type: metadata.mimeType, width: metadata.width, height: metadata.height, file_size: metadata.fileSize, entity_type: entityType, entity_id: entityId, role, sort_order: sortOrder, work_media_kind: entityType === "work" ? "press_on" : null }).select("*").single();
    if (error) throw new Error(error.message);
    return data as MediaItem;
  },

  async get(id: string) {
    const supabase = await client();
    const { data, error } = await supabase.from("media").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data as MediaItem | null;
  },

  async removeRecord(id: string) {
    const supabase = await client();
    const { error } = await supabase.from("media").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async updateRoles(entityType: EntityKind, entityId: string, coverId: string) {
    const supabase = await client();
    const { error: resetError } = await supabase.from("media").update({ role: "attachment" }).eq("entity_type", entityType).eq("entity_id", entityId).is("deleted_at", null);
    if (resetError) throw new Error(resetError.message);
    const { error } = await supabase.from("media").update({ role: "cover" }).eq("id", coverId).eq("entity_type", entityType).eq("entity_id", entityId);
    if (error) throw new Error(error.message);
  },

  async reorder(entityType: EntityKind, entityId: string, ids: string[]) {
    const supabase = await client();
    for (const [sortOrder, id] of ids.entries()) {
      const { error } = await supabase.from("media").update({ sort_order: sortOrder }).eq("id", id).eq("entity_type", entityType).eq("entity_id", entityId);
      if (error) throw new Error(error.message);
    }
  },

  async updateWorkKind(id: string, entityId: string, kind: WorkMediaKind) {
    const supabase = await client();
    const { error } = await supabase.from("media").update({ work_media_kind: kind }).eq("id", id).eq("entity_type", "work").eq("entity_id", entityId);
    if (error) throw new Error(error.message);
  },

  async deleteStorage(path: string) {
    const supabase = await client();
    const { error } = await supabase.storage.from("user-media").remove([path]);
    if (error) throw new Error(error.message);
  },
};
