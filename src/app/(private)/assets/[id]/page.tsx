import { LibraryDetail } from "@/features/library/library-detail";

type PageProps = { params: Promise<{ id: string }> };

export default async function AssetDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <LibraryDetail kind="assets" id={id} />;
}
