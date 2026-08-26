import type { LucideIcon } from "lucide-react";
import { EmptyState } from "./empty-state";
import { PageHeader } from "@/components/layout/page-header";
export function ContentPlaceholder({ title, description, icon, emptyTitle = "暂无内容", emptyDescription = "资料功能将在后续版本中逐步开放。" }: { title: string; description: string; icon: LucideIcon; emptyTitle?: string; emptyDescription?: string }) {
  return <><PageHeader title={title} description={description} /><EmptyState icon={icon} title={emptyTitle} description={emptyDescription} /></>;
}
