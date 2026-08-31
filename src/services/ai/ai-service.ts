import "server-only";
import { randomUUID } from "node:crypto";
import { aiError, failedGeneration } from "./errors";
import { routeConceptImageGeneration } from "./router";
import type { GenerateConceptImageRequest, GenerateConceptImageResult } from "./types";

function validate(request: GenerateConceptImageRequest) {
  if (request.qualityTier !== "free" && request.qualityTier !== "premium") return aiError("invalid_request", "AI 生成质量级别无效。");
  if (typeof request.prompt !== "string" || typeof request.requirementText !== "string") return aiError("invalid_request", "AI 生成请求格式无效。");
  if (!request.prompt.trim() && !request.requirementText.trim()) return aiError("invalid_request", "需要提供概念提示或设计要求。");
  if (!Array.isArray(request.referenceImages) || !Array.isArray(request.styleIds) || !Array.isArray(request.inspirationIds) || !Array.isArray(request.assetIds)) return aiError("invalid_request", "AI 生成请求格式无效。");
  return null;
}

export async function generateConceptImage(request: GenerateConceptImageRequest): Promise<GenerateConceptImageResult> {
  const invalid = validate(request);
  if (invalid) return failedGeneration(randomUUID(), "", "", invalid);
  return routeConceptImageGeneration(request);
}
