// Checks the generated data of languages that have a course (public/data/<lang>/), so a pipeline run can't quietly
// ship broken order, units or examples.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, it } from "node:test"
import type { IndexEntry, Word } from "../../src/lib/types"
import { UNITS } from "../../src/lib/units"
import { allForms, tokenize } from "../../src/lib/words"
import { CURRICULA } from "./curriculum"

const DATA = join(import.meta.dirname, "../../public/data")

for (const [lang, units] of Object.entries(CURRICULA)) {
  describe(`${lang} data`, () => {
    const index: IndexEntry[] = JSON.parse(readFileSync(join(DATA, lang, "index.json"), "utf8"))
    const word = (id: string): Word => JSON.parse(readFileSync(join(DATA, lang, "words", `${id}.json`), "utf8"))

    it("curriculum lists each word once, in known units", () => {
      const all = units.flat()
      assert.equal(new Set(all).size, all.length, "duplicate lemma")
      assert.ok(units.length <= UNITS.length)
    })

    it("teaching order is 1…n and every course word is in its unit", () => {
      assert.deepEqual(
        index.map((w) => w.order).sort((a, b) => a - b),
        index.map((_, i) => i + 1)
      )
      const byLemma = new Map(index.map((w) => [w.lemma, w]))
      units.forEach((lemmas, u) => lemmas.forEach((l) => assert.equal(byLemma.get(l)?.unit, u + 1, l)))
    })

    it("examples contain their word, glosses line up, course words have examples", () => {
      for (const entry of index) {
        const w = word(entry.id)
        if (w.unit) assert.ok(w.examples.length, `${w.lemma} has no example`)
        const forms = new Set(allForms(w).map((f) => f.toLowerCase()))
        for (const e of w.examples) {
          const tokens = tokenize(e.text)
          assert.ok(
            tokens.some((t) => forms.has(t)),
            `${w.lemma}: ${e.text}`
          )
          if (e.words) assert.equal(e.words.length, tokens.length, `${w.lemma}: ${e.text}`)
        }
      }
    })
  })
}
