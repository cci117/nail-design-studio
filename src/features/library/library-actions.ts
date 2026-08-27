"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { libraryRepository } from "@/data/repositories/supabase/library-repository";
import { tagRepository } from "@/data/repositories/supabase/tag-repository";
import { getLibraryDefinition, isLibraryKind, type FieldName, type LibraryKind } from "./library-config";
import type { FormState } from "./library-form-state";
import { workOutcomeRepository } from "@/data/repositories/supabase/work-outcome-repository";
import { changeReasonValues } from "@/features/works/work-types";
import type { WorkChangeReason, WorkRestorationLevel } from "@/types/domain";

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

export async function createLibraryDraft(kindValue: string) {
  if (!isLibraryKind(kindValue)) throw new Error("无效的资料库。");
  const definition = getLibraryDefinition(kindValue);
  let recordId: string;
  try {
    const userId = await authenticatedUserId();
    const record = await libraryRepository.create(definition.table, userId, { status: "draft" });
    recordId = record.id;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "草稿创建失败，请重试。");
  }
  revalidatePath(definition.path);
  redirect(`${definition.path}/${recordId}/edit?stage=media`);
}

function selectedTagIds(formData: FormData) {
  return [...new Set(formData.getAll("tag_ids").filter((value): value is string => typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value)))];
}

function uuidValues(formData: FormData, name: string) {
  return [...new Set(formData.getAll(name).filter((entry): entry is string => typeof entry === "string" && /^[0-9a-f-]{36}$/i.test(entry)))];
}

function workOutcomeValues(formData: FormData) {
  const sourceEntry = formData.get("source_design_version_id");
  const sourceId = typeof sourceEntry === "string" && /^[0-9a-f-]{36}$/i.test(sourceEntry) ? sourceEntry : null;
  const restorationEntry = formData.get("restoration_level");
  const restorations: WorkRestorationLevel[] = ["very_close", "adjusted", "major_changes"];
  const restoration = typeof restorationEntry === "string" && restorations.includes(restorationEntry as WorkRestorationLevel) ? restorationEntry as WorkRestorationLevel : null;
  const reasons = [...new Set(formData.getAll("change_reasons").filter((entry): entry is WorkChangeReason => typeof entry === "string" && changeReasonValues.includes(entry as WorkChangeReason)))];
  const notesEntry = formData.get("feedback_notes");
  const feedbackNotes = typeof notesEntry === "string" ? notesEntry.trim() : "";
  if (feedbackNotes.length > 4000) throw new Error("反馈备注不能超过 4000 字。");
  return { source_design_version_id: sourceId, restoration_level: restoration, change_reasons: reasons, feedback_notes: feedbackNotes || null };
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
    const current = await libraryRepository.getById(definition.table, id);
    if (!current) throw new Error("资料不存在或无权访问。");
    const outcomeLoaded = kindValue === "works" && formData.get("work_outcome_loaded") === "true";
    await libraryRepository.update(definition.table, id, { ...parseValues(kindValue, formData), ...(outcomeLoaded ? workOutcomeValues(formData) : {}), status: "active" });
    if (kindValue === "inspiration" || kindValue === "works") {
      await tagRepository.syncEntityTags(userId, definition.entityType, id, selectedTagIds(formData));
    }
    if (outcomeLoaded) await workOutcomeRepository.syncAssets(userId, id, uuidValues(formData, "asset_ids"));
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
