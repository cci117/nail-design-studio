import type { AiProviderCapabilities, GenerateConceptImageRequest, GenerateConceptImageResult } from "./types";

export interface AiImageProviderAdapter {
  readonly id: string;
  isConfigured(): boolean;
  supportsModel(model: string): boolean;
  capabilities(model: string): AiProviderCapabilities;
  generateConceptImage(request: GenerateConceptImageRequest, model: string, generationId: string): Promise<GenerateConceptImageResult>;
}
