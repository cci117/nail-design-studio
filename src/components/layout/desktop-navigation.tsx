import Link from "next/link";
import { Gem } from "lucide-react";
const links = [["/", "首页"], ["/inspiration", "灵感库"], ["/favorite-assets", "收藏素材"], ["/assets", "材料库"], ["/works", "作品"], ["/designs", "设计"], ["/settings", "设置"]];
export function DesktopNavigation() {
  return <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-[#050505] p-6 md:flex md:flex-col"><Link href="/" className="flex items-center gap-3 text-sm font-medium"><span className="rounded-xl border border-border bg-surface p-2 text-accent"><Gem size={18} /></span>美甲设计工作台</Link><nav className="mt-10 flex flex-col gap-1">{links.map(([href, label]) => <Link key={href} href={href} className="rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-surface-raised hover:text-white">{label}</Link>)}</nav><p className="mt-auto text-xs text-zinc-600">V0.1 · 离线 App Shell</p></aside>;
}
