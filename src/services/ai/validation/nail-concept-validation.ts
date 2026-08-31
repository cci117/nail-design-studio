export type ReferenceMatch = "close" | "medium" | "weak" | "unknown";

export interface NailConceptQualityFeedback {
  ten_nails_ok: boolean | null;
  hand_artifact: boolean | null;
  cropped: boolean | null;
  split_panel: boolean | null;
  reference_match: ReferenceMatch;
}

export type NailConceptValidationIssueCode =
  | "missing_image"
  | "manual_review_needed"
  | "nail_count"
  | "hand_artifact"
  | "cropped"
  | "split_panel"
  | "reference_mismatch";

export interface NailConceptValidationIssue {
  code: NailConceptValidationIssueCode;
  message: string;
}

export interface NailConceptValidationResult {
  passed: boolean;
  severity: "ok" | "warning" | "failed";
  issues: NailConceptValidationIssue[];
  summary: string;
}

export const emptyNailConceptQualityFeedback: NailConceptQualityFeedback = {
  ten_nails_ok: null,
  hand_artifact: null,
  cropped: null,
  split_panel: null,
  reference_match: "unknown",
};

export function validateNailConceptQuality(input: {
  image: { present: boolean };
  request: { expectedNailCount: 10; hasReferenceImage: boolean };
  feedback: NailConceptQualityFeedback;
}): NailConceptValidationResult {
  if (!input.image.present) {
    return { passed: false, severity: "failed", issues: [{ code: "missing_image", message: "生成结果没有可显示的图片。" }], summary: "本次生成结果无效。" };
  }

  const issues: NailConceptValidationIssue[] = [];
  const { feedback } = input;
  if (feedback.ten_nails_ok === false) issues.push({ code: "nail_count", message: "甲片数量不是完整的 10 片。" });
  if (feedback.hand_artifact === true) issues.push({ code: "hand_artifact", message: "画面出现了手部、皮肤或指关节。" });
  if (feedback.cropped === true) issues.push({ code: "cropped", message: "部分甲片存在明显裁切。" });
  if (feedback.split_panel === true) issues.push({ code: "split_panel", message: "画面存在拼接或多面板痕迹。" });
  if (input.request.hasReferenceImage && feedback.reference_match === "weak") issues.push({ code: "reference_mismatch", message: "与参考图的风格差距较大。" });

  const unanswered = feedback.ten_nails_ok === null
    || feedback.hand_artifact === null
    || feedback.cropped === null
    || feedback.split_panel === null
    || (input.request.hasReferenceImage && feedback.reference_match === "unknown");

  if (issues.length) return { passed: false, severity: "failed", issues, summary: "这次免费生成可能存在完整性问题。" };
  if (unanswered) return { passed: false, severity: "warning", issues: [{ code: "manual_review_needed", message: "当前没有可靠的自动视觉判断，请完成快速检查。" }], summary: "请快速检查生成结果。" };
  return { passed: true, severity: "ok", issues: [], summary: "未标记明显的完整性问题。" };
}
