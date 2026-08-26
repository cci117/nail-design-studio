import { LibraryEditorPage } from "@/features/library/library-editor-page";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditFavoriteAssetPage({ params }: PageProps) {
  const { id } = await params;
  return <LibraryEditorPage kind="favorite-assets" id={id} />;
}
