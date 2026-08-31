import "server-only";
import type { AiImageProviderAdapter } from "../provider";
import { aiError, failedGeneration } from "../errors";

export const geminiImageAdapter: AiImageProviderAdapter = {
  id: "gemini",
  isConfigured: () => false,
  supportsModel: () => false,
  capabilities: () => ({ supportsImageInput: false, maxReferenceImages: 0, supportsImageEditing: false, supportedOutputSizes: [] }),
  async generateConceptImage(_request, model, generationId) {
    return failedGeneration(generationId, this.id, model, aiError("not_configured", "Gemini 图片 Provider 尚未接入。"));
  },
};
