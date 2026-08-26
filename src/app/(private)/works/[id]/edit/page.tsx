import { LibraryEditorPage } from "@/features/library/library-editor-page";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditWorkPage({ params }: PageProps) {
  const { id } = await params;
  return <LibraryEditorPage kind="works" id={id} />;
}
