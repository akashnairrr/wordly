import type { IndexEntry, Progress } from "./types"

export interface Level {
  n: number
  name: string
  /** Frequency ranks covered, inclusive. */
  from: number
  to: number
}

// Bands of the frequency list, roughly doubling: the first 500 words cover ~3/4 of speech, the last 1,500 add ~2%.
export const LEVELS: Level[] = [
  { n: 1, name: "Beginner", from: 1, to: 500 },
  { n: 2, name: "Elementary", from: 501, to: 1000 },
  { n: 3, name: "Pre-intermediate", from: 1001, to: 2000 },
  { n: 4, name: "Intermediate", from: 2001, to: 3500 },
  { n: 5, name: "Upper-intermediate", from: 3501, to: 5000 },
]

export function levelOf(rank: number): Level {
  return LEVELS.find((l) => rank <= l.to) ?? LEVELS[LEVELS.length - 1]!
}

/** "Level 2 · Elementary" */
export const levelLabel = (l: Level) => `Level ${l.n} · ${l.name}`

const done = (w: IndexEntry, p: Progress) => !!p.learned[w.id] || !!p.skipped[w.id]

/** Studied (or skipped) words out of the level's words in this index. */
export function levelProgress(index: IndexEntry[], p: Progress, level: Level): { done: number; total: number } {
  const words = index.filter((w) => levelOf(w.rank).n === level.n)
  return { done: words.filter((w) => done(w, p)).length, total: words.length }
}

/** The first level with words left to learn; the last level once everything is done. */
export function currentLevel(index: IndexEntry[], p: Progress): Level {
  const next = index.filter((w) => !done(w, p)).sort((a, b) => a.rank - b.rank)[0]
  return next ? levelOf(next.rank) : LEVELS[LEVELS.length - 1]!
}
