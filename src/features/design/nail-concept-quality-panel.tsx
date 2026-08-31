"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { chipStyles } from "@/components/ui/button";
import { validateNailConceptQuality, type NailConceptQualityFeedback, type ReferenceMatch } from "@/services/ai/validation/nail-concept-validation";

function BooleanCheck({ label, value, positiveLabel, negativeLabel, onChange }: { label: string; value: boolean | null; positiveLabel: string; negativeLabel: string; onChange: (value: boolean) => void }) {
  return <fieldset><legend className="text-sm font-medium">{label}</legend><div className="mt-2 flex flex-wrap gap-2"><button type="button" aria-pressed={value === true} onClick={() => onChange(true)} className={chipStyles(value === true)}>{positiveLabel}</button><button type="button" aria-pressed={value === false} onClick={() => onChange(false)} className={chipStyles(value === false)}>{negativeLabel}</button></div></fieldset>;
}

export function NailConceptQualityPanel({ imagePresent, hasReferenceImage, feedback, onChange }: { imagePresent: boolean; hasReferenceImage: boolean; feedback: NailConceptQualityFeedback; onChange: (feedback: NailConceptQualityFeedback) => void }) {
  const validation = validateNailConceptQuality({ image: { present: imagePresent }, request: { expectedNailCount: 10, hasReferenceImage }, feedback });
  const set = <K extends keyof NailConceptQualityFeedback>(key: K, value: NailConceptQualityFeedback[K]) => onChange({ ...feedback, [key]: value });
  const referenceOptions: Array<{ value: ReferenceMatch; label: string }> = [{ value: "close", label: "接近" }, { value: "medium", label: "一般" }, { value: "weak", label: "差距较大" }];

  return <section className="mt-5 rounded-2xl border border-border bg-surface p-4">
    <div className="flex items-start gap-3">{validation.severity === "ok" ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent"/> : <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger"/>}<div><h3 className="font-semibold">{validation.summary}</h3><p className="mt-1 text-xs leading-5 text-muted">免费生成适合快速寻找方向、配色和元素组合，可能出现数量、构图或参考还原偏差。高质量模式后续开放。</p></div></div>
    {validation.severity === "failed" && <ul className="mt-3 space-y-1 text-sm text-danger">{validation.issues.map((issue) => <li key={issue.code}>· {issue.message}</li>)}</ul>}
    <div className="mt-5 grid gap-5 sm:grid-cols-2">
      <BooleanCheck label="完整包含 10 个甲片？" value={feedback.ten_nails_ok} positiveLabel="是" negativeLabel="否" onChange={(value) => set("ten_nails_ok", value)}/>
      <BooleanCheck label="出现手部、皮肤或关节？" value={feedback.hand_artifact} positiveLabel="有" negativeLabel="没有" onChange={(value) => set("hand_artifact", value)}/>
      <BooleanCheck label="存在明显裁切？" value={feedback.cropped} positiveLabel="有" negativeLabel="没有" onChange={(value) => set("cropped", value)}/>
      <BooleanCheck label="存在拼接或多面板？" value={feedback.split_panel} positiveLabel="有" negativeLabel="没有" onChange={(value) => set("split_panel", value)}/>
      {hasReferenceImage && <fieldset className="sm:col-span-2"><legend className="text-sm font-medium">与参考图接近吗？</legend><div className="mt-2 flex flex-wrap gap-2">{referenceOptions.map((option) => <button key={option.value} type="button" aria-pressed={feedback.reference_match === option.value} onClick={() => set("reference_match", option.value)} className={chipStyles(feedback.reference_match === option.value)}>{option.label}</button>)}</div></fieldset>}
    </div>
  </section>;
}
