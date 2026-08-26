import { LibraryPage } from "@/features/library/library-page";

export default async function AssetsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <LibraryPage kind="assets" searchParams={await searchParams} />;
}
