import Link from "next/link";
import { Gem, ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export default async function LoginPage() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data: { user } } = await supabase!.auth.getUser();
    if (user) redirect("/");
  }
  return <main className="flex min-h-dvh items-center justify-center px-5 py-12"><div className="w-full max-w-sm"><Link href="/" aria-label="返回首页" className="mb-12 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-zinc-500 hover:text-white"><ArrowLeft size={18}/></Link><div className="mb-7 inline-flex rounded-2xl border border-border bg-surface p-3 text-accent"><Gem size={22}/></div><h1 className="text-3xl font-semibold tracking-[-0.04em]">访问工作台</h1><p className="mt-3 text-sm leading-6 text-muted">使用邮箱与密码登录，或注册新账号。</p><LoginForm configured={isSupabaseConfigured} /></div></main>;
}
