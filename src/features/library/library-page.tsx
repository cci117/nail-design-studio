/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ImageIcon, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonStyles, floatingAddStyles } from "@/components/ui/button";
import { libraryRepository, type LibraryListQuery, type LibraryRecord } from "@/data/repositories/supabase/library-repository";
import { mediaRepository } from "@/data/repositories/supabase/media-repository";
import { tagRepository } from "@/data/repositories/supabase/tag-repository";
import type { Tag } from "@/features/tags/tag-types";
import { getLibraryDefinition, type LibraryKind } from "./library-config";
import { LibraryFilterControls, type LibraryFilterSelection, type SortOption } from "./library-filter-controls";

export type LibraryFilterParams = Record<string, string | string[] | undefined>;

const sortOptions: Record<LibraryKind, SortOption[]> = {
  inspiration: [{ value: "updated", label: "最近修改" }, { value: "created_desc", label: "最近新增" }, { value: "created_asc", label: "最早新增" }],
  works: [{ value: "completed_desc", label: "最近完成" }, { value: "updated", label: "最近修改" }, { value: "created_desc", label: "最近新增" }],
  assets: [{ value: "updated", label: "最近修改" }, { value: "created_desc", label: "最近新增" }, { value: "name_asc", label: "名称 A-Z" }],
  "favorite-assets": [{ value: "updated", label: "最近修改" }, { value: "created_desc", label: "最近新增" }, { value: "name_asc", label: "名称 A-Z" }],
};

function cardMeta(kind: LibraryKind, item: LibraryRecord) {
  if (kind === "assets") return [item.category, item.brand, item.color].filter((value): value is string => typeof value === "string" && Boolean(value)).join(" · ");
  if (kind === "favorite-assets" && typeof item.category === "string") return item.category;
  return "";
}

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}

function ids(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value.join(",") : value ?? "";
  return [...new Set(raw.split(",").map((item) => item.trim()).filter(Boolean))];
}

function queryString(params: LibraryFilterParams) {
  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const text = Array.isArray(value) ? value.join(",") : value;
    if (text) result.set(key, text);
  }
  return result.toString();
}

function selection(params: LibraryFilterParams, kind: LibraryKind): LibraryFilterSelection {
  const status = first(params.status);
  const stock = first(params.stock);
  return {
    shape: kind === "inspiration" || kind === "works" ? ids(params.shape) : [],
    style: kind === "inspiration" || kind === "works" ? ids(params.style) : [],
    status: status === "active" || status === "draft" ? status : "",
    category: kind === "assets" || kind === "favorite-assets" ? ids(params.category) : [],
    brand: kind === "assets" ? ids(params.brand) : [],
    color: kind === "assets" ? ids(params.color) : [],
    stock: kind === "assets" && (stock === "available" || stock === "empty" || stock === "unknown") ? stock : "",
    completedFrom: kind === "works" && /^\d{4}-\d{2}-\d{2}$/.test(first(params.from)) ? first(params.from) : "",
    completedTo: kind === "works" && /^\d{4}-\d{2}-\d{2}$/.test(first(params.to)) ? first(params.to) : "",
  };
}

function facetFields(kind: LibraryKind) {
  if (kind === "assets") return ["category", "brand", "color"];
  if (kind === "favorite-assets") return ["category"];
  return [];
}

export async function LibraryPage({ kind, searchParams = {} }: { kind: LibraryKind; searchParams?: LibraryFilterParams }) {
  const definition = getLibraryDefinition(kind);
  const selected = selection(searchParams, kind);
  const q = first(searchParams.q).slice(0, 100);
  const availableSorts = sortOptions[kind];
  const requestedSort = first(searchParams.sort);
  const sort = availableSorts.some((option) => option.value === requestedSort) ? requestedSort : availableSorts[0].value;
  const repositoryQuery: LibraryListQuery = {
    q,
    status: selected.status || undefined,
    categories: kind === "assets" || kind === "favorite-assets" ? selected.category : undefined,
    brands: kind === "assets" ? selected.brand : undefined,
    colors: kind === "assets" ? selected.color : undefined,
    stock: kind === "assets" ? selected.stock || undefined : undefined,
    completedFrom: kind === "works" && selected.completedFrom ? `${selected.completedFrom}T00:00:00.000Z` : undefined,
    completedTo: kind === "works" && selected.completedTo ? `${selected.completedTo}T23:59:59.999Z` : undefined,
    sort: sort as LibraryListQuery["sort"],
  };

  let items: LibraryRecord[];
  let tags: Tag[] = [];
  let links: Awaited<ReturnType<typeof tagRepository.links>> = [];
  let facets: Record<string, string[]> = {};
  try {
    [items, tags, facets] = await Promise.all([
      libraryRepository.list(definition.table, repositoryQuery),
      definition.supportsTags ? tagRepository.list() : Promise.resolve([]),
      libraryRepository.facets(definition.table, facetFields(kind)),
    ]);
    if (definition.supportsTags) links = await tagRepository.links(definition.entityType, items.map((item) => item.id));
  } catch {
    return <><PageHeader title={definition.title} description={definition.description}/><section className="rounded-2xl border border-red-950 bg-red-950/20 px-6 py-12 text-center"><h2 className="text-sm font-medium text-red-200">资料加载失败</h2><p className="mt-2 text-sm text-red-300/70">请检查网络后刷新页面。</p></section></>;
  }

  const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
  const itemTagIds = new Map<string, string[]>();
  for (const link of links) itemTagIds.set(link.entity_id, [...(itemTagIds.get(link.entity_id) ?? []), link.tag_id]);
  const tagGroups = { shape: selected.shape, style: selected.style };
  const visibleItems = definition.supportsTags
    ? items.filter((item) => Object.values(tagGroups).every((groupIds) => groupIds.length === 0 || groupIds.some((tagId) => itemTagIds.get(item.id)?.includes(tagId))))
    : items;
  const covers = await mediaRepository.covers(definition.entityType, visibleItems.map((item) => item.id));
  const hasConditions = Boolean(q || Object.values(selected).some((value) => Array.isArray(value) ? value.length : value));

  return <>
    <PageHeader title={definition.title} description={definition.description}/>
    <LibraryFilterControls kind={kind} path={definition.path} queryString={queryString(searchParams)} q={q} sort={sort} sortOptions={availableSorts} tags={tags} selected={selected} facets={facets}/>

    <div className="mt-7">
      {visibleItems.length === 0
        ? <section className="flex min-h-[42vh] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface px-6 text-center"><definition.icon size={25} strokeWidth={1.4} className="text-zinc-500"/><h2 className="mt-5 text-sm font-medium">{hasConditions ? "没有符合条件的内容" : definition.emptyTitle}</h2><p className="mt-2 text-xs text-muted">{hasConditions ? "调整搜索或筛选条件后再试。" : "添加第一条资料开始整理。"}</p>{hasConditions ? <Link href={definition.path} className={buttonStyles({ variant: "secondary", className: "mt-6" })}>清除筛选</Link> : <Link href={`${definition.path}/new`} className={buttonStyles({ className: "mt-6" })}>添加{definition.singular}</Link>}</section>
        : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{visibleItems.map((item) => {
          const draft = item.status === "draft";
          const title = draft ? definition.singular : String(item[definition.titleField] ?? definition.singular);
          const itemTags = (itemTagIds.get(item.id) ?? []).map((id) => tagsById.get(id)).filter((tag): tag is Tag => Boolean(tag)).slice(0, 3);
          const meta = draft ? "" : itemTags.length ? itemTags.map((tag) => tag.name).join(" · ") : cardMeta(kind, item);
          const cover = covers.get(item.id);
          const href = draft ? `${definition.path}/${item.id}/edit?stage=${cover ? "details" : "media"}` : `${definition.path}/${item.id}`;
          return <Link key={item.id} href={href} className="group overflow-hidden rounded-2xl border border-border bg-surface transition active:scale-[0.99] sm:hover:border-zinc-600"><div className="flex aspect-square items-center justify-center overflow-hidden border-b border-border bg-[#070708] text-zinc-700">{cover ? <img src={cover} alt="" className="h-full w-full object-cover"/> : <ImageIcon size={24} strokeWidth={1.3}/>}</div><div className="min-h-20 p-3.5"><div className="flex items-start justify-between gap-2"><h2 className="line-clamp-2 text-sm font-medium leading-5 text-zinc-100">{title}</h2>{draft && <span className="shrink-0 rounded-full border border-amber-800/80 bg-amber-950/40 px-2 py-1 text-[10px] font-medium text-amber-200">待完善</span>}</div>{meta && <p className="mt-1.5 truncate text-xs text-zinc-400">{meta}</p>}</div></Link>;
        })}</div>}
    </div>
    <Link href={`${definition.path}/new`} className={floatingAddStyles()}><Plus size={21} strokeWidth={2.5}/><span>添加{definition.singular}</span></Link>
  </>;
}
