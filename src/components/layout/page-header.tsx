import Link from "next/link";
import { ArrowLeft } from "lucide-react";
export function PageHeader({ title, description, backHref = "/" }: { title: string; description?: string; backHref?: string }) {
  return <header className="mb-8"><Link href={backHref} aria-label="返回" className="mb-7 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-zinc-400 hover:text-white md:hidden"><ArrowLeft size={18} /></Link><h1 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">{title}</h1>{description && <p className="mt-2 text-sm leading-6 text-muted">{description}</p>}</header>;
}
