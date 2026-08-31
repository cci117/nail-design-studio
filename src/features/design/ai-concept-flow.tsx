"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, RefreshCw, Sparkles, WandSparkles, X } from "lucide-react";
import { buttonStyles, chipStyles } from "@/components/ui/button";
import { generateFreeNailConcept } from "./free-concept-actions";
import type { FreeConceptGenerationResult } from "./free-concept-types";
import { prepareAiReferenceImage } from "./reference-image-client";
import { NailConceptQualityPanel } from "./nail-concept-quality-panel";
import { emptyNailConceptQualityFeedback, validateNailConceptQuality } from "@/services/ai/validation/nail-concept-validation";
import { blankFinger, fingerKeys, type AdoptedConcept, type ConceptVariant, type DesignChoice, type DesignStructuredData, type DesignTagChoice, type FingerDesign, type FingerKey } from "./design-types";

const keywordSuggestions = ["水晶", "镜面", "渐变", "星空", "珍珠", "亮片"];
const generatingMessages = ["正在分析灵感…", "正在组合风格…", "正在整理十指方案…"];
const variantMeta: Record<ConceptVariant, { title: string; description: string }> = {
  inspiration_led: { title: "方案 1", description: "更接近主要灵感" },
  material_led: { title: "方案 2", description: "更强调材料与装饰" },
  free_style: { title: "方案 3", description: "更自由的风格变化" },
};

type Selection = DesignStructuredData["selection"];
interface ConceptOption { id: string; variant: ConceptVariant; fingers: Record<FingerKey, FingerDesign>; }
interface ConceptBatch { revision: number; adjustment: string; options: ConceptOption[]; }

function rotate<T>(items: T[], index: number) { return items.length ? [items[index % items.length]] : []; }
function buildOptions(selection: Selection, revision: number): ConceptOption[] {
  const variants: ConceptVariant[] = ["inspiration_led", "material_led", "free_style"];
  return variants.map((variant, variantIndex) => {
    const fingers = Object.fromEntries(fingerKeys.map((key, fingerIndex) => {
      const shift = fingerIndex + revision + variantIndex;
      if (variant === "inspiration_led") return [key, blankFinger({ ...selection, inspiration_ids: selection.inspiration_ids.slice(0, 1) })];
      if (variant === "material_led") return [key, blankFinger({ ...selection, material_ids: rotate(selection.material_ids, shift), inspiration_ids: rotate(selection.inspiration_ids, Math.floor(fingerIndex / 2)) })];
      return [key, blankFinger({ ...selection, inspiration_ids: rotate(selection.inspiration_ids, shift), material_ids: rotate(selection.material_ids, shift + 1), style_tag_ids: rotate(selection.style_tag_ids, shift) })];
    })) as Record<FingerKey, FingerDesign>;
    return { id: `${revision}-${variant}`, variant, fingers };
  });
}

function MiniPlan({ option }: { option: ConceptOption }) {
  return <div className="space-y-3">{(["left", "right"] as const).map((hand) => <div key={hand} className={`flex items-end justify-center gap-2 rounded-2xl border border-border bg-background/80 px-3 py-5 ${hand === "right" ? "flex-row-reverse" : ""}`}>{fingerKeys.filter((key) => key.startsWith(hand)).map((key) => { const finger = option.fingers[key]; const emphasized = finger.style_tag_ids.length || finger.material_ids.length; return <span key={key} className={`h-14 w-7 rounded-t-full rounded-b-lg border ${emphasized ? "border-accent/70 bg-accent" : "border-border bg-surface-raised"}`}><span className="sr-only">{key}</span></span>; })}</div>)}</div>;
}

export function AiConceptFlow({ selection, requirement, inspirations, materials, shapeTags, styleTags, initialConcept, onBack, onAdopt }: { selection: Selection; requirement: string; inspirations: DesignChoice[]; materials: DesignChoice[]; shapeTags: DesignTagChoice[]; styleTags: DesignTagChoice[]; initialConcept?: AdoptedConcept; onBack: () => void; onAdopt: (option: ConceptOption, concept: AdoptedConcept, selection: Selection) => void }) {
  const [phase, setPhase] = useState<"input" | "generating" | "results" | "free-generating" | "free-result" | "free-error">("input");
  const [styleIds, setStyleIds] = useState(initialConcept?.styleIds ?? selection.style_tag_ids);
  const [keywords, setKeywords] = useState(initialConcept?.keywords ?? []);
  const [adjustment, setAdjustment] = useState("");
  const [batches, setBatches] = useState<ConceptBatch[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [freeResult, setFreeResult] = useState<FreeConceptGenerationResult | null>(null);
  const [freeRevision, setFreeRevision] = useState(initialConcept?.source === "free_ai" ? initialConcept.revision : 0);
  const [freeAppliedAdjustment, setFreeAppliedAdjustment] = useState(initialConcept?.source === "free_ai" ? initialConcept.adjustmentText : "");
  const [qualityFeedback, setQualityFeedback] = useState(initialConcept?.qualityFeedback ?? emptyNailConceptQualityFeedback);
  const [freeHadReference, setFreeHadReference] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputSelection = useMemo(() => ({ ...selection, style_tag_ids: styleIds }), [selection, styleIds]);
  const selectedInspirations = inspirations.filter((item) => selection.inspiration_ids.includes(item.id));
  const selectedMaterials = materials.filter((item) => selection.material_ids.includes(item.id));
  const selectedShapes = shapeTags.filter((item) => selection.shape_tag_ids.includes(item.id));
  const currentBatch = batches.length ? batches[batches.length - 1] : undefined;
  const selected = currentBatch?.options.find((option) => option.id === selectedId) ?? currentBatch?.options[0];

  useEffect(() => {
    if (phase !== "generating") return;
    const interval = window.setInterval(() => setMessageIndex((index) => (index + 1) % generatingMessages.length), 700);
    return () => window.clearInterval(interval);
  }, [phase]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function toggle(values: string[], value: string) { return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]; }
  function generate(adjustmentText = "") {
    const latestBatch = batches.length ? batches[batches.length - 1] : undefined;
    const revision = (latestBatch?.revision ?? initialConcept?.revision ?? 0) + 1;
    setMessageIndex(0);
    setPhase("generating");
    timer.current = setTimeout(() => {
      const batch = { revision, adjustment: adjustmentText.trim(), options: buildOptions(inputSelection, revision) };
      setBatches((items) => [...items, batch]);
      setSelectedId(batch.options[0].id);
      setAdjustment("");
      setPhase("results");
    }, 1800);
  }
  function cancelGeneration() { if (timer.current) clearTimeout(timer.current); timer.current = null; setPhase(batches.length ? "results" : "input"); }
  async function generateFree(adjustmentText = "") {
    setPhase("free-generating");
    let referenceImageDataUrl: string | undefined;
    const primaryReference = selectedInspirations.find((item) => item.imageUrl)?.imageUrl;
    if (primaryReference) {
      try { referenceImageDataUrl = await prepareAiReferenceImage(primaryReference); }
      catch {
        setFreeResult({ status: "failed", generationId: "", errorCode: "reference_image_failed", error: "参考图处理失败，请重新选择灵感或使用结构化概念预览。" });
        setPhase("free-error");
        return;
      }
    }
    let result: FreeConceptGenerationResult;
    try {
      result = await generateFreeNailConcept({
        requirementText: requirement,
        adjustmentText,
        styles: [...styleTags.filter((tag) => styleIds.includes(tag.id)).map((tag) => tag.name), ...keywords],
        nailShapes: selectedShapes.map((tag) => tag.name),
        inspirationSummaries: selectedInspirations.map((item) => item.label),
        materials: selectedMaterials.map((item) => item.meta ? `${item.label} (${item.meta})` : item.label),
        styleIds,
        inspirationIds: selection.inspiration_ids,
        assetIds: selection.material_ids,
        referenceImageDataUrl,
      });
    } catch {
      result = { status: "failed", generationId: "", errorCode: "network_error", error: "连接免费 AI 失败，请检查网络后重试。" };
    }
    setFreeResult(result);
    if (result.status === "succeeded") {
      setFreeRevision((value) => value + 1);
      setFreeAppliedAdjustment(adjustmentText.trim());
      setFreeHadReference(Boolean(referenceImageDataUrl));
      setQualityFeedback({ ...emptyNailConceptQualityFeedback });
      setAdjustment("");
      setPhase("free-result");
    } else setPhase("free-error");
  }
  function adopt() {
    if (!selected || !currentBatch) return;
    onAdopt(selected, {
      source: "simulation_preview",
      prompt: [requirement, keywords.join("、"), currentBatch.adjustment].filter(Boolean).join("；"),
      keywords,
      styleIds,
      inspirationIds: selection.inspiration_ids,
      assetIds: selection.material_ids,
      variant: selected.variant,
      adjustmentText: currentBatch.adjustment,
      revision: currentBatch.revision,
    }, inputSelection);
  }
  function adoptFree() {
    if (freeResult?.status !== "succeeded") return;
    const revision = Math.max(1, freeRevision);
    const option = buildOptions(inputSelection, revision)[0];
    onAdopt(option, {
      source: "free_ai",
      prompt: [requirement, keywords.join("、"), freeAppliedAdjustment].filter(Boolean).join("；"),
      keywords,
      styleIds,
      inspirationIds: selection.inspiration_ids,
      assetIds: selection.material_ids,
      variant: option.variant,
      adjustmentText: freeAppliedAdjustment,
      revision,
      qualityFeedback,
    }, inputSelection);
  }

  if (phase === "free-generating") return <section className="ai-concept-glow flex min-h-[62dvh] flex-col items-center justify-center rounded-3xl border border-accent/40 bg-surface px-6 text-center"><span className="flex size-16 items-center justify-center rounded-full border border-accent/50 bg-accent/10 text-accent"><Sparkles className="size-7 animate-pulse"/></span><p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-accent">✦ 免费 AI · 真实生成</p><h2 className="mt-3 text-xl font-semibold">正在生成概念图…</h2><p className="mt-3 max-w-sm text-sm leading-6 text-muted">本次只生成 1 张图片。离开页面不会自动重新调用。</p></section>;

  if (phase === "free-error") return <section className="rounded-3xl border border-border bg-surface p-5"><p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">✦ 免费 AI</p><h2 className="mt-2 text-xl font-semibold">本次生成未完成</h2><p className="mt-3 text-sm leading-6 text-danger">{freeResult?.error ?? "图片生成失败，请重新尝试。"}</p><div className="mt-6 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => void generateFree(adjustment)} className="ai-action min-h-11 rounded-xl border px-4 text-sm font-semibold"><RefreshCw className="size-4"/>重新尝试</button><button type="button" onClick={() => generate()} className={buttonStyles({ variant: "secondary" })}>使用结构化概念预览</button></div><button type="button" onClick={() => setPhase("input")} className={buttonStyles({ variant: "ghost", className: "mt-3 w-full" })}><ArrowLeft className="size-4"/>返回调整输入</button></section>;

  if (phase === "free-result" && freeResult?.imageDataUrl) {
    const validation = validateNailConceptQuality({ image: { present: true }, request: { expectedNailCount: 10, hasReferenceImage: freeHadReference }, feedback: qualityFeedback });
    return <div className="min-w-0"><header><p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">✦ 免费 AI</p><h2 className="mt-2 text-2xl font-semibold">真实生成</h2><p className="mt-2 text-sm text-muted">快速找方向、配色和元素组合 · 当前图片仅在本页临时显示，尚未保存。</p></header><section className="mt-5 overflow-hidden rounded-3xl border border-border bg-black"><img src={freeResult.imageDataUrl} alt="免费 AI 生成的十指甲片概念图" className="aspect-square w-full object-contain"/></section><NailConceptQualityPanel imagePresent hasReferenceImage={freeHadReference} feedback={qualityFeedback} onChange={setQualityFeedback}/><section className="mt-5 rounded-2xl border border-accent/30 bg-surface p-4"><label className="text-sm font-medium text-accent">调整要求<textarea value={adjustment} onChange={(event) => setAdjustment(event.target.value)} maxLength={500} rows={3} placeholder="例如：更简洁一点，减少装饰，紫色淡一些" className="mt-3 w-full rounded-xl border border-border bg-background p-4 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"/></label><button type="button" disabled={!adjustment.trim()} onClick={() => void generateFree(adjustment)} className="ai-action mt-3 min-h-11 w-full rounded-xl border px-4 text-sm font-semibold"><Sparkles className="size-4"/>按要求重新生成</button></section><div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 mt-5 grid gap-2 rounded-2xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur sm:grid-cols-2 md:bottom-4"><button type="button" onClick={() => void generateFree()} className="ai-action min-h-11 rounded-xl border px-4 text-sm font-semibold"><RefreshCw className="size-4"/>重新生成</button><button type="button" onClick={adoptFree} className={buttonStyles()}>{validation.severity === "ok" ? "采用此方案" : "继续使用"}<Check className="size-4"/></button><button type="button" onClick={() => generate()} className={buttonStyles({ variant: "secondary", className: "sm:col-span-2" })}>使用结构化概念预览</button></div></div>;
  }

  if (phase === "generating") return <section className="ai-concept-glow flex min-h-[62dvh] flex-col items-center justify-center rounded-3xl border border-accent/40 bg-surface px-6 text-center"><span className="flex size-16 items-center justify-center rounded-full border border-accent/50 bg-accent/10 text-accent"><Sparkles className="size-7 animate-pulse"/></span><p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-accent">概念图功能预览</p><h2 className="mt-3 text-xl font-semibold">正在构思设计…</h2><p className="mt-3 text-sm text-muted">{generatingMessages[messageIndex]}</p><div className="mt-7 max-w-sm rounded-2xl border border-border bg-background/70 p-4 text-left text-xs leading-6 text-muted"><p>灵感 {selection.inspiration_ids.length} · 材料 {selection.material_ids.length} · 风格 {styleIds.length}</p><p className="mt-1">这是模拟交互状态，当前未调用任何 AI 模型。</p></div><button type="button" onClick={cancelGeneration} className={buttonStyles({ variant: "ghost", className: "mt-7" })}><X className="size-4"/>取消</button></section>;

  if (phase === "input") return <div className="space-y-7"><header><button type="button" onClick={onBack} className={buttonStyles({ variant: "ghost", size: "compact" })}><ArrowLeft className="size-4"/>返回修改选择</button><p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-accent">AI 风格概念图</p><h2 className="mt-2 text-2xl font-semibold">组织概念输入</h2><p className="mt-2 text-sm leading-6 text-muted">免费生成用于快速找方向、配色和元素组合，可能出现甲片数量不准、构图偏差或参考图还原不足。可重新生成，或使用结构化概念预览；高质量模式后续开放。</p></header>
    <section className="rounded-2xl border border-border bg-surface p-4"><h3 className="text-sm font-medium">风格</h3><div className="mt-3 flex flex-wrap gap-2">{styleTags.map((tag) => <button key={tag.id} type="button" aria-pressed={styleIds.includes(tag.id)} onClick={() => setStyleIds((items) => toggle(items, tag.id))} className={chipStyles(styleIds.includes(tag.id))}>{styleIds.includes(tag.id) && <Check className="size-3.5"/>}{tag.name}</button>)}{!styleTags.length && <span className="text-sm text-muted">可先在标签管理中添加风格</span>}</div></section>
    <section className="rounded-2xl border border-border bg-surface p-4"><h3 className="text-sm font-medium">关键词</h3><div className="mt-3 flex flex-wrap gap-2">{keywordSuggestions.map((keyword) => <button key={keyword} type="button" aria-pressed={keywords.includes(keyword)} onClick={() => setKeywords((items) => toggle(items, keyword))} className={chipStyles(keywords.includes(keyword))}>{keyword}</button>)}</div></section>
    <section><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-medium">灵感图片</h3><button type="button" onClick={onBack} className={buttonStyles({ variant: "ghost", size: "compact" })}>返回修改</button></div>{selectedInspirations.length ? <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{selectedInspirations.map((item) => <div key={item.id} className="overflow-hidden rounded-xl border border-border bg-surface">{item.imageUrl ? <img src={item.imageUrl} alt="" className="aspect-square w-full object-cover"/> : <div className="aspect-square bg-surface-raised"/>}<p className="truncate p-2 text-xs font-medium">{item.label}</p></div>)}</div> : <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">未选择灵感，也可以继续体验。</p>}</section>
    <section className="rounded-2xl border border-border bg-surface p-4"><h3 className="text-sm font-medium">材料摘要</h3><div className="mt-3 flex flex-wrap gap-2">{selectedMaterials.length ? selectedMaterials.map((item) => <span key={item.id} className="rounded-full border border-border bg-surface-raised px-3 py-2 text-sm">{item.label}{item.meta ? ` · ${item.meta}` : ""}</span>) : <span className="text-sm text-muted">未选择材料</span>}</div><p className="mt-3 text-xs text-muted">材料作为设计参考，不要求全部出现在最终方案。</p></section>
    {requirement && <section className="rounded-2xl border border-border bg-surface p-4"><h3 className="text-sm font-medium">其他要求</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{requirement}</p></section>}
    <div className="grid gap-2"><button type="button" onClick={() => void generateFree()} className="ai-action min-h-12 w-full rounded-xl border px-5 text-sm font-semibold"><Sparkles className="size-5"/>生成真实免费 AI</button><button type="button" onClick={() => generate()} className={buttonStyles({ variant: "secondary", className: "w-full" })}><WandSparkles className="size-5"/>使用结构化概念预览</button></div>
  </div>;

  return <div className="min-w-0 max-w-full overflow-x-hidden [contain:inline-size]"><header><p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">概念方案预览</p><h2 className="mt-2 text-2xl font-semibold">选择一个方向</h2><p className="mt-2 text-sm text-muted">真实 AI 效果图将在接入生成模型后显示。</p></header>
    {batches.length > 1 && <p className="mt-4 text-xs text-muted">已保留 {batches.length - 1} 个上一版模拟方案组 · 当前第 {currentBatch?.revision} 版</p>}
    <div className="mt-6 flex snap-x gap-4 overflow-x-auto pb-3 lg:grid lg:grid-cols-3 lg:overflow-visible">{currentBatch?.options.map((option) => { const active = option.id === selected?.id; const meta = variantMeta[option.variant]; return <button key={option.id} type="button" onClick={() => setSelectedId(option.id)} aria-pressed={active} className={`min-w-[82%] snap-center rounded-3xl border bg-surface p-4 text-left sm:min-w-[48%] lg:min-w-0 ${active ? "border-accent ring-2 ring-accent/30" : "border-border"}`}><div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="font-semibold">{meta.title}</h3><p className="mt-1 text-xs text-muted">{meta.description}</p></div>{active && <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-black">当前方案</span>}</div><MiniPlan option={option}/><p className="mt-4 text-xs leading-5 text-muted">结构化设计方案卡片 · 非真实 AI 图片</p></button>; })}</div>
    <section className="mt-6 rounded-2xl border border-accent/30 bg-surface p-4"><label className="text-sm font-medium text-accent">AI 调整<textarea value={adjustment} onChange={(event) => setAdjustment(event.target.value)} maxLength={500} rows={3} placeholder="告诉 AI 你想怎么修改，例如：更简洁一点" className="mt-3 w-full rounded-xl border border-border bg-background p-4 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"/></label><button type="button" disabled={!adjustment.trim()} onClick={() => generate(adjustment)} className="ai-action mt-3 min-h-11 w-full rounded-xl border px-4 text-sm font-semibold"><Sparkles className="size-4"/>AI 调整</button></section>
    <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 mt-6 grid gap-2 rounded-2xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur sm:grid-cols-2 md:bottom-4"><button type="button" onClick={() => generate()} className="ai-action min-h-11 rounded-xl border px-4 text-sm font-semibold"><RefreshCw className="size-4"/>再生成</button><button type="button" onClick={adopt} className={buttonStyles({ className: "w-full" })}>采用此方案<Check className="size-4"/></button></div>
  </div>;
}
