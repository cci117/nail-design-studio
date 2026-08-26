import type { EntityKind } from "@/types/domain";

export const tagGroups = ["shape", "style", "other"] as const;
export type TagGroup = (typeof tagGroups)[number];

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  tag_group: string;
  created_at: string;
  updated_at: string;
}

export interface EntityTag {
  id: string;
  user_id: string;
  tag_id: string;
  entity_type: EntityKind;
  entity_id: string;
  created_at: string;
}

export const tagGroupLabels: Record<string, string> = {
  shape: "甲型",
  style: "风格",
  other: "其他",
};

export const suggestedTags: Record<"shape" | "style", string[]> = {
  shape: ["杏仁形", "方形", "方圆形", "圆形", "椭圆形", "尖形"],
  style: ["韩系", "日系", "法式", "清透", "极简", "暗黑", "Y2K", "甜酷"],
};

export function isTagGroup(value: string): value is TagGroup {
  return tagGroups.includes(value as TagGroup);
}
