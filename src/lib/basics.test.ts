import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { BASICS } from "./basics"
import { LANGUAGES } from "./languages"

describe("basics", () => {
  it("every language has basics, with no empty groups and unique titles per page", () => {
    for (const code of Object.keys(LANGUAGES)) {
      const groups = BASICS[code]
      assert.ok(groups?.length, `${code} has no basics`)
      const titles = groups.flatMap((g) => {
        assert.ok(g.entries.length, `${code}: empty group ${g.title}`)
        return g.entries.map((e) => e.title)
      })
      // Titles and example texts are React keys.
      assert.equal(new Set(titles).size, titles.length, `${code}: duplicate entry title`)
      for (const e of groups.flatMap((g) => g.entries)) {
        const texts = e.examples?.map((x) => x.text) ?? []
        assert.equal(new Set(texts).size, texts.length, `${code}: duplicate example in ${e.title}`)
      }
    }
  })
})
