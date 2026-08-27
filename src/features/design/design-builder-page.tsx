import { notFound } from "next/navigation";
import { libraryRepository } from "@/data/repositories/supabase/library-repository";
import { mediaRepository } from "@/data/repositories/supabase/media-repository";
import { tagRepository } from "@/data/repositories/supabase/tag-repository";
import { designRepository } from "@/data/repositories/supabase/design-repository";
import { DesignBuilder } from "./design-builder";
import { fingerKeys, type DesignChoice, type DesignStructuredData } from "./design-types";

function isStructured(value: unknown): value is DesignStructuredData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<DesignStructuredData>;
  return data.schema_version === 1 && Boolean(data.selection) && Boolean(data.fingers) && fingerKeys.every((key) => Boolean(data.fingers?.[key]));
}

export async function DesignBuilderPage({ designId }: { designId?: string }) {
  const [inspirationRows, materialRows, tags] = await Promise.all([
    libraryRepository.list("inspirations", { status: "active", sort: "updated" }),
    libraryRepository.list("assets", { status: "active", sort: "updated" }),
    tagRepository.list(),
  ]);
  const [inspirationCovers, materialCovers, saved] = await Promise.all([
    mediaRepository.covers("inspiration", inspirationRows.map((item) => item.id)),
    mediaRepository.covers("asset", materialRows.map((item) => item.id)),
    designId ? designRepository.get(designId) : Promise.resolve(null),
  ]);
  if (designId && !saved) notFound();
  const inspirations: DesignChoice[] = inspirationRows.map((item) => ({ id: item.id, label: String(item.title ?? "灵感"), imageUrl: inspirationCovers.get(item.id) }));
  const materials: DesignChoice[] = materialRows.map((item) => ({ id: item.id, label: String(item.name ?? "材料"), imageUrl: materialCovers.get(item.id), meta: typeof item.category === "string" ? item.category : undefined }));
  const structured = saved?.version && isStructured(saved.version.structured_data) ? saved.version.structured_data : undefined;
  return <DesignBuilder inspirations={inspirations} materials={materials} tags={tags.map((tag) => ({ id: tag.id, name: tag.name, group: tag.tag_group }))} designId={saved?.design.id} initialTitle={saved?.design.title} initial={structured}/>;
}
