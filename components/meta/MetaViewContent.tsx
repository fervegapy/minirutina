"use client";

import { useEffect } from "react";
import { metaTrack } from "@/lib/meta-pixel";

/** Fires ViewContent once when a product detail page is shown. */
export default function MetaViewContent({ producto, precio }: { producto: string; precio?: number }) {
  useEffect(() => {
    metaTrack("ViewContent", {
      content_name: producto,
      content_ids:  [producto],
      content_type: "product",
      ...(precio ? { value: precio } : {}),
    });
  }, [producto, precio]);
  return null;
}
