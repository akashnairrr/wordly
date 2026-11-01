import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { forRegion, formOfTargets, isLemmaEntry, pointers, type RawEntry } from "./wiktionary"

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

  it("keeps one country's senses and pronunciations", () => {
    const rapariga: RawEntry = {
      word: "rapariga",
      pos: "noun",
      sounds: [
        { ipa: "/ʁa.paˈɾi.ɡɐ/", tags: ["Brazil"] },
        { ipa: "/ʁɐ.pɐˈɾi.ɣɐ/", tags: ["Portugal"] },
      ],
      senses: [
        { glosses: ["girl, young lady"], tags: ["Portugal"] },
        { glosses: ["prostitute"], tags: ["Brazil"] },
        { glosses: ["lass"], tags: ["Brazil", "Portugal"] },
      ],
    }
    const pt = forRegion(rapariga, { keep: "Portugal", drop: ["Brazil"] })
    assert.deepEqual(
      pt.sounds?.map((s) => s.ipa),
      ["/ʁɐ.pɐˈɾi.ɣɐ/"]
    )
    assert.deepEqual(
      pt.senses?.map((s) => s.glosses?.[0]),
      ["girl, young lady", "lass"]
    )
  })

  it("old spellings are forms of the current one; European spellings borrow the other entry's meanings", () => {
    const old = pointers({
      word: "acção",
      pos: "noun",
      senses: [
        {
          glosses: ["pre-reform spelling (used until 1990 in Portugal) of ação; still used"],
          links: [["ação", "ação#Portuguese"]],
        },
      ],
    })
    assert.equal(isLemmaEntry(old), false)
    assert.deepEqual(formOfTargets(old), ["ação"])
    const camiao = pointers({
      word: "camião",
      pos: "noun",
      senses: [{ glosses: ["European Portuguese standard form of caminhão"] }],
    })
    assert.equal(camiao.senses?.[0]?.see, "caminhão")
  })
})
