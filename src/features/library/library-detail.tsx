import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { libraryRepository } from "@/data/repositories/supabase/library-repository";
import { tagRepository } from "@/data/repositories/supabase/tag-repository";
import { tagGroupLabels } from "@/features/tags/tag-types";
import { getLibraryDefinition, type LibraryKind } from "./library-config";
import { DeleteButton } from "./delete-button";
import { buttonStyles } from "@/components/ui/button";
import { mediaRepository } from "@/data/repositories/supabase/media-repository";
import { MediaGallery } from "@/features/media/media-gallery";

function formatValue(name: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (name === "completed_at" && typeof value === "string") return value.slice(0, 10);
  return String(value);
}

export async function LibraryDetail({ kind, id }: { kind: LibraryKind; id: string }) {
  const definition = getLibraryDefinition(kind);
  const [item, tags, media] = await Promise.all([
    libraryRepository.getById(definition.table, id),
    definition.supportsTags ? tagRepository.tagsForEntity(definition.entityType, id) : Promise.resolve([]),
    mediaRepository.list(definition.entityType, id),
  ]);
  if (!item) notFound();
  const title = String(item[definition.titleField]);
  return <><PageHeader title={title} description={definition.singular} backHref={definition.path}/><div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]"><MediaGallery items={media}/><div>{definition.supportsTags && <section className="mb-5 rounded-2xl border border-border bg-surface p-5">{["shape", "style"].map((group) => { const grouped = tags.filter((tag) => tag.tag_group === group); return <div key={group} className="mb-5 last:mb-0"><h2 className="mb-2.5 text-xs text-zinc-500">{tagGroupLabels[group]}</h2><div className="flex flex-wrap gap-2">{grouped.length ? grouped.map((tag) => <span key={tag.id} className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200">{tag.name}</span>) : <span className="text-sm text-zinc-600">—</span>}</div></div>; })}</section>}<dl className="overflow-hidden rounded-2xl border border-border bg-surface">{definition.fields.filter((field) => field.name !== definition.titleField).map((field) => <div key={field.name} className="border-b border-border px-5 py-4 last:border-b-0"><dt className="text-xs text-muted">{field.label}</dt><dd className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-zinc-200">{formatValue(field.name, item[field.name])}</dd></div>)}</dl><div className="mt-5 flex flex-col gap-3 sm:flex-row"><Link href={`${definition.path}/${id}/edit`} className={buttonStyles({ variant: "primary", className: "h-12" })}><Pencil size={16}/>编辑与图片</Link><DeleteButton kind={kind} id={id}/></div></div></div></>;
}
