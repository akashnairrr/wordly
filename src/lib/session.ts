import type { IndexEntry, Progress } from "./types";

export const MIN_SIZE = 5;
export const MAX_SIZE = 15;

export type Difficulty = "Easy" | "Moderate" | "Hard";

export const DIFFICULTY_INFO: Record<Difficulty, { label: string; note: string }> = {
  Easy: { label: "Easy", note: "A comfortable pace for daily practice. Good if you're new to the language." },
  Moderate: { label: "Moderate", note: "More words per lesson = longer quiz + more to remember." },
  Hard: { label: "Hard", note: "A heavy lesson. Retention drops when you learn too many new words at once." },
};

export function difficulty(size: number): Difficulty {
  return size <= 8 ? "Easy" : size <= 12 ? "Moderate" : "Hard";
}

const DIFFICULTY_ORDER: Difficulty[] = ["Easy", "Moderate", "Hard"];

/**
 * The "getting harder" notice as the lesson size moves from one band to another: set on moving up into a harder band,
 * dropped on moving back down (so 13 → 12 shows Moderate, not a leftover Hard warning), kept within a band.
 */
export function bandWarning(warning: Difficulty | null, from: Difficulty, to: Difficulty): Difficulty | null {
  const step = DIFFICULTY_ORDER.indexOf(to) - DIFFICULTY_ORDER.indexOf(from);
  return step > 0 ? to : step < 0 ? null : warning;
}

export function clampSize(n: number): number {
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(n)));
}

export type WordStatus = "new" | "studied" | "practice" | "skipped";

export function wordStatus(id: string, p: Progress): WordStatus {
  if (p.skipped[id]) return "skipped";
  const l = p.learned[id];
  if (!l) return "new";
  return l.wrong > 0 && l.wrong >= l.correct ? "practice" : "studied";
}

/** The next most frequent words never studied or skipped. */
export function pickNewWords(index: IndexEntry[], progress: Progress, size: number, exclude: Set<string> = new Set()): IndexEntry[] {
  return index
    .filter((w) => !progress.learned[w.id] && !progress.skipped[w.id] && !exclude.has(w.id))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, clampSize(size));
}

/** Studied words, most in need of practice first: more misses than hits, then least recently seen. */
export function reviewQueue(index: IndexEntry[], progress: Progress, onlyPractice = false): IndexEntry[] {
  const need = (id: string) => {
    const l = progress.learned[id];
    return l.wrong - l.correct;
  };
  const seen = (id: string) => progress.learned[id].reviewedAt ?? progress.learned[id].learnedAt;
  return index
    .filter((w) => progress.learned[w.id] && !progress.skipped[w.id] && (!onlyPractice || wordStatus(w.id, progress) === "practice"))
    .sort((a, b) => need(b.id) - need(a.id) || seen(a.id).localeCompare(seen(b.id)));
}

/** Old words mixed into a lesson: 1 per 5 new words (5 → 1, 10 → 2, 15 → 3). */
export const reviewsPerLesson = (size: number) => Math.ceil(clampSize(size) / 5);

/** A lesson = the next new words plus a few studied words that need another look. */
export function planLesson(index: IndexEntry[], progress: Progress, size: number) {
  return {
    fresh: pickNewWords(index, progress, size),
    review: reviewQueue(index, progress).slice(0, reviewsPerLesson(size)),
  };
}
