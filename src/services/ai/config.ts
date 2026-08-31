import "server-only";
import type { AiModelTarget, AiQualityTier } from "./types";

export interface AiTierConfig {
  enabled: boolean;
  primary: AiModelTarget;
  fallbacks: AiModelTarget[];
}

function enabled(value: string | undefined) {
  return value?.toLowerCase() === "true";
}

function target(provider: string | undefined, model: string | undefined): AiModelTarget {
  return { provider: provider?.trim() ?? "", model: model?.trim() ?? "" };
}

function fallback(provider: string | undefined, model: string | undefined) {
  const value = target(provider, model);
  return value.provider && value.model ? [value] : [];
}

export function getAiTierConfig(tier: AiQualityTier): AiTierConfig {
  if (tier === "premium") {
    return {
      enabled: enabled(process.env.PREMIUM_IMAGE_ENABLED),
      primary: target(process.env.PREMIUM_IMAGE_PROVIDER, process.env.PREMIUM_IMAGE_MODEL),
      fallbacks: fallback(process.env.PREMIUM_IMAGE_FALLBACK_PROVIDER, process.env.PREMIUM_IMAGE_FALLBACK_MODEL),
    };
  }
  return {
    enabled: enabled(process.env.FREE_IMAGE_ENABLED),
    primary: target(process.env.FREE_IMAGE_PROVIDER, process.env.FREE_IMAGE_MODEL),
    fallbacks: fallback(process.env.FREE_IMAGE_FALLBACK_PROVIDER, process.env.FREE_IMAGE_FALLBACK_MODEL),
  };
}

export function isProviderEnabled(provider: string) {
  const switches: Record<string, boolean> = {
    cloudflare: enabled(process.env.CLOUDFLARE_AI_ENABLED),
    openai: enabled(process.env.OPENAI_IMAGE_ENABLED),
    gemini: enabled(process.env.GEMINI_IMAGE_ENABLED),
    fal: enabled(process.env.FAL_IMAGE_ENABLED),
  };
  return switches[provider] ?? false;
}
