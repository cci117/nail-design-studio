import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Sparkles, Layers3, Settings, ChevronRight, Tags } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
const items = [{ href: "/favorite-assets", label: "收藏素材", icon: Sparkles }, { href: "/designs", label: "设计", icon: Layers3 }, { href: "/tags", label: "标签管理", icon: Tags }, { href: "/settings", label: "设置", icon: Settings }];
export default function Page() { return <><PageHeader title="更多" description="其他资料与应用设置" /><section className="mb-6 rounded-2xl border border-border bg-surface p-5"><h2 className="mb-3 text-sm font-medium">外观</h2><ThemeToggle /></section><div className="overflow-hidden rounded-2xl border border-border bg-surface">{items.map(({ href, label, icon: Icon }, index) => <Link key={href} href={href} className={`flex min-h-16 items-center gap-4 px-5 py-5 text-foreground active:bg-surface-raised ${index ? "border-t border-border" : ""}`}><Icon size={19} className="text-muted"/><span className="flex-1 text-sm font-medium">{label}</span><ChevronRight size={17} className="text-muted"/></Link>)}</div></>; }
