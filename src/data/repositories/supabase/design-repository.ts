import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Design, DesignVersion } from "@/types/domain";
import type { DesignStructuredData } from "@/features/design/design-types";

async function client() { const supabase = await createClient(); if (!supabase) throw new Error("Supabase 未配置"); return supabase; }

export const designRepository = {
  async list() {
    const supabase = await client();
    const { data, error } = await supabase.from("designs").select("*").is("deleted_at", null).order("updated_at", { ascending: false });
    if (error) throw new Error(error.message); return (data ?? []) as Design[];
  },
  async get(id: string) {
    const supabase = await client();
    const { data: design, error } = await supabase.from("designs").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
    if (error) throw new Error(error.message); if (!design) return null;
    const { data: version, error: versionError } = await supabase.from("design_versions").select("*").eq("design_id", id).is("deleted_at", null).order("version_number", { ascending: false }).limit(1).maybeSingle();
    if (versionError) throw new Error(versionError.message);
    return { design: design as Design, version: version as DesignVersion | null };
  },
  async save(userId: string, title: string, requirement: string, structuredData: DesignStructuredData, designId?: string) {
    const supabase = await client();
    if (designId) {
      const { data: existing, error: readError } = await supabase.from("designs").select("id,version").eq("id", designId).is("deleted_at", null).single();
      if (readError) throw new Error(readError.message);
      const { error: updateError } = await supabase.from("designs").update({ title, notes: requirement || null, status: "draft", version: existing.version + 1 }).eq("id", designId);
      if (updateError) throw new Error(updateError.message);
      const { data: latest, error: latestError } = await supabase.from("design_versions").select("version_number").eq("design_id", designId).order("version_number", { ascending: false }).limit(1).maybeSingle();
      if (latestError) throw new Error(latestError.message);
      const { error: versionError } = await supabase.from("design_versions").insert({ user_id: userId, design_id: designId, version_number: (latest?.version_number ?? 0) + 1, version_type: "ten_finger_plan", description: requirement || null, structured_data: structuredData });
      if (versionError) throw new Error(versionError.message); return designId;
    }
    const { data: design, error } = await supabase.from("designs").insert({ user_id: userId, title, notes: requirement || null, status: "draft" }).select("id").single();
    if (error) throw new Error(error.message);
    const { error: versionError } = await supabase.from("design_versions").insert({ user_id: userId, design_id: design.id, version_number: 1, version_type: "ten_finger_plan", description: requirement || null, structured_data: structuredData });
    if (versionError) throw new Error(versionError.message); return design.id as string;
  },
};
