import "server-only";
import { randomUUID } from "node:crypto";
import { getAiTierConfig, isProviderEnabled } from "./config";
import { aiError, failedGeneration, normalizeProviderError } from "./errors";
import { getAiProviderAdapter } from "./provider-registry";
import type { AiModelTarget, GenerateConceptImageRequest, GenerateConceptImageResult } from "./types";

function capabilityError(request: GenerateConceptImageRequest, target: AiModelTarget) {
  const adapter = getAiProviderAdapter(target.provider);
  if (!adapter) return aiError("not_configured", `未注册 AI Provider：${target.provider || "空"}。`);
  if (!isProviderEnabled(target.provider)) return aiError("provider_disabled", `AI Provider ${target.provider} 当前未启用。`);
  if (!target.model) return aiError("not_configured", "未配置图片生成模型。");
  if (!adapter.supportsModel(target.model)) return aiError("unsupported_capability", `AI Provider ${target.provider} 不支持配置的模型。`);
  if (!adapter.isConfigured()) return aiError("missing_credentials", `AI Provider ${target.provider} 尚未配置凭据。`);
  const capabilities = adapter.capabilities(target.model);
  if (request.referenceImages.length && !capabilities.supportsImageInput) return aiError("unsupported_capability", "当前模型不支持参考图片输入。", true);
  if (request.referenceImages.length > capabilities.maxReferenceImages) return aiError("unsupported_capability", `当前模型最多支持 ${capabilities.maxReferenceImages} 张参考图片。`, true);
  if (request.outputSize && !capabilities.supportedOutputSizes.includes(request.outputSize)) return aiError("unsupported_capability", "当前模型不支持请求的输出尺寸。", true);
  return null;
}

export async function routeConceptImageGeneration(request: GenerateConceptImageRequest): Promise<GenerateConceptImageResult> {
  const generationId = randomUUID();
  const config = getAiTierConfig(request.qualityTier);
  const targets = [config.primary, ...config.fallbacks];
  if (!config.enabled) return failedGeneration(generationId, config.primary.provider, config.primary.model, aiError("provider_disabled", `${request.qualityTier} 图片生成功能当前未启用。`));
  let lastResult = failedGeneration(generationId, config.primary.provider, config.primary.model, aiError("not_configured", "没有可用的图片生成 Provider。"));
  for (const target of targets) {
    const adapter = getAiProviderAdapter(target.provider);
    const unsupported = capabilityError(request, target);
    if (unsupported || !adapter) {
      lastResult = failedGeneration(generationId, target.provider, target.model, unsupported ?? aiError("not_configured", "AI Provider 未注册。"));
      continue;
    }
    try {
      const result = await adapter.generateConceptImage(request, target.model, generationId);
      if (result.status === "succeeded") return result;
      lastResult = result;
    } catch (error) {
      lastResult = failedGeneration(generationId, target.provider, target.model, normalizeProviderError(error));
    }
  }
  return lastResult;
}
