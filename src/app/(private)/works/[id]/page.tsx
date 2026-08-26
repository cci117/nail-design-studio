import { LibraryDetail } from "@/features/library/library-detail";

type PageProps = { params: Promise<{ id: string }> };

export default async function WorkDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <LibraryDetail kind="works" id={id} />;
}
