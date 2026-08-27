import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Design, DesignVersion } from "@/types/domain";
import type { DesignStructuredData } from "@/features/design/design-types";
import type { DesignVersionChoice, WorkAssetChoice } from "@/features/works/work-types";

async function client() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase 未配置");
  return supabase;
}

export const workOutcomeRepository = {
  async designVersionChoices(): Promise<DesignVersionChoice[]> {
    const supabase = await client();
    const [{ data: designs, error: designError }, { data: versions, error: versionError }] = await Promise.all([
      supabase.from("designs").select("id,title").is("deleted_at", null).order("updated_at", { ascending: false }),
      supabase.from("design_versions").select("id,design_id,version_number,version_type,structured_data").is("deleted_at", null).order("created_at", { ascending: false }),
    ]);
    if (designError) throw new Error(designError.message);
    if (versionError) throw new Error(versionError.message);
    const titles = new Map((designs ?? []).map((design) => [design.id, design.title]));
    return (versions ?? []).flatMap((version) => {
      const title = titles.get(version.design_id);
      return title ? [{ id: version.id, designId: version.design_id, designTitle: title, versionNumber: version.version_number, versionType: version.version_type, structuredData: version.structured_data as DesignStructuredData }] : [];
    });
  },

  async sourceVersion(id: string) {
    const supabase = await client();
    const { data: version, error } = await supabase.from("design_versions").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
    if (error) throw new Error(error.message);
    if (!version) return null;
    const { data: design, error: designError } = await supabase.from("designs").select("*").eq("id", version.design_id).is("deleted_at", null).maybeSingle();
    if (designError) throw new Error(designError.message);
    return design ? { design: design as Design, version: version as DesignVersion } : null;
  },

  async assetChoices(): Promise<WorkAssetChoice[]> {
    const supabase = await client();
    const { data, error } = await supabase.from("assets").select("id,name,category,brand,color").eq("status", "active").is("deleted_at", null).order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as WorkAssetChoice[];
  },

  async assetIds(workId: string) {
    const supabase = await client();
    const { data, error } = await supabase.from("work_assets").select("asset_id").eq("work_id", workId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => row.asset_id as string);
  },

  async assetsForWork(workId: string): Promise<WorkAssetChoice[]> {
    const supabase = await client();
    const { data: links, error: linkError } = await supabase.from("work_assets").select("asset_id").eq("work_id", workId);
    if (linkError) throw new Error(linkError.message);
    const ids = (links ?? []).map((row) => row.asset_id as string);
    if (!ids.length) return [];
    const { data, error } = await supabase.from("assets").select("id,name,category,brand,color").in("id", ids).is("deleted_at", null).order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as WorkAssetChoice[];
  },

  async syncAssets(userId: string, workId: string, assetIds: string[]) {
    const supabase = await client();
    const { error: deleteError } = await supabase.from("work_assets").delete().eq("user_id", userId).eq("work_id", workId);
    if (deleteError) throw new Error(deleteError.message);
    if (!assetIds.length) return;
    const { error } = await supabase.from("work_assets").insert(assetIds.map((assetId) => ({ user_id: userId, work_id: workId, asset_id: assetId })));
    if (error) throw new Error(error.message);
  },
};
