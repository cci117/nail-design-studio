import { fingerKeys, type DesignStructuredData } from "@/features/design/design-types";

export function DesignPlanPreview({ data, compact = false }: { data: DesignStructuredData; compact?: boolean }) {
  return <div className="flex h-full min-h-52 flex-col justify-center rounded-2xl border border-accent/40 bg-surface p-4">
    <p className="mb-4 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-accent">设计方案预览</p>
    {(["left", "right"] as const).map((hand) => <div key={hand} className={`mx-auto mb-3 flex w-full max-w-sm items-end justify-center gap-2 rounded-2xl border border-border bg-background p-3 ${hand === "right" ? "flex-row-reverse" : ""}`}>
      {fingerKeys.filter((key) => key.startsWith(hand)).map((key) => { const finger = data.fingers?.[key]; const selected = Boolean(finger?.style_tag_ids?.length || finger?.inspiration_ids?.length || finger?.material_ids?.length); return <span key={key} className={`${compact ? "h-12 w-6" : "h-16 w-8"} rounded-t-full rounded-b-lg border border-border ${selected ? "bg-accent" : "bg-surface-raised"}`}><span className="sr-only">{key}</span></span>; })}
    </div>)}
    <p className="text-center text-[11px] text-muted">结构化十指方案 · 非 AI 效果图</p>
  </div>;
}
