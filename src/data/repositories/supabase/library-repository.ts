import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BaseEntity } from "@/types/domain";
import type { LibraryTable } from "@/features/library/library-config";

export type LibraryRecord = BaseEntity & Record<string, unknown>;

export interface LibraryListQuery {
  q?: string;
  status?: "active" | "draft";
  categories?: string[];
  brands?: string[];
  colors?: string[];
  stock?: "available" | "empty" | "unknown";
  completedFrom?: string;
  completedTo?: string;
  sort: "updated" | "created_desc" | "created_asc" | "completed_desc" | "name_asc";
}

const searchFields: Record<LibraryTable, string[]> = {
  inspirations: ["title", "notes"],
  favorite_assets: ["name", "category", "notes"],
  assets: ["name", "brand", "color", "notes"],
  works: ["title", "notes"],
};

function safeSearch(value: string) {
  return value.replace(/[,().%_\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}

async function client() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase 未配置");
  return supabase;
}

export const libraryRepository = {
  async list(table: LibraryTable, filters?: LibraryListQuery) {
    const supabase = await client();
    let query = supabase.from(table).select("*").is("deleted_at", null);
    const q = safeSearch(filters?.q ?? "");
    if (q) query = query.or(searchFields[table].map((field) => `${field}.ilike.%${q}%`).join(","));
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.categories?.length) query = query.in("category", filters.categories);
    if (filters?.brands?.length) query = query.in("brand", filters.brands);
    if (filters?.colors?.length) query = query.in("color", filters.colors);
    if (filters?.stock === "available") query = query.gt("quantity", 0);
    if (filters?.stock === "empty") query = query.eq("quantity", 0);
    if (filters?.stock === "unknown") query = query.is("quantity", null);
    if (filters?.completedFrom) query = query.gte("completed_at", filters.completedFrom);
    if (filters?.completedTo) query = query.lte("completed_at", filters.completedTo);

    if (filters?.sort === "updated") query = query.order("updated_at", { ascending: false }).order("created_at", { ascending: false });
    else if (filters?.sort === "created_asc") query = query.order("created_at", { ascending: true });
    else if (filters?.sort === "completed_desc") query = query.order("completed_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
    else if (filters?.sort === "name_asc") query = query.order(table === "inspirations" || table === "works" ? "title" : "name", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as LibraryRecord[];
  },
  async facets(table: LibraryTable, fields: string[]) {
    if (!fields.length) return {} as Record<string, string[]>;
    const supabase = await client();
    const { data, error } = await supabase.from(table).select(fields.join(",")).is("deleted_at", null);
    if (error) throw new Error(error.message);
    const result: Record<string, string[]> = {};
    for (const field of fields) {
      result[field] = [...new Set((data ?? []).map((row) => (row as unknown as Record<string, unknown>)[field]).filter((value): value is string => typeof value === "string" && Boolean(value.trim())).map((value) => value.trim()))].sort((first, second) => first.localeCompare(second, "zh-CN"));
    }
    return result;
  },
  async getById(table: LibraryTable, id: string) {
    const supabase = await client();
    const { data, error } = await supabase.from(table).select("*").eq("id", id).is("deleted_at", null).maybeSingle();
    if (error) throw new Error(error.message);
    return data as LibraryRecord | null;
  },
  async create(table: LibraryTable, userId: string, values: Record<string, string | number | null>) {
    const supabase = await client();
    const { data, error } = await supabase.from(table).insert({ ...values, user_id: userId }).select("*").single();
    if (error) throw new Error(error.message);
    return data as LibraryRecord;
  },
  async update(table: LibraryTable, id: string, values: Record<string, string | number | null>) {
    const supabase = await client();
    const { data, error } = await supabase.from(table).update(values).eq("id", id).is("deleted_at", null).select("*").single();
    if (error) throw new Error(error.message);
    return data as LibraryRecord;
  },
  async softDelete(table: LibraryTable, id: string) {
    const supabase = await client();
    const { error } = await supabase.from(table).update({ deleted_at: new Date().toISOString() }).eq("id", id).is("deleted_at", null);
    if (error) throw new Error(error.message);
  },
};
