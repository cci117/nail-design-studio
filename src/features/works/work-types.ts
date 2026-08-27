import type { Asset, DesignVersion, WorkChangeReason, WorkRestorationLevel } from "@/types/domain";
import type { DesignStructuredData } from "@/features/design/design-types";

export interface DesignVersionChoice {
  id: string;
  designId: string;
  designTitle: string;
  versionNumber: number;
  versionType: DesignVersion["version_type"];
  structuredData: DesignStructuredData | null;
}

export type WorkAssetChoice = Pick<Asset, "id" | "name" | "category" | "brand" | "color">;

export const restorationLabels: Record<WorkRestorationLevel, string> = {
  very_close: "很接近设计",
  adjusted: "有一些调整",
  major_changes: "改动很大",
};

export const changeReasonLabels: Record<WorkChangeReason, string> = {
  material_limit: "材料限制",
  production_difficulty: "制作难度",
  aesthetic_change: "临时审美变化",
  color_adjustment: "颜色调整",
  composition_adjustment: "构图调整",
  decoration_adjustment: "装饰调整",
  shape_length_adjustment: "甲型/长度调整",
  other: "其他",
};

export const changeReasonValues = Object.keys(changeReasonLabels) as WorkChangeReason[];
