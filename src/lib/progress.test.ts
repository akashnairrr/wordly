import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { emptyProgress, recordSession } from "./progress"

describe("progress", () => {
  it("recordSession counts answers and tracks the streak", () => {
    const day1 = new Date(2026, 9, 30, 12)
    const day2 = new Date(2026, 9, 31, 12)
    let p = recordSession(
      emptyProgress(),
      [
        { wordId: "casa", correct: true },
        { wordId: "casa", correct: false },
      ],
      "lesson",
      day1
    )
    assert.deepEqual([p.learned.casa?.correct, p.learned.casa?.wrong, p.streak], [1, 1, 1])
    p = recordSession(p, [{ wordId: "ser", correct: true }], "lesson", day2)
    assert.equal(p.streak, 2)
    p = recordSession(p, [{ wordId: "ir", correct: true }], "review", day2)
    assert.equal(p.streak, 2, "second session same day doesn't double count")
    assert.equal(p.history.length, 3)
  })
})
