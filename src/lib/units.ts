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
  label: string
  words: IndexEntry[]
}

export function currentStage(index: IndexEntry[], p: Progress): Stage {
  const unit = currentUnit(index, p)
  if (unit) return { label: unitLabel(unit), words: index.filter((w) => w.unit === unit.n) }
  const level = currentLevel(index, p)
  return { label: levelLabel(level), words: index.filter((w) => levelOf(w.order).n === level.n) }
}

/** Studied (or skipped) words of the stage. */
export const stageDone = (s: Stage, p: Progress) => s.words.filter((w) => done(w, p)).length
