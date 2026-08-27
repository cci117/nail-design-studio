"use server";

import { redirect } from "next/navigation";
import { designRepository } from "@/data/repositories/supabase/design-repository";
import { createClient } from "@/lib/supabase/server";
import type { DesignActionState } from "./design-action-state";
import { fingerKeys, type ConceptVariant, type DesignStructuredData } from "./design-types";

function ids(value: unknown) { return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string" && /^[0-9a-f-]{36}$/i.test(item)))] : []; }
function texts(value: unknown) { return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim().slice(0, 40)).filter(Boolean))].slice(0, 12) : []; }
function parseStructured(value: FormDataEntryValue | null): DesignStructuredData {
  const raw = JSON.parse(typeof value === "string" ? value : "{}") as Partial<DesignStructuredData>;
  const selection = { inspiration_ids: ids(raw.selection?.inspiration_ids), material_ids: ids(raw.selection?.material_ids), shape_tag_ids: ids(raw.selection?.shape_tag_ids), style_tag_ids: ids(raw.selection?.style_tag_ids) };
  const fingers = Object.fromEntries(fingerKeys.map((key) => { const source = raw.fingers?.[key]; return [key, { ...selection, inspiration_ids: ids(source?.inspiration_ids), material_ids: ids(source?.material_ids), shape_tag_ids: ids(source?.shape_tag_ids), style_tag_ids: ids(source?.style_tag_ids), notes: typeof source?.notes === "string" ? source.notes.slice(0, 500) : "" }]; })) as DesignStructuredData["fingers"];
  const conceptVariants: ConceptVariant[] = ["inspiration_led", "material_led", "free_style"];
  const conceptVariant = conceptVariants.includes(raw.concept_variant as ConceptVariant) ? raw.concept_variant as ConceptVariant : undefined;
  const conceptSource = raw.concept_source === "simulation_preview" ? raw.concept_source : undefined;
  const concept = conceptSource && conceptVariant ? {
    concept_source: conceptSource,
    concept_prompt: typeof raw.concept_prompt === "string" ? raw.concept_prompt.slice(0, 1200) : "",
    concept_keywords: texts(raw.concept_keywords),
    concept_style_ids: ids(raw.concept_style_ids),
    concept_inspiration_ids: ids(raw.concept_inspiration_ids),
    concept_asset_ids: ids(raw.concept_asset_ids),
    concept_variant: conceptVariant,
    concept_adjustment_text: typeof raw.concept_adjustment_text === "string" ? raw.concept_adjustment_text.slice(0, 500) : "",
    concept_revision: Number.isInteger(raw.concept_revision) ? Math.max(1, Math.min(999, Number(raw.concept_revision))) : 1,
  } : {};
  return { schema_version: conceptSource ? 2 : 1, requirement_text: typeof raw.requirement_text === "string" ? raw.requirement_text.slice(0, 1000) : "", selection, fingers, ...concept };
}

export async function saveDesign(_: DesignActionState, formData: FormData): Promise<DesignActionState> {
  const title = String(formData.get("title") ?? "").trim().slice(0, 100);
  if (!title) return { error: "请填写设计名称。" };
  let structured: DesignStructuredData;
  try { structured = parseStructured(formData.get("structured_data")); } catch { return { error: "设计数据无效，请重试。" }; }
  const supabase = await createClient(); const { data: { user } } = await supabase!.auth.getUser();
  if (!user) return { error: "登录状态已失效，请重新登录。" };
  try {
    const designId = await designRepository.save(user.id, title, structured.requirement_text, structured, String(formData.get("design_id") ?? "") || undefined);
    redirect(`/designs/${designId}`);
  } catch (error) { if (error && typeof error === "object" && "digest" in error) throw error; return { error: "设计保存失败，请检查网络后重试。" }; }
}
