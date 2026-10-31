"use client"

import { useEffect, useState } from "react"
import { fetchIndex } from "@/lib/data"
import type { IndexEntry } from "@/lib/types"

export function useIndex(lang: string): { index: IndexEntry[] | null; error: string | null } {
  const [index, setIndex] = useState<IndexEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    fetchIndex(lang).then(
      (i) => live && setIndex(i),
      (e: Error) => live && setError(e.message)
    )
    return () => {
      live = false
    }
  }, [lang])
  return { index, error }
}
