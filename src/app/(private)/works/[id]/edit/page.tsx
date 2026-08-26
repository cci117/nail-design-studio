import { LibraryEditorPage } from "@/features/library/library-editor-page";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ stage?: string }> };

export default async function EditWorkPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <LibraryEditorPage kind="works" id={id} stage={query.stage === "details" ? "details" : "media"} />;
}
