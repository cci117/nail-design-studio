/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ImageIcon, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { libraryRepository, type LibraryRecord } from "@/data/repositories/supabase/library-repository";
import { tagRepository } from "@/data/repositories/supabase/tag-repository";
import { TagFilter } from "@/features/tags/tag-filter";
import type { Tag } from "@/features/tags/tag-types";
import { getLibraryDefinition, type LibraryKind } from "./library-config";
import { buttonStyles } from "@/components/ui/button";
import { mediaRepository } from "@/data/repositories/supabase/media-repository";

export type LibraryFilterParams = Record<string, string | string[] | undefined>;

function cardMeta(kind: LibraryKind, item: LibraryRecord) {
  if (kind === "assets") return [item.category, item.brand, item.color].filter((value): value is string => typeof value === "string" && Boolean(value)).join(" · ");
  if (kind === "favorite-assets" && typeof item.category === "string") return item.category;
  return "";
}

function ids(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value.join(",") : value ?? "";
  return [...new Set(raw.split(",").filter(Boolean))];
}

export async function LibraryPage({ kind, searchParams = {} }: { kind: LibraryKind; searchParams?: LibraryFilterParams }) {
  const definition = getLibraryDefinition(kind);
  let items: LibraryRecord[];
  let tags: Tag[] = [];
  let links: Awaited<ReturnType<typeof tagRepository.links>> = [];
  let covers = new Map<string, string>();
  try {
    items = await libraryRepository.list(definition.table);
    if (definition.supportsTags) {
      [tags, links] = await Promise.all([tagRepository.list(), tagRepository.links(definition.entityType, items.map((item) => item.id))]);
    }
    covers = await mediaRepository.covers(definition.entityType, items.map((item) => item.id));
  } catch {
    return <><PageHeader title={definition.title} description={definition.description}/><section className="rounded-2xl border border-red-950 bg-red-950/20 px-6 py-12 text-center"><h2 className="text-sm font-medium text-red-200">资料加载失败</h2><p className="mt-2 text-sm text-red-300/70">请检查网络后刷新页面。</p></section></>;
  }

  const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
  const itemTagIds = new Map<string, string[]>();
  for (const link of links) itemTagIds.set(link.entity_id, [...(itemTagIds.get(link.entity_id) ?? []), link.tag_id]);
  const selected = { shape: ids(searchParams.shape), style: ids(searchParams.style) };
  const visibleItems = definition.supportsTags ? items.filter((item) => Object.values(selected).every((groupIds) => groupIds.length === 0 || groupIds.some((tagId) => itemTagIds.get(item.id)?.includes(tagId)))) : items;

  return <><PageHeader title={definition.title} description={definition.description}/><div className="mb-3 flex gap-2"><button type="button" aria-label="搜索（即将开放）" title="搜索即将开放" className={buttonStyles({ variant: "secondary", className: "h-11 flex-1 justify-start" })}><Search size={17}/><span>搜索</span></button></div>{definition.supportsTags && <TagFilter path={definition.path} tags={tags} selected={selected}/>} {visibleItems.length === 0 ? <section className="flex min-h-[45vh] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface px-6 text-center"><definition.icon size={25} strokeWidth={1.4} className="text-zinc-500"/><h2 className="mt-5 text-sm font-medium">{items.length ? "没有符合筛选的内容" : definition.emptyTitle}</h2><p className="mt-2 text-xs text-muted">{items.length ? "调整标签筛选后再试。" : "添加第一条资料开始整理。"}</p>{!items.length && <Link href={`${definition.path}/new`} className={buttonStyles({ className: "mt-6" })}>添加{definition.singular}</Link>}</section> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{visibleItems.map((item) => { const title = String(item[definition.titleField] ?? definition.singular); const itemTags = (itemTagIds.get(item.id) ?? []).map((id) => tagsById.get(id)).filter((tag): tag is Tag => Boolean(tag)).slice(0, 3); const meta = itemTags.length ? itemTags.map((tag) => tag.name).join(" · ") : cardMeta(kind, item); const cover = covers.get(item.id); return <Link key={item.id} href={`${definition.path}/${item.id}`} className="group overflow-hidden rounded-2xl border border-border bg-surface transition active:scale-[0.99] sm:hover:border-zinc-600"><div className="flex aspect-square items-center justify-center overflow-hidden border-b border-border bg-[#070708] text-zinc-700">{cover ? <img src={cover} alt="" className="h-full w-full object-cover"/> : <ImageIcon size={24} strokeWidth={1.3}/>}</div><div className="min-h-20 p-3.5"><h2 className="line-clamp-2 text-sm font-medium leading-5 text-zinc-100">{title}</h2>{meta && <p className="mt-1.5 truncate text-xs text-zinc-400">{meta}</p>}</div></Link>; })}</div>}<Link href={`${definition.path}/new`} className={buttonStyles({ className: "fixed bottom-24 right-5 z-30 min-h-14 rounded-full px-5 shadow-[0_8px_28px_rgba(255,255,255,0.22)] md:bottom-8 md:right-8" })}><Plus size={21} strokeWidth={2.5}/><span>添加{definition.singular}</span></Link></>;
}
