import { ImagePlus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonStyles } from "@/components/ui/button";
import { createLibraryDraft } from "./library-actions";
import { getLibraryDefinition, type LibraryKind } from "./library-config";

export function LibraryDraftStartPage({ kind }: { kind: LibraryKind }) {
  const definition = getLibraryDefinition(kind);
  const action = createLibraryDraft.bind(null, kind);

  return <>
    <PageHeader title={`添加${definition.singular}`} backHref={definition.path}/>
    <section className="flex min-h-[58dvh] flex-col items-center justify-center rounded-3xl border border-[#303030] bg-[#050505] px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl border border-[#3a3a3a] bg-[#111] text-white"><ImagePlus className="size-7"/></div>
      <h2 className="mt-6 text-lg font-medium text-white">先添加图片</h2>
      <p className="mt-2 text-sm text-zinc-400">图片保存后再完善资料</p>
      <form action={action} className="mt-8 w-full max-w-xs">
        <button type="submit" className={buttonStyles({ className: "h-12 w-full" })}><ImagePlus className="size-5"/>添加图片</button>
      </form>
    </section>
  </>;
}
