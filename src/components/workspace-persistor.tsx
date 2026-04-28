"use client";

import { useEffect } from "react";

export function WorkspacePersistor({ slug }: { slug: string }) {
  useEffect(() => {
    document.cookie = `withvalet:last-workspace=${slug}; path=/; max-age=31536000; samesite=lax`;
  }, [slug]);

  return null;
}
