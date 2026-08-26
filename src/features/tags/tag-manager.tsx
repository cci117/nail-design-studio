"use client";

import { useActionState, useState, useTransition } from "react";
import { LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { createTagAction, deleteTagAction, renameTagAction, tagUsageAction } from "./tag-actions";
import { initialTagActionState } from "./tag-action-state";
import { tagGroupLabels, tagGroups, type Tag, type TagGroup } from "./tag-types";
import { buttonStyles } from "@/components/ui/button";

function CreateTagForm({ group }: { group: TagGroup }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createTagAction.bind(null, group), initialTagActionState);
  if (!open) return <button type="button" onClick={() => setOpen(true)} className={buttonStyles({ variant: "secondary", size: "compact" })}><Plus className="size-4"/>新建标签</button>;
  return <form action={action} className="flex min-w-0 flex-col gap-2 sm:flex-row"><input name="name" required maxLength={40} autoFocus placeholder={`新建${tagGroupLabels[group]}标签`} className="h-11 min-w-0 flex-1 rounded-xl border border-zinc-700 bg-black px-3 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"/><button disabled={pending} className={buttonStyles({ size: "compact", className: "h-11" })}>{pending ? "保存中…" : "保存"}</button><button type="button" onClick={() => setOpen(false)} aria-label="取消新建" className={buttonStyles({ variant: "ghost", size: "icon" })}><X className="size-4"/></button>{state.error && <p role="alert" className="text-sm text-red-300 sm:basis-full">{state.error}</p>}{state.tag && <p role="status" className="text-sm text-emerald-300 sm:basis-full">标签已创建，可继续添加或关闭。</p>}</form>;
}

function TagRow({ tag }: { tag: Tag }) {
  const [editing, setEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [state, renameAction, renaming] = useActionState(renameTagAction.bind(null, tag.id), initialTagActionState);
  const [deleting, startDeleting] = useTransition();

  function remove() {
    if (!window.confirm(`准备删除标签“${tag.name}”？下一步将检查使用情况。`)) return;
    setDeleteError(null);
    startDeleting(async () => {
      const usage = await tagUsageAction(tag.id);
      if (usage.error) { setDeleteError(usage.error); return; }
      const message = usage.count > 0
        ? `此标签正在被 ${usage.count} 个项目使用，删除后将从这些项目中移除。业务内容不会被删除。确认继续？`
        : "此标签尚未被使用。确认永久删除该标签？";
      if (!window.confirm(message)) return;
      const result = await deleteTagAction(tag.id);
      if (result.error) setDeleteError(result.error);
    });
  }

  return <div className="border-t border-border py-3 first:border-t-0">{editing ? <form action={renameAction} className="flex min-w-0 flex-col gap-2 sm:flex-row"><input name="name" required maxLength={40} defaultValue={tag.name} autoFocus className="h-11 min-w-0 flex-1 rounded-xl border border-zinc-700 bg-black px-3 text-sm text-white focus:border-zinc-400 focus:outline-none"/><button disabled={renaming} className={buttonStyles({ size: "compact", className: "h-11" })}>{renaming ? "保存中…" : "保存"}</button><button type="button" onClick={() => setEditing(false)} className={buttonStyles({ variant: "ghost", size: "compact" })}>取消</button>{state.error && <p role="alert" className="text-sm text-red-300 sm:basis-full">{state.error}</p>}{state.tag && <p role="status" className="text-sm text-emerald-300 sm:basis-full">名称已更新。</p>}</form> : <div className="flex min-w-0 items-center gap-2"><span className="min-w-0 flex-1 truncate text-sm text-zinc-100">{tag.name}</span><button type="button" onClick={() => setEditing(true)} className={buttonStyles({ variant: "ghost", size: "compact" })}><Pencil className="size-4"/>改名</button><button type="button" disabled={deleting} onClick={remove} className={buttonStyles({ variant: "danger", size: "compact" })}>{deleting ? <LoaderCircle className="size-4 animate-spin"/> : <Trash2 className="size-4"/>}删除</button></div>}{deleteError && <p role="alert" className="mt-2 text-sm text-red-300">{deleteError}</p>}</div>;
}

export function TagManager({ tags }: { tags: Tag[] }) {
  return <div className="space-y-6">{tagGroups.map((group) => <section key={group} className="rounded-2xl border border-border bg-surface p-4 sm:p-5"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-medium text-white">{tagGroupLabels[group]}</h2><p className="mt-1 text-xs text-zinc-500">{tags.filter((tag) => tag.tag_group === group).length} 个标签</p></div><CreateTagForm group={group}/></div><div>{tags.filter((tag) => tag.tag_group === group).map((tag) => <TagRow key={`${tag.id}:${tag.updated_at}`} tag={tag}/>)}{!tags.some((tag) => tag.tag_group === group) && <p className="border-t border-border py-5 text-sm text-zinc-600">暂无标签</p>}</div></section>)}</div>;
}
