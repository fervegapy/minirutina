"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { metaTrack } from "@/lib/meta-pixel";

/** PageView on client-side navigations. The first load is already counted
 *  by the base snippet in <MetaPixel />, so the initial run is skipped. */
export default function MetaPageView() {
  const pathname = usePathname();
  // Compare by string: the searchParams object identity can change without
  // the URL changing, which would double-count the navigation.
  const search = useSearchParams()?.toString() ?? "";
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (pathname?.startsWith("/admin")) return;
    metaTrack("PageView");
  }, [pathname, search]);
  return null;
}
