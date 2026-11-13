import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { emptyProgress } from "./progress"
import { difficulty, pickNewWords, sizeRange, unitRange } from "./session"
import type { IndexEntry } from "./types"
import { courseUnits, currentStage, stageDone } from "./units"

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
  it("new words follow the course, not frequency, one unit per lesson", () => {
    const p = emptyProgress()
    assert.deepEqual(
      pickNewWords(index, p, 5).map((w) => w.id),
      ["hola", "adiós"]
    )
    p.learned.hola = { learnedAt: "", correct: 1, wrong: 0 }
    p.learned["adiós"] = { learnedAt: "", correct: 1, wrong: 0 }
    assert.deepEqual(
      pickNewWords(index, p, 5).map((w) => w.id),
      ["de", "casa"]
    )
  })

  it("lesson sizes run from a third of the unit to all of it, difficulty in thirds of that", () => {
    assert.deepEqual(unitRange(16), { min: 5, max: 16 })
    assert.deepEqual(unitRange(10), { min: 3, max: 10 })
    // 3–10: Moderate from 5⅓, Hard from 7⅔.
    assert.deepEqual(
      [3, 5, 6, 7, 8, 10].map((n) => difficulty(n, unitRange(10))),
      ["Easy", "Easy", "Moderate", "Moderate", "Hard", "Hard"]
    )
    assert.deepEqual(sizeRange(index, emptyProgress()), { min: 1, max: 2 })
  })

  it("stage is the current unit, then the level once the course is done", () => {
    const p = emptyProgress()
    assert.equal(currentStage(index, p).label, "Unit 1 · Hello & goodbye")
    p.learned.hola = { learnedAt: "", correct: 1, wrong: 0 }
    assert.equal(stageDone(currentStage(index, p), p), 1)
    p.skipped["adiós"] = "2026-11-13"
    assert.equal(currentStage(index, p).label, "Level 1 · Beginner")
  })
})

describe("course units", () => {
  it("summarises each unit; none for languages without a course", () => {
    const p = emptyProgress()
    p.learned.hola = { learnedAt: "", correct: 1, wrong: 0 }
    const [first] = courseUnits(index, p)
    assert.equal(first?.unit.title, "Hello & goodbye")
    assert.deepEqual([first?.words.map((w) => w.id), first?.done], [["hola", "adiós"], 1])
    assert.deepEqual(courseUnits([entry("de", 1, 1)], p), [])
  })
})
