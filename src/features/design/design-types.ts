export const fingerKeys = ["left.thumb", "left.index", "left.middle", "left.ring", "left.pinky", "right.thumb", "right.index", "right.middle", "right.ring", "right.pinky"] as const;
export type FingerKey = (typeof fingerKeys)[number];

export const fingerLabels: Record<FingerKey, string> = {
  "left.thumb": "左拇指", "left.index": "左食指", "left.middle": "左中指", "left.ring": "左无名指", "left.pinky": "左小指",
  "right.thumb": "右拇指", "right.index": "右食指", "right.middle": "右中指", "right.ring": "右无名指", "right.pinky": "右小指",
};

export interface FingerDesign {
  inspiration_ids: string[];
  material_ids: string[];
  shape_tag_ids: string[];
  style_tag_ids: string[];
  notes: string;
}

export interface DesignStructuredData {
  schema_version: 1 | 2;
  requirement_text: string;
  selection: Omit<FingerDesign, "notes">;
  fingers: Record<FingerKey, FingerDesign>;
  concept_source?: "simulation_preview" | "free_ai";
  concept_prompt?: string;
  concept_keywords?: string[];
  concept_style_ids?: string[];
  concept_inspiration_ids?: string[];
  concept_asset_ids?: string[];
  concept_variant?: ConceptVariant;
  concept_adjustment_text?: string;
  concept_revision?: number;
  concept_quality_feedback?: NailConceptQualityFeedback;
}

export type ConceptVariant = "inspiration_led" | "material_led" | "free_style";

export interface AdoptedConcept {
  source: "simulation_preview" | "free_ai";
  prompt: string;
  keywords: string[];
  styleIds: string[];
  inspirationIds: string[];
  assetIds: string[];
  variant: ConceptVariant;
  adjustmentText: string;
  revision: number;
  qualityFeedback?: NailConceptQualityFeedback;
}

export interface DesignChoice { id: string; label: string; imageUrl?: string; meta?: string; }
export interface DesignTagChoice { id: string; name: string; group: string; }

export function blankFinger(selection?: Partial<FingerDesign>): FingerDesign {
  return { inspiration_ids: selection?.inspiration_ids ?? [], material_ids: selection?.material_ids ?? [], shape_tag_ids: selection?.shape_tag_ids ?? [], style_tag_ids: selection?.style_tag_ids ?? [], notes: selection?.notes ?? "" };
}
import type { NailConceptQualityFeedback } from "@/services/ai/validation/nail-concept-validation";
