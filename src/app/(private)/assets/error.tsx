"use client";

import { LibraryRouteError } from "@/features/library/library-route-error";

export default function AssetsError({ reset }: { reset: () => void }) {
  return <LibraryRouteError reset={reset} />;
}
