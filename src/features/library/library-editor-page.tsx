import Link from "next/link";
import { ArrowRight, Images } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { buttonStyles } from "@/components/ui/button";
import { libraryRepository } from "@/data/repositories/supabase/library-repository";
import { tagRepository } from "@/data/repositories/supabase/tag-repository";
import { mediaRepository } from "@/data/repositories/supabase/media-repository";
import { MediaGallery } from "@/features/media/media-gallery";
import { MediaManager } from "@/features/media/media-manager";
import { getLibraryDefinition, type LibraryKind } from "./library-config";
import { LibraryForm } from "./library-form";
import { workOutcomeRepository } from "@/data/repositories/supabase/work-outcome-repository";

export async function LibraryEditorPage({ kind, id, stage = "media" }: { kind: LibraryKind; id: string; stage?: "media" | "details" }) {
  const definition = getLibraryDefinition(kind);
  const item = await libraryRepository.getById(definition.table, id);
  if (!item) notFound();

  const [tags, selectedTags, media] = await Promise.all([
    definition.supportsTags ? tagRepository.list() : Promise.resolve([]),
    definition.supportsTags ? tagRepository.tagsForEntity(definition.entityType, id) : Promise.resolve([]),
    mediaRepository.list(definition.entityType, id),
  ]);
  const draft = item.status === "draft";
  let designVersions: Awaited<ReturnType<typeof workOutcomeRepository.designVersionChoices>> = [];
  let assets: Awaited<ReturnType<typeof workOutcomeRepository.assetChoices>> = [];
  let selectedAssetIds: string[] = [];
  let workOutcomeReady = true;

  // The image-first draft stage does not need outcome metadata. Optional
  // V0.3.1 lookups must never make an existing work route unavailable.
  if (kind === "works" && (!draft || stage === "details")) {
    const [versionsResult, assetsResult, selectedAssetsResult] = await Promise.allSettled([
      workOutcomeRepository.designVersionChoices(),
      workOutcomeRepository.assetChoices(),
      workOutcomeRepository.assetIds(id),
    ]);
    if (versionsResult.status === "fulfilled") designVersions = versionsResult.value;
    if (assetsResult.status === "fulfilled") assets = assetsResult.value;
    if (selectedAssetsResult.status === "fulfilled") selectedAssetIds = selectedAssetsResult.value;
    workOutcomeReady = versionsResult.status === "fulfilled" && assetsResult.status === "fulfilled" && selectedAssetsResult.status === "fulfilled";
  }

  if (draft && (stage === "media" || media.length === 0)) {
    return <>
      <PageHeader title={`添加${definition.singular}`} description="先保存图片" backHref={definition.path}/>
      <MediaManager entityType={definition.entityType} entityId={id} items={media}/>
      <div className="mt-5 rounded-2xl border border-[#303030] bg-[#080808] p-4">
        {media.length > 0
          ? <Link href={`${definition.path}/${id}/edit?stage=details`} className={buttonStyles({ className: "h-12 w-full" })}>继续填写资料<ArrowRight className="size-4"/></Link>
          : <span aria-disabled="true" className={buttonStyles({ className: "h-12 w-full", }) + " pointer-events-none !border-[#3a3a3a] !bg-[#242424] !text-[#b8b8b8]"}>上传图片后继续<ArrowRight className="size-4"/></span>}
        <p className="mt-3 text-center text-xs text-zinc-400">草稿已保存，稍后可继续完善</p>
      </div>
    </>;
  }

  if (draft) {
    return <>
      <PageHeader title={`完善${definition.singular}`} description="补充资料并完成" backHref={definition.path}/>
      <section className="mb-6 rounded-2xl border border-[#303030] bg-[#050505] p-4 sm:p-6">
        <MediaGallery items={media}/>
        <Link href={`${definition.path}/${id}/edit?stage=media`} className={buttonStyles({ variant: "secondary", className: "mt-4 h-12 w-full" })}><Images className="size-4"/>管理图片</Link>
      </section>
      <div className="rounded-2xl border border-border bg-[#050505] p-5 sm:p-7">
        <LibraryForm kind={kind} item={item} tags={tags} selectedTagIds={selectedTags.map((tag) => tag.id)} designVersions={designVersions} assets={assets} selectedAssetIds={selectedAssetIds} workOutcomeReady={workOutcomeReady}/>
      </div>
    </>;
  }

  return <>
    <PageHeader title={`编辑${definition.singular}`} description="编辑文字资料与图片" backHref={`${definition.path}/${id}`}/>
    <div className="rounded-2xl border border-border bg-[#050505] p-5 sm:p-7">
      <LibraryForm kind={kind} item={item} tags={tags} selectedTagIds={selectedTags.map((tag) => tag.id)} designVersions={designVersions} assets={assets} selectedAssetIds={selectedAssetIds} workOutcomeReady={workOutcomeReady}/>
    </div>
    <MediaManager entityType={definition.entityType} entityId={id} items={media}/>
  </>;
}
