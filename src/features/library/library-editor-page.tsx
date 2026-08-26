import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { libraryRepository } from "@/data/repositories/supabase/library-repository";
import { tagRepository } from "@/data/repositories/supabase/tag-repository";
import { getLibraryDefinition, type LibraryKind } from "./library-config";
import { LibraryForm } from "./library-form";
import { mediaRepository } from "@/data/repositories/supabase/media-repository";
import { MediaManager } from "@/features/media/media-manager";
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
  const media = id ? await mediaRepository.list(definition.entityType, id) : [];
  return <><PageHeader title={item ? `编辑${definition.singular}` : `添加${definition.singular}`} description={item ? "编辑文字资料与图片" : "先保存基本信息，再进入编辑页添加图片。"} backHref={item ? `${definition.path}/${id}` : definition.path}/><div className="rounded-2xl border border-border bg-[#050505] p-5 sm:p-7"><LibraryForm kind={kind} item={item ?? undefined} tags={tags} selectedTagIds={selectedTags.map((tag) => tag.id)}/></div>{id && <MediaManager entityType={definition.entityType} entityId={id} items={media}/>}</>;
}
