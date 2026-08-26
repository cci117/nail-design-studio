import { LibraryEditorPage } from "@/features/library/library-editor-page";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditAssetPage({ params }: PageProps) {
  const { id } = await params;
  return <LibraryEditorPage kind="assets" id={id} />;
}
