import Link from "next/link";
import { Layers3, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonStyles, floatingAddStyles } from "@/components/ui/button";
import { designRepository } from "@/data/repositories/supabase/design-repository";

export default async function Page() {
  const designs = await designRepository.list();
  return <><PageHeader title="设计" description="保存的十指方案与设计过程"/><div className="grid gap-3 sm:grid-cols-2">{designs.map((design) => <Link key={design.id} href={`/designs/${design.id}`} className="rounded-2xl border border-border bg-surface p-5 active:bg-surface-raised"><div className="flex items-center justify-between"><Layers3 className="size-5 text-accent"/><span className="rounded-full border border-border px-2 py-1 text-[10px] text-muted">草稿</span></div><h2 className="mt-7 font-medium">{design.title}</h2><p className="mt-2 line-clamp-2 text-xs text-muted">{design.notes || "十指设计方案"}</p></Link>)}{!designs.length && <section className="col-span-full flex min-h-[45dvh] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface text-center"><Layers3 className="size-7 text-muted"/><h2 className="mt-5 text-sm font-medium">还没有设计方案</h2><Link href="/create" className={buttonStyles({ className: "mt-6" })}>开始设计</Link></section>}</div><Link href="/create" className={floatingAddStyles()}><Plus className="size-5"/>开始设计</Link></>;
}
