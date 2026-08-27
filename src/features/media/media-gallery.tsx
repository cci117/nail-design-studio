"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon, X } from "lucide-react";
import type { MediaItem } from "./media-types";
import { buttonStyles } from "@/components/ui/button";

const SWIPE_DISTANCE = 48;

function loopIndex(index: number, length: number) {
  if (length <= 1) return 0;
  return (index + length) % length;
}

export function MediaGallery({ items }: { items: MediaItem[] }) {
  const available = useMemo(
    () => items
      .filter((item): item is MediaItem & { signedUrl: string } => Boolean(item.signedUrl))
      .sort((first, second) => first.sort_order - second.sort_order || first.created_at.localeCompare(second.created_at)),
    [items],
  );
  const cover = available.find((item) => item.role === "cover") ?? available[0];
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") setActiveIndex((current) => current === null ? null : loopIndex(current - 1, available.length));
      if (event.key === "ArrowRight") setActiveIndex((current) => current === null ? null : loopIndex(current + 1, available.length));
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, [activeIndex, available.length]);

  useEffect(() => {
    if (activeIndex === null) return;
    if (available.length <= 1) return;
    [loopIndex(activeIndex - 1, available.length), loopIndex(activeIndex + 1, available.length)].forEach((index) => {
      const url = available[index].signedUrl;
      if (url) new Image().src = url;
    });
  }, [activeIndex, available]);

  if (!cover) {
    return <div className="flex aspect-square max-h-[560px] items-center justify-center rounded-3xl border border-border bg-surface text-zinc-600"><ImageIcon size={32} strokeWidth={1.2}/></div>;
  }

  function open(item: MediaItem) {
    const index = available.findIndex((candidate) => candidate.id === item.id);
    if (index >= 0) setActiveIndex(index);
  }

  function move(direction: -1 | 1) {
    setActiveIndex((current) => current === null ? null : loopIndex(current + direction, available.length));
  }

  function finishSwipe(event: React.PointerEvent<HTMLDivElement>) {
    const start = pointer.current;
    pointer.current = null;
    if (!start || start.id !== event.pointerId) return;
    const horizontal = event.clientX - start.x;
    const vertical = event.clientY - start.y;
    if (Math.abs(horizontal) < SWIPE_DISTANCE || Math.abs(horizontal) <= Math.abs(vertical)) return;
    move(horizontal < 0 ? 1 : -1);
  }

  const active = activeIndex === null ? null : available[activeIndex];

  return <>
    <button type="button" onClick={() => open(cover)} aria-label="查看大图" className={buttonStyles({ variant: "ghost", className: "block min-h-0 w-full overflow-hidden rounded-3xl border-[#3a3a3a] p-0" })}>
      <img src={cover.signedUrl} alt="" className="aspect-square max-h-[560px] w-full object-cover"/>
    </button>
    {available.length > 1 && <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
      {available.map((item, index) => <button key={item.id} type="button" onClick={() => open(item)} aria-label={`查看第 ${index + 1} 张图片`} className={buttonStyles({ variant: "ghost", className: "relative min-h-0 overflow-hidden rounded-xl border-[#4a4a4a] p-0" })}>
        <img src={item.signedUrl} alt="" className="aspect-square w-full object-cover"/>
        {item.role === "cover" && <span className="absolute bottom-1 left-1 rounded bg-black/90 px-1.5 py-0.5 text-[10px] font-medium text-white">封面</span>}
      </button>)}
    </div>}

    {active?.signedUrl && <div role="dialog" aria-modal="true" aria-label="图片浏览器" className="immersive-dark fixed inset-0 z-[70] flex flex-col bg-black px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-[calc(0.75rem+env(safe-area-inset-top))]">
      <div className="flex min-h-11 items-center justify-between gap-3 px-1">
        <span className="rounded-full bg-[#181818] px-3 py-1.5 text-xs font-medium text-white">{activeIndex! + 1} / {available.length}</span>
        {active.role === "cover" && <span className="rounded-full border border-[#4a4a4a] bg-[#181818] px-3 py-1.5 text-xs font-medium text-white">封面</span>}
        <button type="button" onClick={() => setActiveIndex(null)} aria-label="关闭大图" className={buttonStyles({ variant: "secondary", size: "icon", className: "ml-auto rounded-full" })}><X className="size-5"/></button>
      </div>

      <div className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center overflow-hidden py-3" onPointerDown={(event) => { if (!event.isPrimary) return; pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerUp={finishSwipe} onPointerCancel={() => { pointer.current = null; }}>
        <img src={active.signedUrl} alt="" draggable={false} className="max-h-full max-w-full select-none object-contain"/>
        <button type="button" onClick={() => move(-1)} aria-label="上一张" className={buttonStyles({ variant: "secondary", size: "icon", className: "absolute left-1 rounded-full bg-black/80 sm:left-4" })}><ChevronLeft className="size-6"/></button>
        <button type="button" onClick={() => move(1)} aria-label="下一张" className={buttonStyles({ variant: "secondary", size: "icon", className: "absolute right-1 rounded-full bg-black/80 sm:right-4" })}><ChevronRight className="size-6"/></button>
      </div>

      <div className="mx-auto flex max-w-full gap-2 overflow-x-auto py-1">
        {available.map((item, index) => <button key={item.id} type="button" onClick={() => setActiveIndex(index)} aria-label={`跳转到第 ${index + 1} 张图片`} aria-current={index === activeIndex ? "true" : undefined} className={buttonStyles({ variant: "ghost", className: `relative min-h-0 w-16 shrink-0 overflow-hidden rounded-xl border-2 p-0 ${index === activeIndex ? "ring-2 ring-white ring-offset-2 ring-offset-black" : ""}` })}>
          <img src={item.signedUrl} alt="" className="aspect-square w-full object-cover"/>
          {item.role === "cover" && <span className="absolute inset-x-0 bottom-0 bg-black/90 py-0.5 text-[9px] font-medium text-white">封面</span>}
        </button>)}
      </div>
    </div>}
  </>;
}
