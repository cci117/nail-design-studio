import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Pencil, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonStyles } from "@/components/ui/button";
import { libraryRepository } from "@/data/repositories/supabase/library-repository";
import { mediaRepository } from "@/data/repositories/supabase/media-repository";
import { tagRepository } from "@/data/repositories/supabase/tag-repository";
import { workOutcomeRepository } from "@/data/repositories/supabase/work-outcome-repository";
import { MediaGallery } from "@/features/media/media-gallery";
import { tagGroupLabels } from "@/features/tags/tag-types";
import type { Work, WorkChangeReason, WorkRestorationLevel, WorkMediaKind } from "@/types/domain";
import { DeleteButton } from "@/features/library/delete-button";
import { changeReasonLabels, restorationLabels } from "./work-types";
import { WorkComparison } from "./work-comparison";

const mediaLabels: Record<WorkMediaKind, string> = { press_on: "甲片成品", worn: "上手效果", detail: "细节", other: "其他图片" };

export async function WorkDetail({ id }: { id: string }) {
  const item = await libraryRepository.getById("works", id) as Work | null;
  if (!item) notFound();
  const [tags, media] = await Promise.all([
    tagRepository.tagsForEntity("work", id),
    mediaRepository.list("work", id),
  ]);
  if (item.status === "draft") redirect(`/works/${id}/edit?stage=${media.length ? "details" : "media"}`);
  const [assetsResult, sourceResult] = await Promise.allSettled([
    workOutcomeRepository.assetsForWork(id),
    item.source_design_version_id ? workOutcomeRepository.sourceVersion(item.source_design_version_id) : Promise.resolve(null),
  ]);
  const assets = assetsResult.status === "fulfilled" ? assetsResult.value : [];
  const source = sourceResult.status === "fulfilled" ? sourceResult.value : null;
  const designMediaResult = source ? await Promise.allSettled([mediaRepository.list("design_version", source.version.id)]) : [];
  const designMedia = designMediaResult[0]?.status === "fulfilled" ? designMediaResult[0].value : [];
  const designImage = designMedia.find((entry) => entry.role === "cover")?.signedUrl ?? designMedia[0]?.signedUrl;
  const grouped = (kind: WorkMediaKind) => media.filter((entry) => kind === "other" ? entry.work_media_kind === "other" || entry.work_media_kind === null : entry.work_media_kind === kind);
  const pressOn = grouped("press_on");
  const worn = grouped("worn");
  const feedbackReasons = (item.change_reasons ?? []) as WorkChangeReason[];

  return <><PageHeader title={item.title ?? "作品"} description="作品" backHref="/works"/>
    <div className="space-y-7">
      <section><h2 className="mb-3 text-lg font-semibold">成品</h2><div className="grid gap-6 lg:grid-cols-2">{(["press_on", "worn", "detail", "other"] as WorkMediaKind[]).map((kind) => { const items = grouped(kind); return items.length ? <div key={kind}><h3 className="mb-2 text-sm font-medium text-muted">{mediaLabels[kind]}</h3><MediaGallery items={items}/></div> : null; })}</div>{!media.length && <MediaGallery items={[]}/>}<p className="mt-3 text-xs text-muted">甲片成品是主要完成形态；上手效果为可选记录。</p></section>

      <section className="rounded-2xl border border-accent/30 bg-surface p-5"><h2 className="flex items-center gap-2 font-medium"><Sparkles className="size-4 text-accent"/>来源设计</h2>{source ? <div className="mt-3"><p className="font-medium">{source.design.title}</p><p className="mt-1 text-xs text-muted">版本 {source.version.version_number} · {source.version.version_type}</p><Link href={`/designs/${source.design.id}`} className={buttonStyles({ variant: "secondary", size: "compact", className: "mt-3" })}>查看设计</Link></div> : <p className="mt-3 text-sm text-muted">独立创作 · 未关联来源设计</p>}</section>

      <section className="rounded-2xl border border-border bg-surface p-5"><h2 className="font-medium">标签</h2>{(["shape", "style"] as const).map((group) => { const groupedTags = tags.filter((tag) => tag.tag_group === group); return <div key={group} className="mt-4"><h3 className="text-xs text-muted">{tagGroupLabels[group]}</h3><div className="mt-2 flex flex-wrap gap-2">{groupedTags.length ? groupedTags.map((tag) => <span key={tag.id} className="rounded-full border border-border bg-surface-raised px-3 py-2 text-sm">{tag.name}</span>) : <span className="text-sm text-muted">—</span>}</div></div>; })}</section>

      <section className="rounded-2xl border border-border bg-surface p-5"><h2 className="font-medium">实际使用材料</h2><div className="mt-3 flex flex-wrap gap-2">{assets.length ? assets.map((asset) => <span key={asset.id} className="rounded-full border border-border bg-surface-raised px-3 py-2 text-sm font-medium">{asset.name}{asset.color ? ` · ${asset.color}` : ""}</span>) : <span className="text-sm text-muted">暂未记录</span>}</div></section>

      <section className="rounded-2xl border border-border bg-surface p-5"><h2 className="font-medium">对比</h2><div className="mt-4"><WorkComparison design={source ? { label: designImage ? "设计图" : "设计方案预览", imageUrl: designImage, plan: source.version.structured_data as never } : undefined} pressOnUrl={pressOn[0]?.signedUrl} wornUrl={worn[0]?.signedUrl}/></div></section>

      <section className="rounded-2xl border border-border bg-surface p-5"><h2 className="font-medium">制作反馈</h2><dl className="mt-4 space-y-4 text-sm"><div><dt className="text-xs text-muted">还原程度</dt><dd className="mt-1">{item.restoration_level ? restorationLabels[item.restoration_level as WorkRestorationLevel] : "—"}</dd></div><div><dt className="text-xs text-muted">修改原因</dt><dd className="mt-2 flex flex-wrap gap-2">{feedbackReasons.length ? feedbackReasons.map((reason) => <span key={reason} className="rounded-full border border-border px-3 py-2">{changeReasonLabels[reason]}</span>) : "—"}</dd></div><div><dt className="text-xs text-muted">反馈备注</dt><dd className="mt-1 whitespace-pre-wrap leading-6">{item.feedback_notes || "—"}</dd></div></dl></section>

      <section className="rounded-2xl border border-border bg-surface p-5"><h2 className="font-medium">作品资料</h2><dl className="mt-4 space-y-4 text-sm"><div><dt className="text-xs text-muted">完成日期</dt><dd className="mt-1">{item.completed_at?.slice(0, 10) ?? "—"}</dd></div><div><dt className="text-xs text-muted">备注</dt><dd className="mt-1 whitespace-pre-wrap leading-6">{item.notes || "—"}</dd></div></dl><div className="mt-5 flex flex-col gap-3 sm:flex-row"><Link href={`/works/${id}/edit`} className={buttonStyles({ className: "h-12" })}><Pencil className="size-4"/>编辑与图片</Link><DeleteButton kind="works" id={id}/></div></section>
    </div>
  </>;
}
