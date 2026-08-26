"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { libraryRepository } from "@/data/repositories/supabase/library-repository";
import { tagRepository } from "@/data/repositories/supabase/tag-repository";
import { getLibraryDefinition, isLibraryKind, type FieldName, type LibraryKind } from "./library-config";
import type { FormState } from "./library-form-state";

function value(formData: FormData, name: FieldName, required = false) {
  const entry = formData.get(name);
  const text = typeof entry === "string" ? entry.trim() : "";
  if (required && !text) throw new Error("请填写必填项。");
  if (text.length > (name === "notes" ? 4000 : 200)) throw new Error("输入内容过长。");
  return text || null;
}

function parseValues(kind: LibraryKind, formData: FormData) {
  const definition = getLibraryDefinition(kind);
  const values: Record<string, string | number | null> = {};
  for (const field of definition.fields) {
    const parsed = value(formData, field.name, field.required);
    if (field.name === "quantity") {
      if (parsed === null) values.quantity = null;
      else {
        const quantity = Number(parsed);
        if (!Number.isFinite(quantity) || quantity < 0) throw new Error("数量必须是不小于 0 的数字。");
        values.quantity = quantity;
      }
    } else if (field.name === "completed_at") values.completed_at = parsed;
    else values[field.name] = parsed;
  }
  return values;
}

async function authenticatedUserId() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase 未配置。");
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("登录已失效，请重新登录。");
  return user.id;
}

function selectedTagIds(formData: FormData) {
  return [...new Set(formData.getAll("tag_ids").filter((value): value is string => typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value)))];
}

export async function createLibraryItem(kindValue: string, _state: FormState, formData: FormData): Promise<FormState> {
  if (!isLibraryKind(kindValue)) return { error: "无效的资料库。" };
  const definition = getLibraryDefinition(kindValue);
  let recordId: string;
  try {
    const userId = await authenticatedUserId();
    const record = await libraryRepository.create(definition.table, userId, parseValues(kindValue, formData));
    recordId = record.id;
    if (kindValue === "inspiration" || kindValue === "works") {
      await tagRepository.syncEntityTags(userId, definition.entityType, recordId, selectedTagIds(formData));
    }
  } catch (error) { return { error: error instanceof Error ? error.message : "新增失败，请重试。" }; }
  revalidatePath(definition.path);
  redirect(`${definition.path}/${recordId}`);
}

export async function updateLibraryItem(kindValue: string, id: string, _state: FormState, formData: FormData): Promise<FormState> {
  if (!isLibraryKind(kindValue)) return { error: "无效的资料库。" };
  const definition = getLibraryDefinition(kindValue);
  try {
    const userId = await authenticatedUserId();
    await libraryRepository.update(definition.table, id, parseValues(kindValue, formData));
    if (kindValue === "inspiration" || kindValue === "works") {
      await tagRepository.syncEntityTags(userId, definition.entityType, id, selectedTagIds(formData));
    }
  } catch (error) { return { error: error instanceof Error ? error.message : "保存失败，请重试。" }; }
  revalidatePath(definition.path);
  revalidatePath(`${definition.path}/${id}`);
  redirect(`${definition.path}/${id}`);
}

export async function deleteLibraryItem(kindValue: string, id: string) {
  if (!isLibraryKind(kindValue)) return { error: "无效的资料库。" };
  const definition = getLibraryDefinition(kindValue);
  try {
    await authenticatedUserId();
    await libraryRepository.softDelete(definition.table, id);
  } catch (error) { return { error: error instanceof Error ? error.message : "删除失败，请重试。" }; }
  revalidatePath(definition.path);
  redirect(definition.path);
}
