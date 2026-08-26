"use client";

import { LibraryRouteError } from "@/features/library/library-route-error";

export default function FavoriteAssetsError({ reset }: { reset: () => void }) {
  return <LibraryRouteError reset={reset} />;
}
