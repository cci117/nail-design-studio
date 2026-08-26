"use client";

import { LibraryRouteError } from "@/features/library/library-route-error";

export default function TagsError({ reset }: { reset: () => void }) {
  return <LibraryRouteError reset={reset}/>;
}
