import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { LANGUAGE_LIST } from "./languages"

describe("languages", () => {
  it("picker lists languages by English name", () => {
    const names = LANGUAGE_LIST.map((l) => l.name)
    assert.deepEqual(names, [...names].sort())
  })
})
