"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Images, PackageOpen, Palette, MoreHorizontal } from "lucide-react";
const items = [{ href: "/", label: "首页", icon: Home }, { href: "/inspiration", label: "灵感", icon: Images }, { href: "/assets", label: "素材", icon: PackageOpen }, { href: "/works", label: "作品", icon: Palette }, { href: "/more", label: "更多", icon: MoreHorizontal }];
export function BottomNavigation() {
  const pathname = usePathname();
  return <nav aria-label="主导航" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#3a3a3a] bg-black/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"><div className="mx-auto grid h-16 max-w-lg grid-cols-5">{items.map(({ href, label, icon: Icon }) => { const active = href === "/" ? pathname === "/" : pathname.startsWith(href); return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition active:bg-[#1a1a1a] ${active ? "text-accent" : "text-zinc-300"}`}><Icon size={19} strokeWidth={active ? 2 : 1.6} /><span>{label}</span></Link>; })}</div></nav>;
}
