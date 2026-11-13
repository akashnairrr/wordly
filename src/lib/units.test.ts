import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { completeUnit, emptyProgress } from "./progress"
import { pickNewWords, planLesson } from "./session"
import type { IndexEntry } from "./types"
import { courseUnits, currentStage, nextStep, splitLessons, stageDone } from "./units"

const entry = (id: string, rank: number, order: number, unit?: number): IndexEntry => ({
  id,
  lemma: id,
  pos: "noun",
  rank,
  order,
  ...(unit && { unit }),
  gloss: "",
})
// "de" is the commonest word but taught after the course's first unit.
const index = [entry("de", 1, 3), entry("hola", 900, 1, 1), entry("adiós", 950, 2, 1), entry("casa", 70, 4)]

describe("units", () => {
  it("new words follow the course, not frequency", () => {
    assert.deepEqual(
      pickNewWords(index, emptyProgress(), 5).map((w) => w.id),
      ["hola", "adiós", "de", "casa"]
    )
    // Course lessons: the unit's first lesson only.
    assert.deepEqual(
      planLesson(index, emptyProgress(), 5).fresh.map((w) => w.id),
      ["hola"]
    )
  })

  it("stage is the current unit until its final, then the level once the course is done", () => {
    let p = emptyProgress()
    assert.equal(currentStage(index, p).label, "Unit 1 · Hello & goodbye")
    p.learned.hola = { learnedAt: "", correct: 1, wrong: 0 }
    assert.equal(stageDone(currentStage(index, p), p), 1)
    p.skipped["adiós"] = "2026-11-13"
    // Every word met, final not taken yet.
    assert.equal(currentStage(index, p).label, "Unit 1 · Hello & goodbye")
    p = completeUnit(p, 1)
    assert.equal(currentStage(index, p).label, "Level 1 · Beginner")
  })
})

const unitOfSize = (n: number, unit = 1, from = 0) =>
  Array.from({ length: n }, (_, i) => entry(`u${unit}w${i}`, 100 + from + i, from + i + 1, unit))
const learn = (p: ReturnType<typeof emptyProgress>, words: IndexEntry[]) => {
  for (const w of words) p.learned[w.id] = { learnedAt: "", correct: 1, wrong: 0 }
}

describe("course units", () => {
  it("splits a unit into 2 lessons, or 3 past 6 words a lesson", () => {
    const sizes = (n: number) => splitLessons(unitOfSize(n)).map((l) => l.length)
    assert.deepEqual(sizes(10), [5, 5])
    assert.deepEqual(sizes(12), [6, 6])
    assert.deepEqual(sizes(13), [4, 5, 4])
    assert.deepEqual(sizes(20), [7, 6, 7])
  })

  it("lessons in order, then the unit's final, then the next unit", () => {
    const words = [...unitOfSize(10, 1), ...unitOfSize(10, 2, 10)]
    const p = emptyProgress()
    const step = () => {
      const s = nextStep(words, p)
      return s && [s.unit.unit.n, s.kind === "lesson" ? s.lesson : "final", s.words.length]
    }
    assert.deepEqual(step(), [1, 1, 5])
    learn(p, words.slice(0, 5))
    assert.deepEqual(step(), [1, 2, 5])
    learn(p, words.slice(5, 10))
    assert.deepEqual(step(), [1, "final", 10])
    assert.equal(planLesson(words, p, 5).fresh.length, 0)
    p.unitsDone[1] = "2026-11-13"
    assert.deepEqual(step(), [2, 1, 5])
    assert.deepEqual(
      courseUnits(words, p).map((u) => [u.lessonsDone, u.complete]),
      [
        [2, true],
        [0, false],
      ]
    )
    assert.deepEqual(courseUnits([entry("de", 1, 1)], p), [])
    assert.equal(nextStep([entry("de", 1, 1)], p), undefined)
  })
})
