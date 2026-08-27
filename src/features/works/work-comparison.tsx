"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { Columns2, SlidersHorizontal } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import type { DesignStructuredData } from "@/features/design/design-types";
import { DesignPlanPreview } from "./design-plan-preview";

type Side = { label: string; imageUrl?: string; plan?: DesignStructuredData };
type Pair = { id: string; label: string; left: Side; right: Side };

function Visual({ side }: { side: Side }) {
  if (side.imageUrl) return <div className="relative h-full min-h-64 overflow-hidden rounded-2xl border border-border bg-black"><img src={side.imageUrl} alt={side.label} className="h-full w-full object-contain"/><span className="absolute left-2 top-2 rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-medium text-white">{side.label}</span></div>;
  if (side.plan) return <DesignPlanPreview data={side.plan}/>;
  return <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted">暂无{side.label}</div>;
}

export function WorkComparison({ design, pressOnUrl, wornUrl }: { design?: Side; pressOnUrl?: string; wornUrl?: string }) {
  const pairs: Pair[] = [];
  if (design && pressOnUrl) pairs.push({ id: "design-press", label: "设计 vs 甲片", left: design, right: { label: "甲片成品", imageUrl: pressOnUrl } });
  if (pressOnUrl && wornUrl) pairs.push({ id: "press-worn", label: "甲片 vs 上手", left: { label: "甲片成品", imageUrl: pressOnUrl }, right: { label: "上手效果", imageUrl: wornUrl } });
  if (design && wornUrl) pairs.push({ id: "design-worn", label: "设计 vs 上手", left: design, right: { label: "上手效果", imageUrl: wornUrl } });
  const [pairId, setPairId] = useState(pairs[0]?.id ?? "");
  const [mode, setMode] = useState<"side" | "slider">("side");
  const [split, setSplit] = useState(50);
  const pair = pairs.find((item) => item.id === pairId) ?? pairs[0];
  if (!pair) return <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">关联来源设计并将作品图片分类为“甲片成品”后，可进行对比。</p>;

  return <div>
    <div className="mb-4 flex flex-wrap gap-2">{pairs.map((item) => <button key={item.id} type="button" onClick={() => setPairId(item.id)} className={buttonStyles({ variant: item.id === pair.id ? "primary" : "secondary", size: "compact", className: item.id === pair.id ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : "" })}>{item.label}</button>)}</div>
    <div className="mb-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => setMode("side")} className={buttonStyles({ variant: mode === "side" ? "primary" : "secondary", size: "compact" })}><Columns2 className="size-4"/>左右并排</button><button type="button" onClick={() => setMode("slider")} className={buttonStyles({ variant: mode === "slider" ? "primary" : "secondary", size: "compact" })}><SlidersHorizontal className="size-4"/>滑杆对比</button></div>
    {mode === "side" ? <div className="grid gap-3 sm:grid-cols-2"><Visual side={pair.left}/><Visual side={pair.right}/></div> : <div>
      <div className="relative min-h-72 overflow-hidden rounded-2xl bg-surface">
        <div className="absolute inset-0"><Visual side={pair.left}/></div>
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${split}%)` }}><Visual side={pair.right}/></div>
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-accent" style={{ left: `${split}%` }}/>
      </div>
      <label className="mt-3 block text-xs font-medium text-muted">对比位置
        <input type="range" min="5" max="95" value={split} onChange={(event) => setSplit(Number(event.target.value))} className="mt-2 h-11 w-full accent-[var(--accent)]"/>
      </label>
    </div>}
  </div>;
}
