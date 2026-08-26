import { LibraryEditorPage } from "@/features/library/library-editor-page";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ stage?: string }> };

export default async function EditInspirationPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <LibraryEditorPage kind="inspiration" id={id} stage={query.stage === "details" ? "details" : "media"} />;
}
