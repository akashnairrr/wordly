import { currentLevel, levelLabel, levelOf } from "./levels"
import type { IndexEntry, Progress } from "./types"

// Course units, the same for every language (Duolingo-style themes). Each language lists its words per unit in
// scripts/build-data/curriculum/<lang>.ts; the data pipeline stamps `unit` and `order` on every word. Words outside
// the curriculum come after it, most frequent first.
export const UNITS = [
  "Hello & goodbye",
  "Me & you",
  "People",
  "Family",
  "Numbers 1–10",
  "Food",
  "Drinks",
  "Colours",
  "Describing things",
  "At home",
  "Everyday verbs",
  "Days & time",
  "Questions",
  "Numbers to 100",
  "In town",
  "Getting around",
  "Clothes",
  "Body & health",
  "Weather & nature",
  "Animals",
  "Work",
  "School & learning",
  "Shopping & money",
  "Feelings",
  "Free time",
  "Travel",
  "Talking & thinking",
  "Linking ideas",
  "Before & after",
  "Everyday phrases",
] as const

export interface Unit {
  n: number
  title: string
}

export const unitOf = (n: number): Unit => ({ n, title: UNITS[n - 1] ?? "" })

/** "Unit 4 · Family" */
export const unitLabel = (u: Unit) => `Unit ${u.n} · ${u.title}`

const done = (w: IndexEntry, p: Progress) => !!p.learned[w.id] || !!p.skipped[w.id]

/** A unit is taught in 2 lessons, or 3 when 2 would run past this many words each. */
const LESSON_WORDS = 6

/** A unit's words, in teaching order, as 2–3 lessons of near-equal size. */
export function splitLessons(words: IndexEntry[]): IndexEntry[][] {
  const n = Math.min(3, Math.max(2, Math.ceil(words.length / LESSON_WORDS)))
  return Array.from({ length: n }, (_, i) =>
    words.slice(Math.round((i * words.length) / n), Math.round(((i + 1) * words.length) / n))
  ).filter((l) => l.length)
}

export interface CourseUnit {
  unit: Unit
  /** Teaching order. */
  words: IndexEntry[]
  lessons: IndexEntry[][]
  /** Lessons whose words are all studied (or skipped). */
  lessonsDone: number
  /** The unit's final quiz is taken (or there's nothing left to quiz). */
  complete: boolean
}

/** Every unit of the course, with its lessons and how far the learner is. Empty for languages without a course. */
export function courseUnits(index: IndexEntry[], p: Progress): CourseUnit[] {
  const last = index.reduce((n, w) => Math.max(n, w.unit ?? 0), 0)
  return Array.from({ length: last }, (_, i) => {
    const words = index.filter((w) => w.unit === i + 1).sort((a, b) => a.order - b.order)
    const lessons = splitLessons(words)
    return {
      unit: unitOf(i + 1),
      words,
      lessons,
      lessonsDone: lessons.filter((l) => l.every((w) => done(w, p))).length,
      complete: !!p.unitsDone[i + 1] || words.every((w) => p.skipped[w.id]),
    }
  })
}

/** What the course asks for next: the first unfinished lesson of the current unit, else that unit's final. */
export type Step =
  | { kind: "lesson"; unit: CourseUnit; /** 1-based. */ lesson: number; words: IndexEntry[] }
  | { kind: "final"; unit: CourseUnit; words: IndexEntry[] }

/** Undefined once every unit is complete, or for languages without a course: lessons go by frequency then. */
export function nextStep(index: IndexEntry[], p: Progress): Step | undefined {
  const unit = courseUnits(index, p).find((u) => !u.complete)
  if (!unit) return undefined
  const k = unit.lessons.findIndex((l) => l.some((w) => !done(w, p)))
  if (k >= 0) return { kind: "lesson", unit, lesson: k + 1, words: unit.lessons[k]!.filter((w) => !done(w, p)) }
  return { kind: "final", unit, words: unit.words.filter((w) => !p.skipped[w.id]) }
}

/** The unit being worked on: the first whose final isn't taken. Undefined past the course. */
export const currentUnit = (index: IndexEntry[], p: Progress): Unit | undefined => nextStep(index, p)?.unit.unit

/** Where the learner is: the current unit while in the course, the current level after it. */
export interface Stage {
  /** "Unit 3" */
  kicker: string
  /** "People" */
  title: string
  /** "Unit 3 · People" */
  label: string
  words: IndexEntry[]
}

export function currentStage(index: IndexEntry[], p: Progress): Stage {
  const unit = currentUnit(index, p)
  if (unit)
    return {
      kicker: `Unit ${unit.n}`,
      title: unit.title,
      label: unitLabel(unit),
      words: index.filter((w) => w.unit === unit.n),
    }
  const level = currentLevel(index, p)
  return {
    kicker: `Level ${level.n}`,
    title: level.name,
    label: levelLabel(level),
    words: index.filter((w) => levelOf(w.order).n === level.n),
  }
}

/** Studied (or skipped) words of the stage. */
export const stageDone = (s: Stage, p: Progress) => s.words.filter((w) => done(w, p)).length
