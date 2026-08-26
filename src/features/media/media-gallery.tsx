"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { ImageIcon, X } from "lucide-react";
import type { MediaItem } from "./media-types";
import { buttonStyles } from "@/components/ui/button";

export function MediaGallery({ items }: { items: MediaItem[] }) {
  const available = items.filter((item) => item.signedUrl);
  const cover = available.find((item) => item.role === "cover") ?? available[0];
  const [active, setActive] = useState<MediaItem | null>(null);
  if (!cover) return <div className="flex aspect-square max-h-[560px] items-center justify-center rounded-3xl border border-border bg-surface text-zinc-600"><ImageIcon size={32} strokeWidth={1.2}/></div>;
  return <><button type="button" onClick={() => setActive(cover)} aria-label="查看大图" className={buttonStyles({ variant: "ghost", className: "block min-h-0 w-full overflow-hidden rounded-3xl border-[#3a3a3a] p-0" })}><img src={cover.signedUrl} alt="" className="aspect-square max-h-[560px] w-full object-cover"/></button>{available.length > 1 && <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">{available.map((item) => <button key={item.id} type="button" onClick={() => setActive(item)} aria-label="查看图片" className={buttonStyles({ variant: "ghost", className: "relative min-h-0 overflow-hidden rounded-xl border-[#4a4a4a] p-0" })}><img src={item.signedUrl} alt="" className="aspect-square w-full object-cover"/>{item.role === "cover" && <span className="absolute bottom-1 left-1 rounded bg-black/90 px-1.5 py-0.5 text-[10px] font-medium text-white">封面</span>}</button>)}</div>}{active?.signedUrl && <div role="dialog" aria-modal="true" aria-label="图片预览" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-[calc(0.75rem+env(safe-area-inset-top))]"><img src={active.signedUrl} alt="" className="max-h-[90dvh] max-w-full object-contain"/><button type="button" onClick={() => setActive(null)} aria-label="关闭大图" className={buttonStyles({ variant: "secondary", size: "icon", className: "absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] rounded-full" })}><X className="size-5"/></button></div>}</>;
}
