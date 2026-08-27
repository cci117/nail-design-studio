"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { chipStyles } from "@/components/ui/button";
import type { LibraryRecord } from "@/data/repositories/supabase/library-repository";
import type { WorkChangeReason, WorkRestorationLevel } from "@/types/domain";
import { changeReasonLabels, changeReasonValues, restorationLabels, type DesignVersionChoice, type WorkAssetChoice } from "./work-types";

export function WorkOutcomeFields({ item, designVersions, assets, initialAssetIds }: { item?: LibraryRecord; designVersions: DesignVersionChoice[]; assets: WorkAssetChoice[]; initialAssetIds: string[] }) {
  const [selectedAssets, setSelectedAssets] = useState(initialAssetIds);
  const [reasons, setReasons] = useState<WorkChangeReason[]>(Array.isArray(item?.change_reasons) ? item.change_reasons as WorkChangeReason[] : []);
  const restoration = typeof item?.restoration_level === "string" ? item.restoration_level as WorkRestorationLevel : "";
  const sourceId = typeof item?.source_design_version_id === "string" ? item.source_design_version_id : "";
  const toggle = (values: string[], id: string) => values.includes(id) ? values.filter((value) => value !== id) : [...values, id];

  return <div className="space-y-7 border-t border-border pt-7">
    <input type="hidden" name="work_outcome_loaded" value="true"/>
    <section>
      <h2 className="flex items-center gap-2 text-sm font-medium"><Sparkles className="size-4 text-accent"/>来源设计</h2>
      <p className="mt-1 text-xs text-muted">独立创作可不选择</p>
      <select name="source_design_version_id" defaultValue={sourceId} className="mt-3 h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground focus:border-accent focus:outline-none">
        <option value="">无来源设计</option>
        {designVersions.map((choice) => <option key={choice.id} value={choice.id}>{choice.designTitle} · 版本 {choice.versionNumber}</option>)}
      </select>
    </section>

    <section>
      <h2 className="text-sm font-medium">实际使用材料</h2>
      <p className="mt-1 text-xs text-muted">记录制作时真正使用的材料</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {assets.map((asset) => { const selected = selectedAssets.includes(asset.id); return <button key={asset.id} type="button" aria-pressed={selected} onClick={() => setSelectedAssets((current) => toggle(current, asset.id))} className={chipStyles(selected)}>{selected && <Check className="size-3.5"/>}{asset.name}{asset.color ? ` · ${asset.color}` : ""}</button>; })}
        {!assets.length && <span className="text-sm text-muted">材料库暂无可选材料</span>}
      </div>
      {selectedAssets.map((id) => <input key={id} type="hidden" name="asset_ids" value={id}/>)}
    </section>

    <section>
      <h2 className="text-sm font-medium">制作反馈</h2>
      <label className="mt-3 block text-xs font-medium text-muted">还原程度
        <select name="restoration_level" defaultValue={restoration} className="mt-2 h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground focus:border-accent focus:outline-none">
          <option value="">暂不记录</option>
          {(Object.keys(restorationLabels) as WorkRestorationLevel[]).map((value) => <option key={value} value={value}>{restorationLabels[value]}</option>)}
        </select>
      </label>
      <div className="mt-5">
        <p className="text-xs font-medium text-muted">修改原因（可多选）</p>
        <div className="mt-3 flex flex-wrap gap-2">{changeReasonValues.map((reason) => { const selected = reasons.includes(reason); return <button key={reason} type="button" aria-pressed={selected} onClick={() => setReasons((current) => toggle(current, reason) as WorkChangeReason[])} className={chipStyles(selected)}>{selected && <Check className="size-3.5"/>}{changeReasonLabels[reason]}</button>; })}</div>
        {reasons.map((reason) => <input key={reason} type="hidden" name="change_reasons" value={reason}/>)}
      </div>
      <label className="mt-5 block text-xs font-medium text-muted">反馈备注
        <textarea name="feedback_notes" defaultValue={typeof item?.feedback_notes === "string" ? item.feedback_notes : ""} maxLength={4000} rows={4} placeholder="记录设计与成品之间的调整" className="mt-2 min-h-28 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-foreground placeholder:text-muted focus:border-accent focus:outline-none"/>
      </label>
    </section>
  </div>;
}
