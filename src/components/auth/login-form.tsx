"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    const supabase = createClient();
    if (!supabase) { setError("请先配置 Supabase 环境变量。"); return; }
    setPending(true);
    const result = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (result.error) { setError(result.error.message); return; }
    router.replace("/"); router.refresh();
  }
  return <form onSubmit={submit} className="mt-10 space-y-5"><label className="block"><span className="mb-2 block text-xs font-medium text-zinc-400">邮箱</span><input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm text-white placeholder:text-zinc-700 focus:border-zinc-500 focus:outline-none" /></label><label className="block"><span className="mb-2 block text-xs font-medium text-zinc-400">密码</span><input type="password" required minLength={6} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="输入密码" className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm text-white placeholder:text-zinc-700 focus:border-zinc-500 focus:outline-none" /></label>{error && <p role="alert" className="rounded-xl border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs leading-5 text-red-300">{error}</p>}<button disabled={pending || !configured} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500">{pending ? <LoaderCircle size={17} className="animate-spin" /> : <><span>登录</span><ArrowRight size={16}/></>}</button>{!configured && <p className="text-center text-xs leading-5 text-zinc-600">Supabase 未配置，登录功能暂不可用。<br/>基础界面仍可通过首页预览。</p>}</form>;
}
