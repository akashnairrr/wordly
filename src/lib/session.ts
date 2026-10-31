import type { IndexEntry, Progress } from "./types"

export const MIN_SIZE = 5
export const MAX_SIZE = 15

export type Difficulty = "Easy" | "Moderate" | "Hard"

export const DIFFICULTY_NOTE: Record<Difficulty, string> = {
  Easy: "A comfortable pace for daily practice. Good if you're new to the language.",
  Moderate: "More words per lesson = longer quiz + more to remember.",
  Hard: "A heavy lesson. Retention drops when you learn too many new words at once.",
}

export function difficulty(size: number): Difficulty {
  return size <= 8 ? "Easy" : size <= 12 ? "Moderate" : "Hard"
}

export function clampSize(n: number): number {
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(n)))
}

export type WordStatus = "new" | "studied" | "practice" | "skipped"

export function wordStatus(id: string, p: Progress): WordStatus {
  if (p.skipped[id]) return "skipped"
  const l = p.learned[id]
  if (!l) return "new"
  return l.wrong > 0 && l.wrong >= l.correct ? "practice" : "studied"
}

/** The next most frequent words never studied or skipped. */
export function pickNewWords(
  index: IndexEntry[],
  progress: Progress,
  size: number,
  exclude: Set<string> = new Set()
): IndexEntry[] {
  return index
    .filter((w) => !progress.learned[w.id] && !progress.skipped[w.id] && !exclude.has(w.id))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, clampSize(size))
}

/** Studied words, most in need of practice first: more misses than hits, then least recently seen. */
export function reviewQueue(index: IndexEntry[], progress: Progress, onlyPractice = false): IndexEntry[] {
  // Only called on studied words (filtered below).
  const stats = (id: string) => progress.learned[id]!
  const need = (id: string) => stats(id).wrong - stats(id).correct
  const seen = (id: string) => stats(id).reviewedAt ?? stats(id).learnedAt
  return index
    .filter(
      (w) =>
        progress.learned[w.id] &&
        !progress.skipped[w.id] &&
        (!onlyPractice || wordStatus(w.id, progress) === "practice")
    )
    .sort((a, b) => need(b.id) - need(a.id) || seen(a.id).localeCompare(seen(b.id)))
}

/** Old words mixed into a lesson: 1 per 5 new words (5 → 1, 10 → 2, 15 → 3). */
export const reviewsPerLesson = (size: number) => Math.ceil(clampSize(size) / 5)

/** A lesson = the next new words plus a few studied words that need another look. */
export function planLesson(index: IndexEntry[], progress: Progress, size: number) {
  return {
    fresh: pickNewWords(index, progress, size),
    review: reviewQueue(index, progress).slice(0, reviewsPerLesson(size)),
  }
}
