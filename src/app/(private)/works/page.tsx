import { LibraryPage } from "@/features/library/library-page";

export default async function WorksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <LibraryPage kind="works" searchParams={await searchParams} />;
}
