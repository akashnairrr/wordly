import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { emptyProgress } from "./progress"
import { pickNewWords } from "./session"
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
  it("new words follow the course, not frequency", () => {
    assert.deepEqual(
      pickNewWords(index, emptyProgress(), 5).map((w) => w.id),
      ["hola", "adiós", "de", "casa"]
    )
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
