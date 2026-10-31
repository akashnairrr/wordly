import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { currentLevel, levelOf, levelProgress, LEVELS } from "./levels"
import { emptyProgress } from "./progress"
import type { IndexEntry } from "./types"

const entry = (rank: number): IndexEntry => ({ id: `w${rank}`, lemma: `w${rank}`, pos: "noun", rank, gloss: "" })

describe("levels", () => {
  it("bands cover ranks 1–5,000 without gaps", () => {
    assert.deepEqual(
      [1, 500, 501, 1000, 1001, 2000, 2001, 3500, 3501, 5000].map((r) => levelOf(r).n),
      [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]
    )
    LEVELS.slice(1).forEach((l, i) => assert.equal(l.from, LEVELS[i]!.to + 1))
  })

  it("current level is the first with words left; skipped words count as done", () => {
    const index = [entry(1), entry(2), entry(600)]
    const p = emptyProgress()
    assert.equal(currentLevel(index, p).n, 1)
    p.learned.w1 = { learnedAt: "", correct: 1, wrong: 0 }
    p.skipped.w2 = "2026-10-31"
    assert.equal(currentLevel(index, p).n, 2)
    assert.deepEqual(levelProgress(index, p, LEVELS[0]!), { done: 2, total: 2 })
    assert.deepEqual(levelProgress(index, p, LEVELS[1]!), { done: 0, total: 1 })
  })
})
