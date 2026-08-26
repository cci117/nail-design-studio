"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Search, SlidersHorizontal, X } from "lucide-react";
import { buttonStyles, chipStyles } from "@/components/ui/button";
import type { Tag } from "@/features/tags/tag-types";
import { tagGroupLabels } from "@/features/tags/tag-types";
import type { LibraryKind } from "./library-config";

export interface LibraryFilterSelection {
  shape: string[];
  style: string[];
  status: "" | "active" | "draft";
  category: string[];
  brand: string[];
  color: string[];
  stock: "" | "available" | "empty" | "unknown";
  completedFrom: string;
  completedTo: string;
}

export interface SortOption { value: string; label: string }

type Props = {
  kind: LibraryKind;
  path: string;
  queryString: string;
  q: string;
  sort: string;
  sortOptions: SortOption[];
  tags: Tag[];
  selected: LibraryFilterSelection;
  facets: Record<string, string[]>;
};

const filterKeys = ["shape", "style", "status", "category", "brand", "color", "stock", "from", "to"];

function setList(params: URLSearchParams, key: string, values: string[]) {
  if (values.length) params.set(key, values.join(",")); else params.delete(key);
}

function filterCount(selected: LibraryFilterSelection) {
  return selected.shape.length + selected.style.length + selected.category.length + selected.brand.length + selected.color.length
    + (selected.status ? 1 : 0) + (selected.stock ? 1 : 0) + (selected.completedFrom ? 1 : 0) + (selected.completedTo ? 1 : 0);
}

export function LibraryFilterControls({ kind, path, queryString, q, sort, sortOptions, tags, selected, facets }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(selected);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  function navigate(params: URLSearchParams) {
    const query = params.toString();
    router.push(query ? `${path}?${query}` : path, { scroll: false });
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = String(form.get("q") ?? "").trim();
    const params = new URLSearchParams(queryString);
    if (value) params.set("q", value); else params.delete("q");
    navigate(params);
  }

  function apply() {
    const params = new URLSearchParams(queryString);
    filterKeys.forEach((key) => params.delete(key));
    setList(params, "shape", draft.shape);
    setList(params, "style", draft.style);
    setList(params, "category", draft.category);
    setList(params, "brand", draft.brand);
    setList(params, "color", draft.color);
    if (draft.status) params.set("status", draft.status);
    if (draft.stock) params.set("stock", draft.stock);
    if (draft.completedFrom) params.set("from", draft.completedFrom);
    if (draft.completedTo) params.set("to", draft.completedTo);
    setOpen(false);
    navigate(params);
  }

  function openFilters() {
    setDraft(selected);
    setOpen(true);
  }

  function remove(key: keyof LibraryFilterSelection, value?: string) {
    const params = new URLSearchParams(queryString);
    if (Array.isArray(selected[key]) && value) {
      const next = (selected[key] as string[]).filter((item) => item !== value);
      setList(params, key, next);
    } else params.delete(key === "completedFrom" ? "from" : key === "completedTo" ? "to" : key);
    navigate(params);
  }

  function toggleList(key: "shape" | "style" | "category" | "brand" | "color", value: string) {
    setDraft((current) => {
      const values = current[key];
      return { ...current, [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] };
    });
  }

  const tagsById = new Map(tags.map((tag) => [tag.id, tag.name]));
  const active: Array<{ key: keyof LibraryFilterSelection; value?: string; label: string }> = [
    ...selected.shape.map((value) => ({ key: "shape" as const, value, label: tagsById.get(value) ?? "甲型" })),
    ...selected.style.map((value) => ({ key: "style" as const, value, label: tagsById.get(value) ?? "风格" })),
    ...selected.category.map((value) => ({ key: "category" as const, value, label: value })),
    ...selected.brand.map((value) => ({ key: "brand" as const, value, label: value })),
    ...selected.color.map((value) => ({ key: "color" as const, value, label: value })),
    ...(selected.status ? [{ key: "status" as const, label: selected.status === "active" ? "正式" : "待完善" }] : []),
    ...(selected.stock ? [{ key: "stock" as const, label: selected.stock === "available" ? "有库存" : selected.stock === "empty" ? "无库存" : "库存未记录" }] : []),
    ...(selected.completedFrom ? [{ key: "completedFrom" as const, label: `从 ${selected.completedFrom}` }] : []),
    ...(selected.completedTo ? [{ key: "completedTo" as const, label: `至 ${selected.completedTo}` }] : []),
  ];

  return <>
    <form onSubmit={search} className="flex gap-2">
      <label className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-300"/>
        <input key={q} name="q" type="search" defaultValue={q} placeholder="搜索" className="h-12 w-full rounded-xl border border-[#4a4a4a] bg-[#111] pl-11 pr-4 text-sm text-white placeholder:text-zinc-400 focus:border-zinc-300 focus:outline-none"/>
      </label>
      <button type="submit" className={buttonStyles({ size: "compact", className: "h-12" })}>搜索</button>
    </form>

    <div className="mt-3 grid grid-cols-2 gap-2">
      <label className={buttonStyles({ variant: "secondary", className: "relative h-12 justify-start px-3" })}>
        <ArrowUpDown className="size-4 shrink-0"/>
        <span className="sr-only">排序</span>
        <select aria-label="排序" value={sort} onChange={(event) => { const params = new URLSearchParams(queryString); params.set("sort", event.target.value); navigate(params); }} className="min-w-0 flex-1 appearance-none bg-transparent text-sm font-medium text-white outline-none">
          {sortOptions.map((option) => <option key={option.value} value={option.value} className="bg-[#1a1a1a] text-white">{option.label}</option>)}
        </select>
      </label>
      <button type="button" onClick={openFilters} className={buttonStyles({ variant: "secondary", className: "h-12" })}><SlidersHorizontal className="size-4"/>筛选{filterCount(selected) > 0 && <span className="rounded-full bg-white px-2 py-0.5 text-xs text-black">{filterCount(selected)}</span>}</button>
    </div>

    {active.length > 0 && <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
      {active.map((item) => <button key={`${item.key}-${item.value ?? "single"}`} type="button" onClick={() => remove(item.key, item.value)} className={chipStyles(false, "min-h-10 shrink-0 px-3 text-xs")}>{item.label}<X className="size-3.5"/></button>)}
    </div>}

    {open && <div className="fixed inset-0 z-[65]">
      <button type="button" aria-label="关闭筛选" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/75"/>
      <section role="dialog" aria-modal="true" aria-label="筛选" className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-3xl border-t border-[#4a4a4a] bg-[#0a0a0a] pt-2">
        <div className="flex min-h-14 items-center justify-between border-b border-[#303030] px-5">
          <h2 className="font-medium text-white">筛选</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="关闭" className={buttonStyles({ variant: "ghost", size: "icon", className: "rounded-full" })}><X className="size-5"/></button>
        </div>
        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-6">
          <SingleChoice title="状态" value={draft.status} options={[["", "全部"], ["active", "正式"], ["draft", "待完善"]]} onChange={(value) => setDraft((current) => ({ ...current, status: value as LibraryFilterSelection["status"] }))}/>
          {(kind === "inspiration" || kind === "works") && ["shape", "style"].map((group) => <MultiChoice key={group} title={tagGroupLabels[group]} values={draft[group as "shape" | "style"]} options={tags.filter((tag) => tag.tag_group === group).map((tag) => [tag.id, tag.name])} onToggle={(value) => toggleList(group as "shape" | "style", value)}/>)}
          {(kind === "favorite-assets" || kind === "assets") && <MultiChoice title="分类" values={draft.category} options={(facets.category ?? []).map((value) => [value, value])} onToggle={(value) => toggleList("category", value)}/>}
          {kind === "assets" && <>
            <MultiChoice title="品牌" values={draft.brand} options={(facets.brand ?? []).map((value) => [value, value])} onToggle={(value) => toggleList("brand", value)}/>
            <MultiChoice title="颜色" values={draft.color} options={(facets.color ?? []).map((value) => [value, value])} onToggle={(value) => toggleList("color", value)}/>
            <SingleChoice title="库存" value={draft.stock} options={[["", "全部"], ["available", "有库存"], ["empty", "无库存"], ["unknown", "未记录"]]} onChange={(value) => setDraft((current) => ({ ...current, stock: value as LibraryFilterSelection["stock"] }))}/>
          </>}
          {kind === "works" && <div><p className="mb-3 text-xs font-medium text-zinc-300">完成日期</p><div className="grid grid-cols-2 gap-3"><label className="text-xs text-zinc-400">开始<input type="date" value={draft.completedFrom} onChange={(event) => setDraft((current) => ({ ...current, completedFrom: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-[#4a4a4a] bg-[#151515] px-3 text-sm text-white"/></label><label className="text-xs text-zinc-400">结束<input type="date" value={draft.completedTo} onChange={(event) => setDraft((current) => ({ ...current, completedTo: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-[#4a4a4a] bg-[#151515] px-3 text-sm text-white"/></label></div></div>}
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-[#303030] bg-[#0a0a0a] px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button type="button" onClick={() => setDraft({ shape: [], style: [], status: "", category: [], brand: [], color: [], stock: "", completedFrom: "", completedTo: "" })} className={buttonStyles({ variant: "secondary", className: "h-12" })}>重置</button>
          <button type="button" onClick={apply} className={buttonStyles({ className: "h-12" })}>确定（{filterCount(draft)}）</button>
        </div>
      </section>
    </div>}
  </>;
}

function MultiChoice({ title, values, options, onToggle }: { title: string; values: string[]; options: string[][]; onToggle: (value: string) => void }) {
  return <div><p className="mb-3 text-xs font-medium text-zinc-300">{title}</p><div className="flex flex-wrap gap-2">{options.length ? options.map(([value, label]) => <button key={value} type="button" onClick={() => onToggle(value)} className={chipStyles(values.includes(value))}>{label}</button>) : <span className="text-sm text-zinc-500">暂无可选项</span>}</div></div>;
}

function SingleChoice({ title, value, options, onChange }: { title: string; value: string; options: string[][]; onChange: (value: string) => void }) {
  return <div><p className="mb-3 text-xs font-medium text-zinc-300">{title}</p><div className="flex flex-wrap gap-2">{options.map(([option, label]) => <button key={option || "all"} type="button" onClick={() => onChange(option)} className={chipStyles(value === option)}>{label}</button>)}</div></div>;
}
