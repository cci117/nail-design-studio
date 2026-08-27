"use client";
import { useActionState } from "react";
import Link from "next/link";
import { createLibraryItem, updateLibraryItem } from "./library-actions";
import { initialFormState } from "./library-form-state";
import { getLibraryDefinition, type LibraryKind } from "./library-config";
import type { LibraryRecord } from "@/data/repositories/supabase/library-repository";
import { SubmitButton } from "./submit-button";
import { TagSelector } from "@/features/tags/tag-selector";
import type { Tag } from "@/features/tags/tag-types";
import { buttonStyles } from "@/components/ui/button";

function displayValue(item: LibraryRecord | undefined, name: string) {
  const current = item?.[name];
  if (name === "completed_at" && typeof current === "string") return current.slice(0, 10);
  return typeof current === "string" || typeof current === "number" ? current : "";
}

export function LibraryForm({ kind, item, tags = [], selectedTagIds = [] }: { kind: LibraryKind; item?: LibraryRecord; tags?: Tag[]; selectedTagIds?: string[] }) {
  const definition = getLibraryDefinition(kind);
  const action = item ? updateLibraryItem.bind(null, kind, item.id) : createLibraryItem.bind(null, kind);
  const [state, formAction] = useActionState(action, initialFormState);
  const draft = item?.status === "draft";
  const cancelHref = item && !draft ? `${definition.path}/${item.id}` : definition.path;
  return <form action={formAction} className="space-y-5"><div className="grid gap-5 sm:grid-cols-2">{definition.fields.map((field) => {
    const shared = { id: field.name, name: field.name, required: field.required, defaultValue: displayValue(item, field.name), placeholder: field.placeholder, className: "mt-2 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none" };
    return <label key={field.name} className={`block ${field.type === "textarea" || field.name === "notes" ? "sm:col-span-2" : ""}`}><span className="text-xs font-medium text-zinc-400">{field.label}{field.required && <span className="ml-1 text-accent">*</span>}</span>{field.type === "textarea" ? <textarea {...shared} rows={5} className={`${shared.className} min-h-32 py-3 leading-6`} /> : <input {...shared} type={field.type ?? "text"} min={field.type === "number" ? 0 : undefined} step={field.type === "number" ? "any" : undefined} className={`${shared.className} h-12`} />}</label>;
  })}</div>{definition.supportsTags && <TagSelector initialTags={tags} initialSelectedIds={selectedTagIds}/>} {state.error && <p role="alert" className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">{state.error}</p>}<div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end"><Link href={cancelHref} className={buttonStyles({ variant: "secondary", className: "h-12" })}>取消</Link><SubmitButton label={draft ? "完成" : item ? "保存修改" : `添加${definition.singular}`} /></div></form>;
}
