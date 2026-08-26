import { PageHeader } from "@/components/layout/page-header";
import { tagRepository } from "@/data/repositories/supabase/tag-repository";
import { TagManager } from "@/features/tags/tag-manager";

export default async function TagsPage() {
  const tags = await tagRepository.list();
  return <><PageHeader title="标签管理" description="管理甲型、风格与其他标签" backHref="/more"/><TagManager tags={tags}/></>;
}
