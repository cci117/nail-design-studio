import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
export function PageHeader({ title, description, backHref = "/" }: { title: string; description?: string; backHref?: string }) {
  return <header className="mb-8"><Link href={backHref} aria-label="返回" className={buttonStyles({ variant: "ghost", size: "icon", className: "mb-7 rounded-full md:hidden" })}><ArrowLeft size={18} /></Link><h1 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">{title}</h1>{description && <p className="mt-2 text-sm leading-6 text-muted">{description}</p>}</header>;
}
