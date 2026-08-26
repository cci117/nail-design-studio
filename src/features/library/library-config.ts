import { Images, PackageOpen, Palette, Sparkles, type LucideIcon } from "lucide-react";
import type { EntityKind } from "@/types/domain";

export type LibraryKind = "inspiration" | "favorite-assets" | "assets" | "works";
export type LibraryTable = "inspirations" | "favorite_assets" | "assets" | "works";
export type FieldName = "title" | "name" | "category" | "brand" | "color" | "quantity" | "unit" | "completed_at" | "notes";

export interface LibraryField {
  name: FieldName;
  label: string;
  required?: boolean;
  type?: "text" | "number" | "date" | "textarea";
  placeholder?: string;
}

export interface LibraryDefinition {
  kind: LibraryKind;
  table: LibraryTable;
  path: string;
  title: string;
  singular: string;
  description: string;
  emptyTitle: string;
  icon: LucideIcon;
  titleField: "title" | "name";
  entityType: EntityKind;
  supportsTags?: boolean;
  fields: LibraryField[];
}

const definitions: Record<LibraryKind, LibraryDefinition> = {
  inspiration: {
    kind: "inspiration", table: "inspirations", path: "/inspiration", title: "灵感库", singular: "灵感", description: "收藏的完整美甲款式与设计", emptyTitle: "还没有灵感", icon: Images, titleField: "title", entityType: "inspiration", supportsTags: true,
    fields: [{ name: "title", label: "标题", required: true, placeholder: "为灵感命名" }, { name: "notes", label: "备注", type: "textarea", placeholder: "记录风格、配色或细节" }],
  },
  "favorite-assets": {
    kind: "favorite-assets", table: "favorite_assets", path: "/favorite-assets", title: "收藏素材", singular: "收藏素材", description: "喜欢但不一定实际拥有的素材", emptyTitle: "还没有收藏素材", icon: Sparkles, titleField: "name", entityType: "favorite_asset",
    fields: [{ name: "name", label: "名称", required: true, placeholder: "素材或物品名称" }, { name: "category", label: "分类", placeholder: "例如：饰品、贴纸" }, { name: "notes", label: "备注", type: "textarea" }],
  },
  assets: {
    kind: "assets", table: "assets", path: "/assets", title: "材料库", singular: "材料", description: "实际拥有、可用于制作的美甲材料", emptyTitle: "材料库为空", icon: PackageOpen, titleField: "name", entityType: "asset",
    fields: [{ name: "name", label: "名称", required: true, placeholder: "材料名称" }, { name: "category", label: "分类", required: true, placeholder: "例如：甲油胶、钻饰" }, { name: "brand", label: "品牌" }, { name: "color", label: "颜色" }, { name: "quantity", label: "数量", type: "number" }, { name: "unit", label: "单位", placeholder: "瓶、盒、个" }, { name: "notes", label: "备注", type: "textarea" }],
  },
  works: {
    kind: "works", table: "works", path: "/works", title: "作品", singular: "作品", description: "实际已完成的美甲成品", emptyTitle: "还没有作品", icon: Palette, titleField: "title", entityType: "work", supportsTags: true,
    fields: [{ name: "title", label: "标题", required: true, placeholder: "为作品命名" }, { name: "completed_at", label: "完成日期", type: "date" }, { name: "notes", label: "备注", type: "textarea" }],
  },
};

export function getLibraryDefinition(kind: LibraryKind) { return definitions[kind]; }
export function isLibraryKind(value: string): value is LibraryKind { return value in definitions; }
