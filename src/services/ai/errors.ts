import type { AiErrorCode, AiGenerationError, GenerateConceptImageResult } from "./types";

export function aiError(code: AiErrorCode, message: string, retryable = false): AiGenerationError {
  return { code, message, retryable };
}

export function failedGeneration(generationId: string, provider: string, model: string, error: AiGenerationError): GenerateConceptImageResult {
  return { generationId, provider, model, status: "failed", images: [], usage: {}, error };
}

export function normalizeProviderError(error: unknown): AiGenerationError {
  if (error instanceof Error && error.name === "AbortError") return aiError("timeout", "AI 服务响应超时。", true);
  return aiError("provider_error", "AI 服务暂时不可用。", true);
}
