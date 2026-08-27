"use client";
/* eslint-disable @next/next/no-img-element */

import { useActionState, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, Eye, Grid2X2, Redo2, RotateCcw, Save, Sparkles, Trash2, Undo2 } from "lucide-react";
import { buttonStyles, chipStyles } from "@/components/ui/button";
import { initialDesignActionState } from "./design-action-state";
import { AiConceptFlow } from "./ai-concept-flow";
import { saveDesign } from "./design-actions";
import { blankFinger, fingerKeys, fingerLabels, type AdoptedConcept, type DesignChoice, type DesignStructuredData, type DesignTagChoice, type FingerDesign, type FingerKey } from "./design-types";

type View = "setup" | "concept" | "finger" | "overview" | "preview";
interface Props { inspirations: DesignChoice[]; materials: DesignChoice[]; tags: DesignTagChoice[]; initial?: DesignStructuredData; designId?: string; initialTitle?: string; }

function toggle(values: string[], id: string) { return values.includes(id) ? values.filter((value) => value !== id) : [...values, id]; }
function ChoiceGrid({ title, choices, selected, onToggle }: { title: string; choices: DesignChoice[]; selected: string[]; onToggle: (id: string) => void }) {
  return <section><h3 className="mb-3 text-sm font-medium">{title}<span className="ml-2 text-xs text-muted">已选 {selected.length}</span></h3>{choices.length ? <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{choices.map((choice) => <button key={choice.id} type="button" aria-pressed={selected.includes(choice.id)} onClick={() => onToggle(choice.id)} className={`relative min-h-24 overflow-hidden rounded-xl border text-left ${selected.includes(choice.id) ? "border-primary ring-2 ring-primary" : "border-border bg-surface"}`}>{choice.imageUrl ? <img src={choice.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover"/> : <span className="absolute inset-0 bg-surface-raised"/>}<span className="absolute inset-x-0 bottom-0 bg-black/75 px-2 py-2 text-xs font-medium text-white">{choice.label}</span>{selected.includes(choice.id) && <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="size-3.5"/></span>}</button>)}</div> : <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted">暂无可选内容</p>}</section>;
}
function TagGroup({ title, choices, selected, onToggle }: { title: string; choices: DesignTagChoice[]; selected: string[]; onToggle: (id: string) => void }) {
  return <section><h3 className="mb-3 text-sm font-medium">{title}</h3><div className="flex flex-wrap gap-2">{choices.map((tag) => <button key={tag.id} type="button" aria-pressed={selected.includes(tag.id)} onClick={() => onToggle(tag.id)} className={chipStyles(selected.includes(tag.id))}>{tag.name}</button>)}{!choices.length && <span className="text-sm text-muted">可先在标签管理中添加</span>}</div></section>;
}
function Nail({ finger, active = false }: { finger: FingerDesign; active?: boolean }) {
  const color = finger.style_tag_ids.length ? "bg-accent" : finger.inspiration_ids.length || finger.material_ids.length ? "bg-primary" : "bg-surface-raised";
  return <div className={`mx-auto h-24 w-12 rounded-t-[2rem] rounded-b-2xl border ${active ? "border-accent ring-2 ring-accent/30" : "border-border"} ${color}`}><span className="sr-only">甲片设计占位</span></div>;
}

export function DesignBuilder({ inspirations, materials, tags, initial, designId, initialTitle = "" }: Props) {
  const initialSelection = initial?.selection ?? { inspiration_ids: [], material_ids: [], shape_tag_ids: [], style_tag_ids: [] };
  const [view, setView] = useState<View>(initial ? "finger" : "setup");
  const [selection, setSelection] = useState(initialSelection);
  const [requirement, setRequirement] = useState(initial?.requirement_text ?? "");
  const [fingers, setFingers] = useState<Record<FingerKey, FingerDesign>>(initial?.fingers ?? Object.fromEntries(fingerKeys.map((key) => [key, blankFinger(initialSelection)])) as Record<FingerKey, FingerDesign>);
  const [current, setCurrent] = useState<FingerKey>("left.thumb");
  const swipe = useRef<{ pointerId: number; startX: number; startY: number; x: number; y: number } | null>(null);
  const [overviewSelected, setOverviewSelected] = useState<FingerKey[]>([]);
  const [concept, setConcept] = useState<AdoptedConcept | undefined>(initial?.concept_source === "simulation_preview" && initial.concept_variant ? { source: "simulation_preview", prompt: initial.concept_prompt ?? "", keywords: initial.concept_keywords ?? [], styleIds: initial.concept_style_ids ?? [], inspirationIds: initial.concept_inspiration_ids ?? [], assetIds: initial.concept_asset_ids ?? [], variant: initial.concept_variant, adjustmentText: initial.concept_adjustment_text ?? "", revision: initial.concept_revision ?? 1 } : undefined);
  const [state, action, pending] = useActionState(saveDesign, initialDesignActionState);
  const shapeTags = tags.filter((tag) => tag.group === "shape"), styleTags = tags.filter((tag) => tag.group === "style");
  const structured = useMemo<DesignStructuredData>(() => ({ schema_version: concept ? 2 : 1, requirement_text: requirement, selection, fingers, ...(concept ? { concept_source: concept.source, concept_prompt: concept.prompt, concept_keywords: concept.keywords, concept_style_ids: concept.styleIds, concept_inspiration_ids: concept.inspirationIds, concept_asset_ids: concept.assetIds, concept_variant: concept.variant, concept_adjustment_text: concept.adjustmentText, concept_revision: concept.revision } : {}) }), [requirement, selection, fingers, concept]);
  const patchCurrent = (patch: Partial<FingerDesign>) => setFingers((all) => ({ ...all, [current]: { ...all[current], ...patch } }));
  function moveFinger(offset: -1 | 1) {
    setCurrent((finger) => {
      const index = fingerKeys.indexOf(finger);
      return fingerKeys[(index + offset + fingerKeys.length) % fingerKeys.length];
    });
  }
  function beginFingerSwipe(event: React.PointerEvent<HTMLElement>) {
    if (!event.isPrimary) return;
    swipe.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY };
  }
  function trackFingerSwipe(event: React.PointerEvent<HTMLElement>) {
    if (!swipe.current || swipe.current.pointerId !== event.pointerId) return;
    swipe.current.x = event.clientX;
    swipe.current.y = event.clientY;
  }
  function finishFingerSwipe(event: React.PointerEvent<HTMLElement>) {
    const gesture = swipe.current;
    swipe.current = null;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    moveFinger(deltaX < 0 ? 1 : -1);
  }
  function copyCurrent(targets: FingerKey[]) { setFingers((all) => { const next = { ...all }; targets.filter((key) => key !== current).forEach((key) => { next[key] = { ...all[current], inspiration_ids: [...all[current].inspiration_ids], material_ids: [...all[current].material_ids], shape_tag_ids: [...all[current].shape_tag_ids], style_tag_ids: [...all[current].style_tag_ids] }; }); return next; }); }

  if (view === "concept") return <div className="mx-auto max-w-4xl"><AiConceptFlow selection={selection} requirement={requirement} inspirations={inspirations} materials={materials} styleTags={styleTags} initialConcept={concept} onBack={() => setView("setup")} onAdopt={(option, adopted, nextSelection) => { setSelection(nextSelection); setFingers(option.fingers); setConcept(adopted); setCurrent("left.thumb"); setView("finger"); }}/></div>;

  return <form action={action} className="mx-auto max-w-4xl">
    <input type="hidden" name="structured_data" value={JSON.stringify(structured)}/>
    {designId && <input type="hidden" name="design_id" value={designId}/>}
    <header className="mb-6 flex items-center justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">设计工作台</p><h1 className="mt-2 text-2xl font-semibold">{view === "setup" ? "开始设计" : view === "finger" ? fingerLabels[current] : view === "overview" ? "十指总览" : "双手预览"}</h1></div>{view !== "setup" && <button type="button" onClick={() => setView("setup")} className={buttonStyles({ variant: "ghost", size: "compact" })}><RotateCcw className="size-4"/>调整选择</button>}</header>
    {view === "finger" && <nav aria-label="十指导航" className="mb-3 flex gap-2 overflow-x-auto pb-2">{fingerKeys.map((key) => <button key={key} type="button" aria-current={key === current ? "true" : undefined} onClick={() => setCurrent(key)} className={`min-h-14 min-w-16 shrink-0 rounded-xl border px-2 text-[10px] font-medium ${key === current ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-muted"}`}>{fingerLabels[key]}</button>)}</nav>}

    {view === "setup" && <div className="space-y-8"><ChoiceGrid title="选择灵感" choices={inspirations} selected={selection.inspiration_ids} onToggle={(id) => setSelection((value) => ({ ...value, inspiration_ids: toggle(value.inspiration_ids, id) }))}/><ChoiceGrid title="选择材料" choices={materials} selected={selection.material_ids} onToggle={(id) => setSelection((value) => ({ ...value, material_ids: toggle(value.material_ids, id) }))}/><TagGroup title="甲型" choices={shapeTags} selected={selection.shape_tag_ids} onToggle={(id) => setSelection((value) => ({ ...value, shape_tag_ids: toggle(value.shape_tag_ids, id) }))}/><TagGroup title="风格" choices={styleTags} selected={selection.style_tag_ids} onToggle={(id) => setSelection((value) => ({ ...value, style_tag_ids: toggle(value.style_tag_ids, id) }))}/><label className="block"><span className="mb-2 block text-sm font-medium">其他要求</span><textarea value={requirement} onChange={(event) => setRequirement(event.target.value)} maxLength={1000} rows={4} placeholder="配色、氛围或需要避开的元素" className="w-full rounded-xl border border-border bg-surface p-4 text-sm placeholder:text-muted focus:border-accent focus:outline-none"/></label><button type="button" onClick={() => setView("concept")} className="ai-action min-h-12 w-full rounded-xl border px-5 text-sm font-semibold"><Sparkles className="size-5"/>进入 AI 风格概念图</button></div>}

    {view === "finger" && <div><section onPointerDown={beginFingerSwipe} onPointerMove={trackFingerSwipe} onPointerUp={finishFingerSwipe} onPointerCancel={() => { swipe.current = null; }} className="relative flex min-h-[42dvh] touch-pan-y select-none items-center justify-center rounded-3xl border border-border bg-surface"><div key={current} className="scale-[1.8] transition-opacity duration-150"><Nail finger={fingers[current]} active/></div><span className="pointer-events-none absolute bottom-4 text-xs text-muted">左右滑动切换 · 当前甲片</span></section><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><button type="button" onClick={() => setView("concept")} className="ai-action min-h-11 rounded-xl border px-3 text-sm font-semibold"><Sparkles className="size-4"/>AI 重新设计</button><button type="button" disabled className={buttonStyles({ variant: "secondary", size: "compact" })}>局部修改 · 即将支持</button><button type="button" disabled className={buttonStyles({ variant: "ghost", size: "compact" })}><Undo2 className="size-4"/>撤销</button><button type="button" disabled className={buttonStyles({ variant: "ghost", size: "compact" })}><Redo2 className="size-4"/>重做</button></div><section className="mt-6 space-y-6 rounded-2xl border border-border bg-surface p-4"><ChoiceGrid title="更换灵感" choices={inspirations} selected={fingers[current].inspiration_ids} onToggle={(id) => patchCurrent({ inspiration_ids: toggle(fingers[current].inspiration_ids, id) })}/><ChoiceGrid title="更换材料" choices={materials} selected={fingers[current].material_ids} onToggle={(id) => patchCurrent({ material_ids: toggle(fingers[current].material_ids, id) })}/><TagGroup title="更换甲型" choices={shapeTags} selected={fingers[current].shape_tag_ids} onToggle={(id) => patchCurrent({ shape_tag_ids: toggle(fingers[current].shape_tag_ids, id) })}/><TagGroup title="更换风格" choices={styleTags} selected={fingers[current].style_tag_ids} onToggle={(id) => patchCurrent({ style_tag_ids: toggle(fingers[current].style_tag_ids, id) })}/><label className="block text-sm font-medium">当前手指备注<textarea value={fingers[current].notes} onChange={(event) => patchCurrent({ notes: event.target.value })} rows={2} className="mt-2 w-full rounded-xl border border-border bg-background p-3"/></label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setView("overview")} className={buttonStyles({ variant: "secondary" })}><Copy className="size-4"/>复制到其他手指</button><button type="button" onClick={() => patchCurrent(blankFinger())} className={buttonStyles({ variant: "danger" })}><Trash2 className="size-4"/>清除当前手指</button></div></section></div>}

    {view === "overview" && <div><p className="mb-4 text-sm text-muted">点击手指可多选；再次点击取消。点击名称进入单指编辑。</p>{(["left", "right"] as const).map((hand) => <section key={hand} className="mb-4 rounded-2xl border border-border bg-surface p-4"><h2 className="mb-5 text-sm font-medium">{hand === "left" ? "左手" : "右手"}</h2><div className="grid grid-cols-5 gap-2">{fingerKeys.filter((key) => key.startsWith(hand)).map((key) => <div key={key} className="text-center"><button type="button" aria-pressed={overviewSelected.includes(key)} onClick={() => setOverviewSelected((items) => items.includes(key) ? items.filter((item) => item !== key) : [...items, key])} className={`w-full rounded-xl py-2 ${overviewSelected.includes(key) ? "bg-surface-raised ring-2 ring-accent" : ""}`}><Nail finger={fingers[key]}/></button><button type="button" onClick={() => { setCurrent(key); setView("finger"); }} className="mt-2 min-h-11 text-[11px] font-medium text-muted underline-offset-4 active:underline">{fingerLabels[key].replace(hand === "left" ? "左" : "右", "")}</button></div>)}</div></section>)}<div className="grid grid-cols-2 gap-3"><button type="button" disabled={!overviewSelected.length} onClick={() => copyCurrent(overviewSelected)} className={buttonStyles({ variant: "secondary" })}><Copy className="size-4"/>复制当前指到已选</button><button type="button" onClick={() => setView("preview")} className={buttonStyles()}><Eye className="size-4"/>双手预览</button></div><section className="mt-5 rounded-2xl border border-border p-4"><h3 className="text-sm font-medium">整体摘要</h3><p className="mt-2 text-xs leading-6 text-muted">灵感 {new Set(fingerKeys.flatMap((key) => fingers[key].inspiration_ids)).size} · 材料 {new Set(fingerKeys.flatMap((key) => fingers[key].material_ids)).size} · 甲型 {new Set(fingerKeys.flatMap((key) => fingers[key].shape_tag_ids)).size} · 风格 {new Set(fingerKeys.flatMap((key) => fingers[key].style_tag_ids)).size}</p></section></div>}

    {view === "preview" && <div><section className="rounded-3xl border border-border bg-surface p-5"><div className="mb-8 text-center"><p className="text-xs uppercase tracking-[0.2em] text-muted">效果预览</p><p className="mt-2 text-xs text-muted">简化结构预览 · 不代表 AI 最终效果</p></div>{(["left", "right"] as const).map((hand) => <div key={hand} className={`mb-7 flex justify-center gap-3 rounded-[3rem] border border-border bg-background px-3 py-7 ${hand === "right" ? "flex-row-reverse" : ""}`}>{fingerKeys.filter((key) => key.startsWith(hand)).map((key) => <button key={key} type="button" onClick={() => { setCurrent(key); setView("finger"); }} aria-label={`编辑${fingerLabels[key]}`}><Nail finger={fingers[key]}/></button>)}</div>)}</section><button type="button" onClick={() => setView("overview")} className={buttonStyles({ variant: "secondary", className: "mt-4 w-full" })}><ArrowLeft className="size-4"/>返回十指总览</button></div>}

    {view !== "setup" && <section className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 mt-6 rounded-2xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur md:bottom-4"><label className="mb-2 block text-xs font-medium text-muted">设计名称<input name="title" required maxLength={100} defaultValue={initialTitle} placeholder="为设计命名" className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted"/></label>{state.error && <p className="mb-2 text-sm text-danger">{state.error}</p>}<div className="grid grid-cols-3 gap-2"><button type="button" onClick={() => setView("finger")} className={buttonStyles({ variant: view === "finger" ? "primary" : "secondary", size: "compact" })}>单指</button><button type="button" onClick={() => setView("overview")} className={buttonStyles({ variant: view === "overview" ? "primary" : "secondary", size: "compact" })}><Grid2X2 className="size-4"/>总览</button><button disabled={pending} className={buttonStyles({ size: "compact" })}><Save className="size-4"/>{pending ? "保存中…" : "保存设计"}</button></div></section>}
  </form>;
}
