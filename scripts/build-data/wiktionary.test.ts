import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { formOfTargets, isLemmaEntry, type RawEntry } from "./wiktionary"

const casaVerbForm: RawEntry = {
  word: "casa",
  pos: "verb",
  senses: [{ glosses: ["inflection of casar:"], tags: ["form-of"], form_of: [{ word: "casar" }] }],
}

describe("wiktionary", () => {
  it("form-of entries are not lemmas and point at their lemma", () => {
    assert.equal(isLemmaEntry(casaVerbForm), false)
    assert.deepEqual(formOfTargets(casaVerbForm), ["casar"])
  })
})
