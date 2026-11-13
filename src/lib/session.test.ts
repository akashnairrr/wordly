import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { emptyProgress, skipWord, unskipWord } from "./progress"
import { difficulty, pickNewWords, planLesson, reviewQueue, strength, wordStatus } from "./session"
import { pool } from "./test-fixtures"

describe("session", () => {
  it("difficulty bands and next unlearned words by rank", () => {
    assert.deepEqual([5, 8, 9, 12, 13, 15].map(difficulty), ["Easy", "Easy", "Moderate", "Moderate", "Hard", "Hard"])
    const p = { ...emptyProgress(), learned: { tener: { learnedAt: "", correct: 1, wrong: 0 } } }
    assert.deepEqual(
      pickNewWords(pool, p, 5).map((w) => w.id),
      ["casa", "bueno", "ser", "ir", "hacer"]
    )
  })

  it("strength: 0 unstudied, 1 needs practice, a bar per net right answer up to 4", () => {
    const at = (correct: number, wrong: number) =>
      strength("w", { ...emptyProgress(), learned: { w: { learnedAt: "", correct, wrong } } })
    assert.equal(strength("w", emptyProgress()), 0)
    assert.deepEqual([at(0, 2), at(1, 1), at(2, 0), at(9, 1)], [1, 1, 3, 4])
    assert.equal(
      strength("w", skipWord({ ...emptyProgress(), learned: { w: { learnedAt: "", correct: 3, wrong: 0 } } }, "w")),
      0
    )
  })

  it("skip: skipped words leave new lessons and reviews, and come back when un-skipped", () => {
    let p = skipWord(emptyProgress(), "tener")
    assert.equal(wordStatus("tener", p), "skipped")
    assert.ok(!pickNewWords(pool, p, 5).some((w) => w.id === "tener"))
    p = unskipWord(p, "tener")
    assert.equal(pickNewWords(pool, p, 5)[0]?.id, "tener")
  })

  it("review: weakest and least recently seen first; lessons mix in 1 old word per 5 new", () => {
    const at = (d: number) => new Date(2026, 9, d).toISOString()
    const p = {
      ...emptyProgress(),
      learned: {
        tener: { learnedAt: at(1), reviewedAt: at(5), correct: 2, wrong: 0 },
        casa: { learnedAt: at(1), reviewedAt: at(2), correct: 2, wrong: 0 },
        bueno: { learnedAt: at(1), reviewedAt: at(9), correct: 0, wrong: 2 },
      },
    }
    assert.deepEqual(
      reviewQueue(pool, p).map((w) => w.id),
      ["bueno", "casa", "tener"]
    )
    assert.deepEqual(
      reviewQueue(pool, p, true).map((w) => w.id),
      ["bueno"]
    )
    assert.equal(wordStatus("bueno", p), "practice")
    const plan = planLesson(pool, p, 10)
    assert.deepEqual(
      plan.review.map((w) => w.id),
      ["bueno", "casa"]
    )
    assert.ok(!plan.fresh.some((w) => p.learned[w.id as keyof typeof p.learned]))
  })
})
