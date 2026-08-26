"use client";
import { useState, useTransition } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteLibraryItem } from "./library-actions";
import type { LibraryKind } from "./library-config";
import { buttonStyles } from "@/components/ui/button";
export function DeleteButton({ kind, id }: { kind: LibraryKind; id: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  function remove() {
    if (!window.confirm("确定删除这条资料？删除后将不再显示。")) return;
    setError(null);
    startTransition(async () => { const result = await deleteLibraryItem(kind, id); if (result?.error) setError(result.error); });
  }
  return <div><button type="button" disabled={pending} onClick={remove} className={buttonStyles({ variant: "danger", className: "h-12 w-full sm:w-auto" })}>{pending ? <LoaderCircle size={16} className="animate-spin"/> : <Trash2 size={16}/>} {pending ? "删除中…" : "删除"}</button>{error && <p className="mt-2 text-xs text-red-300">{error}</p>}</div>;
}
