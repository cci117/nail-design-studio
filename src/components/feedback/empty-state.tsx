import type { LucideIcon } from "lucide-react";
export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return <section className="flex min-h-[48vh] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface px-6 py-16 text-center"><div className="mb-5 rounded-2xl border border-border bg-black p-4 text-zinc-400"><Icon size={24} strokeWidth={1.5} /></div><h2 className="text-base font-medium text-zinc-100">{title}</h2><p className="mt-2 max-w-xs text-sm leading-6 text-muted">{description}</p></section>;
}
