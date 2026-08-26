import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { libraryRepository } from "@/data/repositories/supabase/library-repository";
import { tagRepository } from "@/data/repositories/supabase/tag-repository";
import { getLibraryDefinition, type LibraryKind } from "./library-config";
import { LibraryForm } from "./library-form";
export async function LibraryEditorPage({ kind, id }: { kind: LibraryKind; id?: string }) {
  const definition = getLibraryDefinition(kind);
  const item = id ? await libraryRepository.getById(definition.table, id) : undefined;
  if (id && !item) notFound();
  const [tags, selectedTags] = definition.supportsTags
    ? await Promise.all([
        tagRepository.list(),
        id ? tagRepository.tagsForEntity(definition.entityType, id) : Promise.resolve([]),
      ])
    : [[], []];
  return <><PageHeader title={item ? `编辑${definition.singular}` : `添加${definition.singular}`} description="保存文字资料，图片功能将在下一版本开放。" backHref={item ? `${definition.path}/${id}` : definition.path}/><div className="rounded-2xl border border-border bg-[#050505] p-5 sm:p-7"><LibraryForm kind={kind} item={item ?? undefined} tags={tags} selectedTagIds={selectedTags.map((tag) => tag.id)}/></div></>;
}
