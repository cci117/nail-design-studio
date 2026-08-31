"use server";

import { createClient } from "@/lib/supabase/server";
import { generateConceptImage } from "@/services/ai";
import { buildNailConceptPrompt } from "@/services/ai/prompts/nail-concept-prompt";
import type { FreeConceptGenerationInput, FreeConceptGenerationResult } from "./free-concept-types";

function text(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function texts(value: unknown, limit = 12) {
  return Array.isArray(value) ? value.map((item) => text(item, 100)).filter(Boolean).slice(0, limit) : [];
}

function ids(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && /^[0-9a-f-]{36}$/i.test(item)).slice(0, 20) : [];
}

function userError(code: string | undefined) {
  if (code === "rate_limited" || code === "free_quota_exhausted") return "免费额度暂时不可用，请稍后重试。";
  if (code === "timeout") return "图片生成超时，请重新尝试。";
  if (code === "provider_disabled" || code === "missing_credentials") return "免费 AI 当前未开放，可使用结构化概念预览。";
  if (code === "unsupported_capability") return "当前免费模式不支持这组输入，请调整后重试。";
  return "图片生成失败，请重新尝试或使用结构化概念预览。";
}

export async function generateFreeNailConcept(input: FreeConceptGenerationInput): Promise<FreeConceptGenerationResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase!.auth.getUser();
  if (!user) return { status: "failed", generationId: "", errorCode: "unauthorized", error: "登录状态已失效，请重新登录。" };

  const reference = typeof input.referenceImageDataUrl === "string" && input.referenceImageDataUrl.length <= 900_000 ? input.referenceImageDataUrl : "";
  const prompt = buildNailConceptPrompt({
    requirementText: text(input.requirementText, 1000),
    adjustmentText: text(input.adjustmentText, 500),
    styles: texts(input.styles),
    nailShapes: texts(input.nailShapes, 6),
    inspirationSummaries: texts(input.inspirationSummaries, 6),
    materials: texts(input.materials, 12),
  });
  const result = await generateConceptImage({
    prompt,
    referenceImages: reference ? [{ dataUrl: reference, mimeType: reference.slice(5, reference.indexOf(";")) }] : [],
    styleIds: ids(input.styleIds),
    inspirationIds: ids(input.inspirationIds),
    assetIds: ids(input.assetIds),
    requirementText: text(input.requirementText, 1000),
    qualityTier: "free",
    outputSize: "1024x1024",
  });
  if (result.status === "failed") return { status: "failed", generationId: result.generationId, errorCode: result.error?.code, error: userError(result.error?.code) };
  const image = result.images[0];
  if (!image?.base64) return { status: "failed", generationId: result.generationId, errorCode: "invalid_response", error: userError("invalid_response") };
  return { status: "succeeded", generationId: result.generationId, imageDataUrl: `data:${image.mimeType};base64,${image.base64}` };
}
