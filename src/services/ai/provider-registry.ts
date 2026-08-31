import "server-only";
import type { AiImageProviderAdapter } from "./provider";
import { cloudflareImageAdapter } from "./providers/cloudflare";
import { geminiImageAdapter } from "./providers/gemini";
import { openAiImageAdapter } from "./providers/openai";

const adapters = new Map<string, AiImageProviderAdapter>([
  [cloudflareImageAdapter.id, cloudflareImageAdapter],
  [openAiImageAdapter.id, openAiImageAdapter],
  [geminiImageAdapter.id, geminiImageAdapter],
]);

export function getAiProviderAdapter(provider: string) {
  return adapters.get(provider);
}
