import type { IndexEntry, Progress } from "./types"

/** Words per lesson the learner can pick from. */
export interface SizeRange {
  min: number
  max: number
}

/** Outside a course unit (languages without a course, or past its end). */
export const DEFAULT_RANGE: SizeRange = { min: 5, max: 15 }

/** A unit's lessons: at most the whole unit in one go, at least a third of it. */
export const unitRange = (words: number): SizeRange => ({ min: Math.max(1, Math.round(words / 3)), max: words })

export type Difficulty = "Easy" | "Moderate" | "Hard"

export const DIFFICULTY_NOTE: Record<Difficulty, string> = {
  Easy: "A comfortable pace for daily practice. Good if you're new to the language.",
  Moderate: "More words per lesson = longer quiz + more to remember.",
  Hard: "A heavy lesson. Retention drops when you learn too many new words at once.",
}

/** Thirds of the range: Easy from min, Moderate from min + 1/3 of the span, Hard from min + 2/3. */
export function difficulty(size: number, { min, max }: SizeRange = DEFAULT_RANGE): Difficulty {
  const third = (max - min) / 3
  return size >= min + 2 * third ? "Hard" : size >= min + third ? "Moderate" : "Easy"
}

export function clampSize(n: number, { min, max }: SizeRange = DEFAULT_RANGE): number {
  return Math.min(max, Math.max(min, Math.round(n)))
}

const fresh = (index: IndexEntry[], progress: Progress, exclude: Set<string>) =>
  index
    .filter((w) => !progress.learned[w.id] && !progress.skipped[w.id] && !exclude.has(w.id))
    .sort((a, b) => a.order - b.order)

/** Lesson sizes on offer now: from the unit of the next word to learn. */
export function sizeRange(index: IndexEntry[], progress: Progress): SizeRange {
  const unit = fresh(index, progress, new Set())[0]?.unit
  return unit ? unitRange(index.filter((w) => w.unit === unit).length) : DEFAULT_RANGE
}

export type WordStatus = "new" | "studied" | "practice" | "skipped"

export function wordStatus(id: string, p: Progress): WordStatus {
  if (p.skipped[id]) return "skipped"
  const l = p.learned[id]
  if (!l) return "new"
  return l.wrong > 0 && l.wrong >= l.correct ? "practice" : "studied"
}

/** Strength meter, 0–4: 0 for words not studied (or skipped); words needing practice sit at 1, each net right answer adds a bar. */
export function strength(id: string, p: Progress): number {
  const l = p.learned[id]
  if (!l || p.skipped[id]) return 0
  return Math.min(4, Math.max(1, 1 + l.correct - l.wrong))
}

/**
 * The next words in teaching order (course units, then frequency) never studied or skipped. A lesson stays within
 * one unit: the last lesson of a unit may be shorter.
 */
export function pickNewWords(
  index: IndexEntry[],
  progress: Progress,
  size: number,
  exclude: Set<string> = new Set()
): IndexEntry[] {
  const next = fresh(index, progress, exclude)
  const unit = next[0]?.unit
  return next.filter((w) => w.unit === unit).slice(0, clampSize(size, sizeRange(index, progress)))
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
export const reviewsPerLesson = (size: number) => Math.ceil(size / 5)

/** A lesson = the next new words plus a few studied words that need another look. */
export function planLesson(index: IndexEntry[], progress: Progress, size: number) {
  const fresh = pickNewWords(index, progress, size)
  return {
    fresh,
    review: reviewQueue(index, progress).slice(0, reviewsPerLesson(clampSize(size, sizeRange(index, progress)))),
  }
}
