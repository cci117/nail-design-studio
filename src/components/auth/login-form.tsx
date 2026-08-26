"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buttonStyles } from "@/components/ui/button";

type AuthMode = "login" | "register";

const MIN_PASSWORD_LENGTH = 6;

function getSafeAuthError(mode: AuthMode, message: string) {
  const normalized = message.toLowerCase();

  if (mode === "login") {
    if (normalized.includes("invalid login credentials")) return "邮箱或密码不正确。";
    if (normalized.includes("email not confirmed")) return "该邮箱尚未完成验证，请先查收验证邮件。";
    return "登录失败，请检查输入后重试。";
  }

  if (normalized.includes("password")) return `密码不符合要求，请使用至少 ${MIN_PASSWORD_LENGTH} 个字符。`;
  if (normalized.includes("email")) return "邮箱格式无效或暂时无法使用。";
  return "注册失败，请检查输入后重试。";
}

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const normalizedEmail = email.trim();
    if (!normalizedEmail) { setError("请输入邮箱。"); return; }
    if (password.length < MIN_PASSWORD_LENGTH) { setError(`密码至少需要 ${MIN_PASSWORD_LENGTH} 个字符。`); return; }
    if (mode === "register" && password !== confirmPassword) { setError("两次输入的密码不一致。"); return; }

    const supabase = createClient();
    if (!supabase) { setError("请先配置 Supabase 环境变量。"); return; }

    setPending(true);

    try {
      if (mode === "register") {
        const { data, error: signUpError } = await supabase.auth.signUp({ email: normalizedEmail, password });
        if (signUpError) { setError(getSafeAuthError(mode, signUpError.message)); return; }
        if (data.session) { router.push("/"); router.refresh(); return; }

        setPassword("");
        setConfirmPassword("");
        setSuccess("注册成功，请前往邮箱完成验证后再登录");
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) { setError(getSafeAuthError(mode, signInError.message)); return; }
      if (!data.user || !data.session) { setError("登录请求未建立有效会话"); return; }

      router.replace("/");
      router.refresh();
    } catch {
      setError("无法连接登录服务，请检查网络后重试。");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-10">
      <div className="grid grid-cols-2 rounded-xl border border-border bg-surface p-1" role="tablist" aria-label="账号操作">
        {(["login", "register"] as const).map((item) => {
          const active = mode === item;
          return <button key={item} type="button" role="tab" aria-selected={active} onClick={() => changeMode(item)} className={`min-h-11 rounded-lg text-sm font-medium transition-colors ${active ? "bg-[#f5f5f5] text-black" : "bg-[#161616] text-white active:bg-[#303030]"}`}>{item === "login" ? "登录" : "注册"}</button>;
        })}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <label className="block"><span className="mb-2 block text-xs font-medium text-zinc-400">邮箱</span><input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm text-white placeholder:text-zinc-700 focus:border-zinc-500 focus:outline-none" /></label>
        <label className="block"><span className="mb-2 block text-xs font-medium text-zinc-400">密码</span><input type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={`至少 ${MIN_PASSWORD_LENGTH} 个字符`} className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm text-white placeholder:text-zinc-700 focus:border-zinc-500 focus:outline-none" /></label>
        {mode === "register" && <label className="block"><span className="mb-2 block text-xs font-medium text-zinc-400">确认密码</span><input type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="再次输入密码" className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm text-white placeholder:text-zinc-700 focus:border-zinc-500 focus:outline-none" /></label>}
        {error && <p role="alert" className="rounded-xl border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs leading-5 text-red-300">{error}</p>}
        {success && <p role="status" className="flex gap-2 rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-3 py-3 text-xs leading-5 text-emerald-300"><CheckCircle2 size={16} className="mt-0.5 shrink-0" />{success}</p>}
        <button type="submit" disabled={pending || !configured} className={buttonStyles({ className: "h-12 w-full" })}>{pending ? <><LoaderCircle size={17} className="animate-spin" /><span>{mode === "login" ? "正在登录…" : "正在注册…"}</span></> : <><span>{mode === "login" ? "登录" : "注册账号"}</span><ArrowRight size={16}/></>}</button>
        {!configured && <p className="text-center text-xs leading-5 text-zinc-600">Supabase 未配置，账号功能暂不可用。<br/>基础界面仍可通过首页预览。</p>}
      </form>
    </div>
  );
}
