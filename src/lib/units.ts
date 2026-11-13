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

/** The unit of the next word to learn; undefined once the curriculum is finished (frequency list from there). */
export function currentUnit(index: IndexEntry[], p: Progress): Unit | undefined {
  const next = index.filter((w) => !done(w, p)).sort((a, b) => a.order - b.order)[0]
  return next?.unit ? unitOf(next.unit) : undefined
}

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

/** Every unit of the course with its words (teaching order) and how many are studied or skipped. */
export function courseUnits(index: IndexEntry[], p: Progress): { unit: Unit; words: IndexEntry[]; done: number }[] {
  const last = index.reduce((n, w) => Math.max(n, w.unit ?? 0), 0)
  return Array.from({ length: last }, (_, i) => {
    const words = index.filter((w) => w.unit === i + 1).sort((a, b) => a.order - b.order)
    return { unit: unitOf(i + 1), words, done: words.filter((w) => done(w, p)).length }
  })
}

/** Studied (or skipped) words of the stage. */
export const stageDone = (s: Stage, p: Progress) => s.words.filter((w) => done(w, p)).length

/** A unit taught `size` words per lesson: how many lessons it takes, and which one is next (1-based). */
export function lessonsOf(total: number, done: number, size: number): { lesson: number; lessons: number } {
  const lessons = Math.max(1, Math.ceil(total / size))
  return { lesson: Math.min(lessons, Math.floor(done / size) + 1), lessons }
}
