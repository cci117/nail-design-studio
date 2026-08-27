"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, ImagePlus, LoaderCircle, Star, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useNetworkStatus } from "@/providers/network-status-provider";
import { buttonStyles, chipStyles } from "@/components/ui/button";
import { createMediaRecordAction, deleteMediaAction, reorderMediaAction, setCoverAction, setWorkMediaKindAction } from "./media-actions";
import { compressImage, isHeic, isSupportedImage } from "./image-processing";
import { MAX_MEDIA_PER_ENTITY, MAX_SOURCE_FILE_SIZE, type MediaItem } from "./media-types";
import { createClientId } from "./client-id";
import type { EntityKind } from "@/types/domain";

type UploadState = "waiting" | "uploading" | "success" | "failed";
type Candidate = { id: string; file: File; url: string; selected: boolean; selectionOrder: number; status: UploadState; error?: string };

export function MediaManager({ entityType, entityId, items }: { entityType: EntityKind; entityId: string; items: MediaItem[] }) {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef<string[]>([]);
  const [mode, setMode] = useState<"preview" | "grid">("preview");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [active, setActive] = useState(0);
  const [coverCandidateId, setCoverCandidateId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => () => { objectUrls.current.forEach((url) => URL.revokeObjectURL(url)); }, []);
  const chosen = candidates
    .filter((candidate) => candidate.selected)
    .sort((first, second) => first.selectionOrder - second.selectionOrder);

  function chooseFiles(files: FileList | null) {
    if (!files?.length) return;
    const incoming = [...files];
    setMessage(null);
    const pendingCount = candidates.filter((candidate) => candidate.status !== "success").length;
    if (items.length + pendingCount + incoming.length > MAX_MEDIA_PER_ENTITY) {
      setMessage(`每条资料最多 ${MAX_MEDIA_PER_ENTITY} 张图片，当前还可添加 ${Math.max(0, MAX_MEDIA_PER_ENTITY - items.length - pendingCount)} 张。`);
      return;
    }
    const accepted: Candidate[] = [];
    const nextSelectionOrder = candidates.reduce((maximum, candidate) => Math.max(maximum, candidate.selectionOrder), 0) + 1;
    for (const file of incoming) {
      if (isHeic(file)) { setMessage("暂不支持 HEIC / HEIF，请先在手机相册中转换或导出为 JPEG。部分 iPhone 可在相机设置中选择“兼容性最佳”。"); continue; }
      if (!isSupportedImage(file)) { setMessage("仅支持 JPEG、PNG 和 WEBP 图片。"); continue; }
      if (file.size > MAX_SOURCE_FILE_SIZE) { setMessage("单张原始图片不能超过 15MB。"); continue; }
      const url = URL.createObjectURL(file);
      objectUrls.current.push(url);
      accepted.push({ id: createClientId(), file, url, selected: true, selectionOrder: nextSelectionOrder + accepted.length, status: "waiting" });
    }
    if (accepted.length) { setCandidates((current) => [...current, ...accepted]); setCoverCandidateId((current) => current ?? accepted[0].id); setMode("grid"); }
  }

  function completeSelection() {
    const retained = chosen.map((candidate, index) => ({ ...candidate, selectionOrder: index + 1 }));
    candidates.filter((candidate) => !candidate.selected).forEach((candidate) => URL.revokeObjectURL(candidate.url));
    setCandidates(retained);
    setActive(0);
    setMode("preview");
  }

  function removeCandidate(id: string) {
    setCandidates((current) => {
      const target = current.find((candidate) => candidate.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return current.filter((candidate) => candidate.id !== id);
    });
    if (coverCandidateId === id) setCoverCandidateId(candidates.find((candidate) => candidate.id !== id)?.id ?? null);
    setActive(0);
  }

  function moveCandidate(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= candidates.length) return;
    setCandidates((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next.map((candidate, candidateIndex) => ({ ...candidate, selectionOrder: candidateIndex + 1 }));
    });
    setActive(nextIndex);
  }

  async function upload() {
    if (!isOnline) { setMessage("当前离线，图片上传需联网。"); return; }
    const supabase = createClient();
    if (!supabase) { setMessage("Supabase 未配置。"); return; }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { setMessage("登录已失效，请重新登录。"); return; }
    setUploading(true);
    setMessage(null);
    let successCount = 0;
    for (const candidate of candidates) {
      if (candidate.status !== "waiting" && candidate.status !== "failed") continue;
      setCandidates((current) => current.map((item) => item.id === candidate.id ? { ...item, status: "uploading", error: undefined } : item));
      let storagePath = "";
      try {
        const processed = await compressImage(candidate.file);
        storagePath = `${user.id}/${entityType}/${entityId}/${createClientId()}.jpg`;
        const { error: uploadError } = await supabase.storage.from("user-media").upload(storagePath, processed.blob, { contentType: processed.mimeType, upsert: false });
        if (uploadError) throw new Error(uploadError.message);
        const result = await createMediaRecordAction(entityType, entityId, { storagePath, mimeType: processed.mimeType, width: processed.width, height: processed.height, fileSize: processed.blob.size });
        if (result.error) {
          await supabase.storage.from("user-media").remove([storagePath]);
          throw new Error(result.error);
        }
        successCount += 1;
        setCandidates((current) => current.map((item) => item.id === candidate.id ? { ...item, status: "success", error: undefined } : item));
        if (candidate.id === coverCandidateId && "id" in result) {
          const coverResult = await setCoverAction(entityType, entityId, result.id);
          if (coverResult.error) setMessage(`图片已上传，但封面设置失败：${coverResult.error}`);
        }
      } catch (error) {
        setCandidates((current) => current.map((item) => item.id === candidate.id ? { ...item, status: "failed", error: error instanceof Error ? error.message : "上传失败" } : item));
      }
    }
    setUploading(false);
    if (successCount) router.refresh();
    if (successCount && successCount === candidates.filter((candidate) => candidate.status !== "success").length) setMessage("图片上传完成，可点击完成返回图片列表。");
  }

  function manage(action: () => Promise<{ error: string | null }>) {
    setMessage(null);
    startTransition(async () => { const result = await action(); if (result.error) setMessage(result.error); else router.refresh(); });
  }

  function removeExisting(item: MediaItem) {
    if (!window.confirm("确定删除这张图片？此操作会同时删除云端文件。")) return;
    manage(() => deleteMediaAction(entityType, entityId, item.id));
  }

  function moveExisting(index: number, direction: -1 | 1) {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    manage(() => reorderMediaAction(entityType, entityId, next.map((item) => item.id)));
  }

  function toggleCandidate(id: string) {
    setCandidates((current) => {
      const nextOrder = current.reduce((maximum, candidate) => Math.max(maximum, candidate.selectionOrder), 0) + 1;
      return current.map((candidate) => candidate.id === id
        ? { ...candidate, selected: !candidate.selected, selectionOrder: candidate.selected ? candidate.selectionOrder : nextOrder }
        : candidate);
    });
  }

  return <section className="mt-8 rounded-2xl border border-[#3a3a3a] bg-[#080808] p-4 sm:p-6"><div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="font-medium text-white">图片</h2><p className="mt-1 text-xs text-zinc-300">{items.length} / {MAX_MEDIA_PER_ENTITY} 张</p></div><button type="button" disabled={!isOnline || uploading || items.length + candidates.filter((candidate) => candidate.status !== "success").length >= MAX_MEDIA_PER_ENTITY} onClick={() => inputRef.current?.click()} className={buttonStyles({ variant: "secondary", size: "compact" })}><ImagePlus className="size-4"/>{items.length || candidates.length ? "继续添加" : "添加图片"}</button><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" multiple className="sr-only" onChange={(event) => { chooseFiles(event.target.files); event.target.value = ""; }}/></div>{!isOnline && <p className="mb-4 rounded-xl border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm font-medium text-amber-200">当前离线，图片上传需联网。</p>}{items.length > 0 && <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-3">{items.map((item, index) => <div key={item.id} className="overflow-hidden rounded-xl border border-[#3a3a3a] bg-[#141414]">{item.signedUrl ? <img src={item.signedUrl} alt="" className="aspect-square w-full object-cover"/> : <div className="aspect-square bg-zinc-900"/>}<div className="p-2"><div className="mb-2 flex min-h-5 items-center text-xs font-medium">{item.role === "cover" ? <span className="text-purple-200">封面</span> : <span className="text-zinc-300">图片 {index + 1}</span>}</div>{entityType === "work" && <label className="mb-2 block text-[11px] font-medium text-zinc-300">成品类型<select value={item.work_media_kind ?? "other"} disabled={pending} onChange={(event) => manage(() => setWorkMediaKindAction(entityId, item.id, event.target.value))} className="mt-1 h-11 w-full rounded-lg border border-[#4a4a4a] bg-[#1a1a1a] px-2 text-xs text-white"><option value="press_on">甲片成品</option><option value="worn">上手效果</option><option value="detail">细节</option><option value="other">其他</option></select></label>}<div className="grid grid-cols-2 gap-1"><button type="button" disabled={pending || index === 0} onClick={() => moveExisting(index, -1)} aria-label="上移" className={buttonStyles({ variant: "ghost", size: "icon", className: "size-11" })}><ArrowUp className="size-4"/></button><button type="button" disabled={pending || index === items.length - 1} onClick={() => moveExisting(index, 1)} aria-label="下移" className={buttonStyles({ variant: "ghost", size: "icon", className: "size-11" })}><ArrowDown className="size-4"/></button>{item.role !== "cover" && <button type="button" disabled={pending} onClick={() => manage(() => setCoverAction(entityType, entityId, item.id))} className={buttonStyles({ variant: "secondary", size: "compact", className: "col-span-2" })}><Star className="size-4"/>设为封面</button>}<button type="button" disabled={pending} onClick={() => removeExisting(item)} className={buttonStyles({ variant: "danger", size: "compact", className: "col-span-2" })}><Trash2 className="size-4"/>删除</button></div></div></div>)}</div>}{candidates.length === 0 && items.length === 0 && <button type="button" disabled={!isOnline} onClick={() => inputRef.current?.click()} className={buttonStyles({ variant: "secondary", className: "min-h-52 w-full flex-col border-dashed" })}><ImagePlus className="size-7"/><span>选择多张</span><span className="text-xs font-medium text-zinc-300">JPEG、PNG、WEBP · 单张不超过 15MB</span></button>}{mode === "grid" && candidates.length > 0 && <div><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{candidates.map((candidate) => { const order = chosen.findIndex((item) => item.id === candidate.id) + 1; return <button key={candidate.id} type="button" aria-pressed={candidate.selected} aria-label={candidate.selected ? `取消选择第 ${order} 张图片` : "选择图片"} onClick={() => toggleCandidate(candidate.id)} className={buttonStyles({ variant: "ghost", className: "relative min-h-0 overflow-hidden rounded-xl border-[#4a4a4a] p-0" })}><img src={candidate.url} alt="" className={`aspect-square w-full object-cover ${candidate.selected ? "opacity-100" : "opacity-55"}`}/><span className={chipStyles(candidate.selected, "absolute right-2 top-2 size-8 min-h-0 p-0 text-xs font-bold")}>{order || ""}</span></button>; })}</div><div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] z-30 mt-4 flex items-center justify-between rounded-2xl border border-[#4a4a4a] bg-black/95 p-3 shadow-[0_0_24px_rgba(0,0,0,0.85)]"><span className="text-sm font-medium text-white">已选 {chosen.length} 张</span><button type="button" disabled={!chosen.length} onClick={completeSelection} className={buttonStyles({ size: "compact" })}><Check className="size-4"/>完成（{chosen.length}）</button></div></div>}{mode === "preview" && candidates.length > 0 && <div><div className="relative overflow-hidden rounded-2xl border border-[#3a3a3a] bg-black"><img src={candidates[Math.min(active, candidates.length - 1)].url} alt="" className="aspect-square w-full object-contain"/><span className={chipStyles(true, "absolute left-3 top-3 min-h-0 px-3 py-1 text-xs font-bold")}>{candidates[Math.min(active, candidates.length - 1)].id === coverCandidateId ? "封面" : `第 ${active + 1} 张`}</span></div><div className="mt-3 flex gap-2 overflow-x-auto pb-2">{candidates.map((candidate, index) => <button key={candidate.id} type="button" onClick={() => setActive(index)} aria-label={`查看第 ${index + 1} 张图片`} className={buttonStyles({ variant: "ghost", className: `relative min-h-0 w-20 shrink-0 overflow-hidden rounded-xl border-2 p-0 ${index === active ? "border-white" : "border-[#4a4a4a]"}` })}><img src={candidate.url} alt="" className="aspect-square w-full object-cover"/>{candidate.id === coverCandidateId && <span className="absolute left-1 top-1 rounded bg-black/90 px-1.5 py-0.5 text-[10px] font-medium text-white">封面</span>}{candidate.status === "uploading" && <span className="absolute inset-0 flex items-center justify-center bg-black/70"><LoaderCircle className="size-5 animate-spin"/></span>}{candidate.status === "success" && <span className="absolute inset-x-0 bottom-0 bg-emerald-950 px-1 py-1 text-[10px] text-emerald-200">成功</span>}{candidate.status === "failed" && <span className="absolute inset-x-0 bottom-0 bg-red-950 px-1 py-1 text-[10px] text-red-200">失败</span>}</button>)}</div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={active === 0 || uploading} onClick={() => moveCandidate(active, -1)} className={buttonStyles({ variant: "secondary", size: "compact" })}><ArrowUp className="size-4"/>前移</button><button type="button" disabled={active >= candidates.length - 1 || uploading} onClick={() => moveCandidate(active, 1)} className={buttonStyles({ variant: "secondary", size: "compact" })}><ArrowDown className="size-4"/>后移</button><button type="button" disabled={uploading || candidates[active].status === "success"} onClick={() => removeCandidate(candidates[active].id)} className={buttonStyles({ variant: "danger", size: "compact" })}><X className="size-4"/>删除</button><button type="button" disabled={uploading || candidates[active].status === "success" || candidates[active].id === coverCandidateId} onClick={() => setCoverCandidateId(candidates[active].id)} className={buttonStyles({ variant: "secondary", size: "compact" })}><Star className="size-4"/>设为封面</button><button type="button" disabled={uploading} onClick={() => { setMode("grid"); inputRef.current?.click(); }} className={buttonStyles({ variant: "secondary", size: "compact", className: "col-span-2" })}><ImagePlus className="size-4"/>继续添加</button></div>{candidates.some((candidate) => candidate.error) && <div className="mt-3 space-y-1">{candidates.filter((candidate) => candidate.error).map((candidate) => <p key={candidate.id} className="text-xs text-red-200">{candidate.file.name}：{candidate.error}</p>)}</div>}{candidates.every((candidate) => candidate.status === "success") ? <button type="button" onClick={() => { candidates.forEach((candidate) => URL.revokeObjectURL(candidate.url)); setCandidates([]); setCoverCandidateId(null); }} className={buttonStyles({ className: "mt-4 h-12 w-full" })}>完成</button> : <button type="button" disabled={uploading || !isOnline} onClick={upload} className={buttonStyles({ className: "mt-4 h-12 w-full" })}>{uploading ? <><LoaderCircle className="size-4 animate-spin"/>上传中…</> : candidates.some((candidate) => candidate.status === "failed") ? "重试失败图片" : `上传 ${candidates.filter((candidate) => candidate.status !== "success").length} 张`}</button>}</div>}{message && <p role="status" className="mt-4 rounded-xl border border-[#444] bg-[#171717] px-4 py-3 text-sm font-medium text-white">{message}</p>}</section>;
}
