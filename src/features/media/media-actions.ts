"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { libraryRepository } from "@/data/repositories/supabase/library-repository";
import { mediaRepository } from "@/data/repositories/supabase/media-repository";
import { getLibraryDefinition, type LibraryKind } from "@/features/library/library-config";
import { MAX_MEDIA_PER_ENTITY, type NewMediaMetadata } from "./media-types";
import type { EntityKind } from "@/types/domain";

const supportedEntities: Record<string, LibraryKind> = {
  inspiration: "inspiration",
  favorite_asset: "favorite-assets",
  asset: "assets",
  work: "works",
};

async function context(entityTypeValue: string, entityId: string) {
  const kind = supportedEntities[entityTypeValue];
  if (!kind || !/^[0-9a-f-]{36}$/i.test(entityId)) throw new Error("无效的图片归属。");
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase 未配置。");
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("登录已失效，请重新登录。");
  const definition = getLibraryDefinition(kind);
  const entity = await libraryRepository.getById(definition.table, entityId);
  if (!entity) throw new Error("资料不存在或无权访问。");
  return { user, definition, entityType: entityTypeValue as EntityKind };
}

function safeError(error: unknown, fallback: string) {
  return { error: error instanceof Error ? error.message : fallback };
}

function validateMetadata(metadata: NewMediaMetadata, userId: string, entityType: string, entityId: string) {
  const prefix = `${userId}/${entityType}/${entityId}/`;
  if (!metadata.storagePath.startsWith(prefix)) throw new Error("Storage 路径无效。");
  if (!/^image\/(jpeg|png|webp)$/.test(metadata.mimeType)) throw new Error("不支持的图片格式。");
  if (!Number.isInteger(metadata.width) || !Number.isInteger(metadata.height) || metadata.width < 1 || metadata.height < 1) throw new Error("图片尺寸无效。");
  if (!Number.isInteger(metadata.fileSize) || metadata.fileSize < 1 || metadata.fileSize > 15 * 1024 * 1024) throw new Error("图片文件大小无效。");
}

function refresh(path: string, id: string) {
  revalidatePath(path);
  revalidatePath(`${path}/${id}`);
  revalidatePath(`${path}/${id}/edit`);
}

export async function createMediaRecordAction(entityTypeValue: string, entityId: string, metadata: NewMediaMetadata) {
  try {
    const { user, definition, entityType } = await context(entityTypeValue, entityId);
    validateMetadata(metadata, user.id, entityTypeValue, entityId);
    const count = await mediaRepository.count(entityType, entityId);
    if (count >= MAX_MEDIA_PER_ENTITY) throw new Error(`每条资料最多 ${MAX_MEDIA_PER_ENTITY} 张图片。`);
    const record = await mediaRepository.create(user.id, entityType, entityId, metadata, count === 0 ? "cover" : "attachment", count);
    refresh(definition.path, entityId);
    return { error: null, id: record.id };
  } catch (error) {
    return safeError(error, "图片资料保存失败。");
  }
}

export async function setCoverAction(entityTypeValue: string, entityId: string, mediaId: string) {
  try {
    const { definition, entityType } = await context(entityTypeValue, entityId);
    const item = await mediaRepository.get(mediaId);
    if (!item || item.entity_type !== entityType || item.entity_id !== entityId) throw new Error("图片不存在或无权访问。");
    await mediaRepository.updateRoles(entityType, entityId, mediaId);
    refresh(definition.path, entityId);
    return { error: null };
  } catch (error) { return safeError(error, "封面设置失败。"); }
}

export async function reorderMediaAction(entityTypeValue: string, entityId: string, ids: string[]) {
  try {
    const { definition, entityType } = await context(entityTypeValue, entityId);
    const current = await mediaRepository.list(entityType, entityId);
    const currentIds = new Set(current.map((item) => item.id));
    if (ids.length !== currentIds.size || ids.some((id) => !currentIds.has(id))) throw new Error("图片顺序无效，请刷新后重试。");
    await mediaRepository.reorder(entityType, entityId, ids);
    refresh(definition.path, entityId);
    return { error: null };
  } catch (error) { return safeError(error, "排序保存失败。"); }
}

export async function deleteMediaAction(entityTypeValue: string, entityId: string, mediaId: string) {
  try {
    const { definition, entityType } = await context(entityTypeValue, entityId);
    const item = await mediaRepository.get(mediaId);
    if (!item || item.entity_type !== entityType || item.entity_id !== entityId) throw new Error("图片不存在或无权访问。");
    await mediaRepository.deleteStorage(item.storage_path);
    await mediaRepository.removeRecord(mediaId);
    const remaining = await mediaRepository.list(entityType, entityId);
    if (remaining.length) {
      await mediaRepository.reorder(entityType, entityId, remaining.map((media) => media.id));
      if (item.role === "cover") await mediaRepository.updateRoles(entityType, entityId, remaining[0].id);
    }
    refresh(definition.path, entityId);
    return { error: null };
  } catch (error) { return safeError(error, "图片删除失败。"); }
}
