"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";

type LibraryRouteErrorProps = {
  reset: () => void;
};

export function LibraryRouteError({ reset }: LibraryRouteErrorProps) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full border border-red-400/30 bg-red-400/5 text-red-300">
        <AlertCircle className="size-5" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-lg font-medium text-white">内容加载失败</h1>
      <p className="mt-2 text-sm leading-6 text-zinc-500">
        请检查网络连接后重试。
      </p>
      <button
        type="button"
        onClick={reset}
        className={buttonStyles({ variant: "secondary", className: "mt-6 rounded-full" })}
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        重新加载
      </button>
    </section>
  );
}
