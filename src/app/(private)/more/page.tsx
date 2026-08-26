import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Sparkles, Layers3, Settings, ChevronRight, Tags } from "lucide-react";
const items = [{ href: "/favorite-assets", label: "收藏素材", icon: Sparkles }, { href: "/designs", label: "设计", icon: Layers3 }, { href: "/tags", label: "标签管理", icon: Tags }, { href: "/settings", label: "设置", icon: Settings }];
export default function Page() { return <><PageHeader title="更多" description="其他资料与应用设置" /><div className="overflow-hidden rounded-2xl border border-[#3a3a3a] bg-surface">{items.map(({ href, label, icon: Icon }, index) => <Link key={href} href={href} className={`flex min-h-16 items-center gap-4 px-5 py-5 text-white active:bg-[#242424] ${index ? "border-t border-[#3a3a3a]" : ""}`}><Icon size={19} className="text-zinc-300"/><span className="flex-1 text-sm font-medium">{label}</span><ChevronRight size={17} className="text-zinc-300"/></Link>)}</div></>; }
