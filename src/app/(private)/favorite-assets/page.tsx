import { LibraryPage } from "@/features/library/library-page";

export default async function FavoriteAssetsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <LibraryPage kind="favorite-assets" searchParams={await searchParams} />;
}
