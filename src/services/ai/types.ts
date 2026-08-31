export type AiQualityTier = "free" | "premium";
export type AiGenerationStatus = "succeeded" | "failed";
export type AiOutputSize = `${number}x${number}`;

export interface AiReferenceImage {
  url?: string;
  dataUrl?: string;
  mimeType?: string;
}

export interface GenerateConceptImageRequest {
  prompt: string;
  referenceImages: AiReferenceImage[];
  styleIds: string[];
  inspirationIds: string[];
  assetIds: string[];
  requirementText: string;
  qualityTier: AiQualityTier;
  outputSize?: AiOutputSize;
}

export interface AiGeneratedImage {
  id: string;
  url?: string;
  base64?: string;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface AiGenerationUsage {
  inputTokens?: number;
  outputTokens?: number;
  imagesGenerated?: number;
  costUsd?: number;
}

export type AiErrorCode =
  | "disabled"
  | "provider_disabled"
  | "missing_credentials"
  | "not_configured"
  | "invalid_request"
  | "unsupported_capability"
  | "rate_limited"
  | "free_quota_exhausted"
  | "timeout"
  | "provider_http_error"
  | "invalid_response"
  | "provider_error";

export interface AiGenerationError {
  code: AiErrorCode;
  message: string;
  retryable: boolean;
}

export interface GenerateConceptImageResult {
  generationId: string;
  provider: string;
  model: string;
  status: AiGenerationStatus;
  images: AiGeneratedImage[];
  usage: AiGenerationUsage;
  error: AiGenerationError | null;
}

export interface AiProviderCapabilities {
  supportsImageInput: boolean;
  maxReferenceImages: number;
  supportsImageEditing: boolean;
  supportedOutputSizes: AiOutputSize[];
}

export interface AiModelTarget {
  provider: string;
  model: string;
}
