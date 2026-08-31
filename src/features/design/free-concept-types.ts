export interface FreeConceptGenerationInput {
  requirementText: string;
  adjustmentText: string;
  styles: string[];
  nailShapes: string[];
  inspirationSummaries: string[];
  materials: string[];
  styleIds: string[];
  inspirationIds: string[];
  assetIds: string[];
  referenceImageDataUrl?: string;
}

export interface FreeConceptGenerationResult {
  status: "succeeded" | "failed";
  generationId: string;
  imageDataUrl?: string;
  errorCode?: string;
  error?: string;
}
