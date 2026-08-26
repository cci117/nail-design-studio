"use client";

import { useState, useTransition } from "react";
import { Check, LoaderCircle, Plus, X } from "lucide-react";
import { createTagAction } from "./tag-actions";
import { suggestedTags, tagGroupLabels, type Tag, type TagGroup } from "./tag-types";
import { buttonStyles, chipStyles } from "@/components/ui/button";

type TagSelectorProps = {
  initialTags: Tag[];
  initialSelectedIds: string[];
  groups?: TagGroup[];
};

export function TagSelector({
  initialTags,
  initialSelectedIds,
  groups = ["shape", "style"],
}: TagSelectorProps) {
  const [tags, setTags] = useState(initialTags);
  const [selected, setSelected] = useState(() => new Set(initialSelectedIds));
  const [creatingGroup, setCreatingGroup] = useState<TagGroup | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function create(group: TagGroup, value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setError(null);
    const formData = new FormData();
    formData.set("name", trimmed);
    startTransition(async () => {
      const result = await createTagAction(group, { error: null }, formData);
      if (result.error || !result.tag) {
        setError(result.error ?? "标签创建失败，请重试。");
        return;
      }
      setTags((current) => [...current, result.tag!]);
      setSelected((current) => new Set(current).add(result.tag!.id));
      setName("");
      setCreatingGroup(null);
    });
  }

  return (
    <fieldset className="space-y-6 rounded-2xl border border-border bg-black/40 p-4 sm:p-5">
      <legend className="px-2 text-sm font-medium text-zinc-200">标签</legend>
      {groups.map((group) => {
        const groupTags = tags.filter((tag) => tag.tag_group === group);
        const existingNames = new Set(groupTags.map((tag) => tag.name.toLocaleLowerCase()));
        const suggestions = group === "other"
          ? []
          : suggestedTags[group].filter((suggestion) => !existingNames.has(suggestion.toLocaleLowerCase()));
        return (
          <div key={group}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-zinc-400">{tagGroupLabels[group]}</span>
              <button
                type="button"
                onClick={() => { setCreatingGroup(creatingGroup === group ? null : group); setError(null); }}
                className={buttonStyles({ variant: "ghost", size: "compact", className: "text-xs" })}
              >
                {creatingGroup === group ? <X className="size-4" /> : <Plus className="size-4" />}
                {creatingGroup === group ? "收起" : "新建标签"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {groupTags.map((tag) => {
                const active = selected.has(tag.id);
                return (
                  <label
                    key={tag.id}
                    className={chipStyles(active)}
                  >
                    <input
                      type="checkbox"
                      name="tag_ids"
                      value={tag.id}
                      checked={active}
                      onChange={() => toggle(tag.id)}
                      className="sr-only"
                    />
                    {active && <Check className="size-3.5 shrink-0" />}
                    <span className="truncate">{tag.name}</span>
                  </label>
                );
              })}
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={pending}
                  onClick={() => create(group, suggestion)}
                  className={chipStyles(false, "border-dashed disabled:border-[#3a3a3a] disabled:bg-[#202020] disabled:text-[#9a9a9a]")}
                >
                  + {suggestion}
                </button>
              ))}
            </div>
            {creatingGroup === group && (
              <div className="mt-3 flex min-w-0 gap-2">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={40}
                  placeholder={`新建${tagGroupLabels[group]}标签`}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={pending || !name.trim()}
                  onClick={() => create(group, name)}
                  className={buttonStyles({ size: "compact", className: "h-11 shrink-0" })}
                >
                  {pending ? <LoaderCircle className="size-4 animate-spin" /> : "添加"}
                </button>
              </div>
            )}
          </div>
        );
      })}
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    </fieldset>
  );
}
