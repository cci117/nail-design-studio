"use client";
import { buttonStyles } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-black px-6 text-center"><h1 className="text-xl font-medium">页面暂时无法打开</h1><p className="text-sm text-muted">请检查网络状态后重试。</p><button onClick={reset} className={buttonStyles({ variant: "secondary" })}>重试</button></div>; }
