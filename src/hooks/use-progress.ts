"use client"

import { useCallback, useSyncExternalStore } from "react"
import { loadProgress, saveProgress } from "@/lib/progress"
import type { Progress } from "@/lib/types"

// One in-memory snapshot per language, shared by every component; localStorage is the source of truth.
const snapshots = new Map<string, Progress>()
const listeners = new Set<() => void>()

function get(lang: string): Progress {
  let p = snapshots.get(lang)
  if (!p) snapshots.set(lang, (p = loadProgress(lang)))
  return p
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Another tab changed progress: drop cached snapshots so the next read picks it up.
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith("wordly:")) {
      snapshots.clear()
      listener()
    }
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

/** Progress for `lang`; null during prerender/first paint (localStorage isn't readable on the server). */
export function useProgress(lang: string): readonly [Progress | null, (fn: (p: Progress) => Progress) => void] {
  const progress = useSyncExternalStore(
    subscribe,
    () => get(lang),
    () => null
  )
  const update = useCallback(
    (fn: (p: Progress) => Progress) => {
      const next = fn(get(lang))
      snapshots.set(lang, next)
      saveProgress(lang, next)
      listeners.forEach((l) => l())
    },
    [lang]
  )
  return [progress, update] as const
}
