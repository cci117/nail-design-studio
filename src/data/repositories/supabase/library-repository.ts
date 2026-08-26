import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BaseEntity } from "@/types/domain";
import type { LibraryTable } from "@/features/library/library-config";

export type LibraryRecord = BaseEntity & Record<string, unknown>;

async function client() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase 未配置");
  return supabase;
}

export const libraryRepository = {
  async list(table: LibraryTable) {
    const supabase = await client();
    const { data, error } = await supabase.from(table).select("*").is("deleted_at", null).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as LibraryRecord[];
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
