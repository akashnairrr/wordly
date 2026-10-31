import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { LANGUAGE_LIST, switchLanguagePath } from "./languages"

describe("languages", () => {
  it("switching keeps the section, but not a specific word or lesson", () => {
    assert.equal(switchLanguagePath("/es/", "de"), "/de/")
    assert.equal(switchLanguagePath("/es/words/", "de"), "/de/words/")
    assert.equal(switchLanguagePath("/es/words/casa/", "de"), "/de/words/")
    assert.equal(switchLanguagePath("/es/progress/", "de"), "/de/progress/")
    assert.equal(switchLanguagePath("/es/session/", "de"), "/de/")
  })

  it("picker lists languages by English name", () => {
    const names = LANGUAGE_LIST.map((l) => l.name)
    assert.deepEqual(names, [...names].sort())
  })
})
