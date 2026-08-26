"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tagRepository } from "@/data/repositories/supabase/tag-repository";
import { isTagGroup } from "./tag-types";
import type { TagActionState } from "./tag-action-state";

async function authenticatedUserId() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase 未配置。");
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("登录已失效，请重新登录。");
  return user.id;
}

function tagName(value: FormDataEntryValue | null) {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name) throw new Error("请输入标签名称。");
  if (name.length > 40) throw new Error("标签名称不能超过 40 个字符。");
  return name;
}

function friendlyError(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "code" in error && error.code === "23505") {
    return "该分组中已存在同名标签。";
  }
  return error instanceof Error && !error.message.toLowerCase().includes("duplicate")
    ? error.message
    : fallback;
}

export async function createTagAction(
  groupValue: string,
  _state: TagActionState,
  formData: FormData,
): Promise<TagActionState> {
  if (!isTagGroup(groupValue)) return { error: "无效的标签分组。" };
  try {
    const userId = await authenticatedUserId();
    const tag = await tagRepository.create(userId, groupValue, tagName(formData.get("name")));
    revalidatePath("/tags");
    revalidatePath("/inspiration");
    revalidatePath("/works");
    return { error: null, tag };
  } catch (error) {
    return { error: friendlyError(error, "标签创建失败，请重试。") };
  }
}

export async function renameTagAction(
  id: string,
  _state: TagActionState,
  formData: FormData,
): Promise<TagActionState> {
  try {
    await authenticatedUserId();
    const tag = await tagRepository.rename(id, tagName(formData.get("name")));
    revalidatePath("/tags");
    revalidatePath("/inspiration");
    revalidatePath("/works");
    return { error: null, tag };
  } catch (error) {
    return { error: friendlyError(error, "标签修改失败，请重试。") };
  }
}

export async function tagUsageAction(id: string) {
  try {
    await authenticatedUserId();
    return { error: null, count: await tagRepository.usageCount(id) };
  } catch (error) {
    return { error: friendlyError(error, "无法检查标签使用情况。"), count: 0 };
  }
}

export async function deleteTagAction(id: string) {
  try {
    await authenticatedUserId();
    await tagRepository.delete(id);
    revalidatePath("/tags");
    revalidatePath("/inspiration");
    revalidatePath("/works");
    return { error: null };
  } catch (error) {
    return { error: friendlyError(error, "标签删除失败，请重试。") };
  }
}
