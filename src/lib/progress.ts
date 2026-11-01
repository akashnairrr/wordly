// Learning progress, stored per language in localStorage. Pure functions here; React hook in hooks/use-progress.ts.
import { MIN_SIZE } from "./session"
import { RATES } from "./speech"
import type { Progress } from "./types"

const key = (lang: string) => `wordly:v1:${lang}`

export function emptyProgress(): Progress {
  return {
    version: 1,
    settings: { sessionSize: MIN_SIZE, pageSize: 100, rate: RATES.normal, sound: true },
    learned: {},
    skipped: {},
    history: [],
    streak: 0,
    xp: 0,
    lastDay: null,
  }
}

function isProgress(x: unknown): x is Progress {
  const p = x as Progress
  return !!p && p.version === 1 && typeof p.learned === "object" && Array.isArray(p.history)
}

// Fills fields added after a backup/save was written (e.g. `skipped`).
const withDefaults = (p: Progress): Progress => ({
  ...emptyProgress(),
  ...p,
  settings: { ...emptyProgress().settings, ...p.settings },
})

export function loadProgress(lang: string): Progress {
  try {
    const p = JSON.parse(localStorage.getItem(key(lang)) ?? "null")
    if (isProgress(p)) return withDefaults(p)
  } catch {
    // Unreadable or blocked storage: start fresh rather than crash.
  }
  return emptyProgress()
}

export function saveProgress(lang: string, p: Progress) {
  try {
    localStorage.setItem(key(lang), JSON.stringify(p))
  } catch {
    // Private mode / quota: progress stays in memory for this visit.
  }
}

export function parseBackup(json: string): Progress {
  const p = JSON.parse(json)
  if (!isProgress(p)) throw new Error("Not a Wordly backup file")
  return withDefaults(p)
}

// Local calendar day (YYYY-MM-DD), so the streak follows the learner's midnight, not UTC's.
const day = (d: Date) => d.toLocaleDateString("en-CA")

/** Applies a finished lesson or review: marks words studied, counts answers, logs history, updates streak and XP. */
export function recordSession(
  p: Progress,
  results: { wordId: string; correct: boolean }[],
  kind: "lesson" | "review" = "lesson",
  now = new Date(),
  xp = 0
): Progress {
  const learned = { ...p.learned }
  for (const r of results) {
    const prev = learned[r.wordId] ?? { learnedAt: now.toISOString(), correct: 0, wrong: 0 }
    learned[r.wordId] = {
      ...prev,
      reviewedAt: now.toISOString(),
      correct: prev.correct + (r.correct ? 1 : 0),
      wrong: prev.wrong + (r.correct ? 0 : 1),
    }
  }
  const today = day(now)
  const yesterday = day(new Date(now.getTime() - 86_400_000))
  const streak = p.lastDay === today ? p.streak : p.lastDay === yesterday ? p.streak + 1 : 1
  const words = [...new Set(results.map((r) => r.wordId))]
  const score = results.filter((r) => r.correct).length
  return {
    ...p,
    learned,
    streak,
    xp: p.xp + xp,
    lastDay: today,
    history: [{ date: now.toISOString(), words, score, total: results.length, kind }, ...p.history],
  }
}

export function skipWord(p: Progress, id: string, now = new Date()): Progress {
  return { ...p, skipped: { ...p.skipped, [id]: now.toISOString() } }
}

export function unskipWord(p: Progress, id: string): Progress {
  const skipped = { ...p.skipped }
  delete skipped[id]
  return { ...p, skipped }
}
