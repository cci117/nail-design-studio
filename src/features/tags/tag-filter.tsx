import Link from "next/link";
import { Filter, X } from "lucide-react";
import type { Tag } from "./tag-types";
import { tagGroupLabels } from "./tag-types";
import { buttonStyles, chipStyles } from "@/components/ui/button";

type TagFilterProps = { path: string; tags: Tag[]; selected: Record<string, string[]> };

function href(path: string, selected: Record<string, string[]>, group: string, id: string) {
  const next = new Set(selected[group] ?? []);
  if (next.has(id)) next.delete(id); else next.add(id);
  const params = new URLSearchParams();
  for (const [key, ids] of Object.entries({ ...selected, [group]: [...next] })) if (ids.length) params.set(key, ids.join(","));
  return params.size ? `${path}?${params}` : path;
}

export function TagFilter({ path, tags, selected }: TagFilterProps) {
  const activeCount = Object.values(selected).reduce((count, ids) => count + ids.length, 0);
  return <details className="mb-7 rounded-2xl border border-[#3a3a3a] bg-surface"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-medium text-white active:bg-[#1a1a1a]"><span className="flex items-center gap-2"><Filter className="size-4"/>筛选{activeCount > 0 && <span className="rounded-full bg-[#f5f5f5] px-2 py-0.5 text-xs font-medium text-black">{activeCount}</span>}</span><span className="text-xs text-zinc-300">甲型 · 风格</span></summary><div className="space-y-5 border-t border-[#3a3a3a] p-4">{["shape", "style"].map((group) => <div key={group}><p className="mb-3 text-xs font-medium text-zinc-300">{tagGroupLabels[group]}</p><div className="flex flex-wrap gap-2">{tags.filter((tag) => tag.tag_group === group).map((tag) => { const active = selected[group]?.includes(tag.id); return <Link key={tag.id} href={href(path, selected, group, tag.id)} scroll={false} className={chipStyles(active)}>{tag.name}</Link>; })}{!tags.some((tag) => tag.tag_group === group) && <span className="text-sm text-zinc-400">暂无标签</span>}</div></div>)}{activeCount > 0 && <Link href={path} className={buttonStyles({ variant: "ghost", size: "compact" })}><X className="size-4"/>清除筛选</Link>}</div></details>;
}
