import { LibraryEditorPage } from "@/features/library/library-editor-page";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ stage?: string }> };

export default async function EditAssetPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <LibraryEditorPage kind="assets" id={id} stage={query.stage === "details" ? "details" : "media"} />;
}
