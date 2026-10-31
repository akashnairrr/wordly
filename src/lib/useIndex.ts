"use client";

import { useEffect, useState } from "react";
import { fetchIndex } from "./data";
import type { IndexEntry } from "./types";

export function useIndex(lang: string) {
  const [index, setIndex] = useState<IndexEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fetchIndex(lang).then(
      (i) => live && setIndex(i),
      (e: Error) => live && setError(e.message),
    );
    return () => {
      live = false;
    };
  }, [lang]);
  return { index, error };
}
