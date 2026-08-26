"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-black px-6 text-center"><h1 className="text-xl font-medium">页面暂时无法打开</h1><p className="text-sm text-muted">请检查网络状态后重试。</p><button onClick={reset} className="rounded-xl border border-border px-4 py-2 text-sm">重试</button></div>; }
