import { LibraryPage } from "@/features/library/library-page";

export default async function InspirationPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <LibraryPage kind="inspiration" searchParams={await searchParams} />;
}
