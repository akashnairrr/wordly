import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { glossExample, phraseCandidates, shortGloss, translatingGloss } from "./glosses"

describe("glosses", () => {
  it("shortGloss: first sense, no parentheses, fits under a word", () => {
    assert.equal(shortGloss("to have; to possess"), "to have")
    assert.equal(shortGloss("the (feminine singular)"), "the")
    assert.equal(shortGloss("why, for what reason"), "why, for what reason")
    assert.equal(shortGloss("home, homewards, back home, to home, to the house"), "home")
  })

  it("translatingGloss skips grammatical explanations", () => {
    assert.equal(translatingGloss(["Used as an emphatic pronoun", "me"]), "me")
    assert.equal(translatingGloss(["first-person singular pronoun"]), undefined)
    assert.equal(translatingGloss(["a lot"]), "a lot")
  })

  it("glossExample: longest phrase wins, the taught word keeps no gloss, unknown words stay null", () => {
    const dict: Record<string, { g: string; l?: string }> = {
      me: { g: "me" },
      puedes: { g: "can", l: "poder" },
      dejar: { g: "to leave" },
    }
    const phrases = new Map([
      ["por favor", "please"],
      ["me puedes", "can you me"],
    ])
    const ex = glossExample(
      { text: "¿Me puedes dejar solo, por favor?", en: "Can you leave me alone, please?" },
      (t) => t === "solo",
      (t) => dict[t],
      phrases
    )
    // Tokens: me puedes dejar solo por favor
    assert.deepEqual(ex.phrases, [
      [0, 2, "can you me"],
      [4, 6, "please"],
    ])
    assert.deepEqual(ex.words, [null, null, { g: "to leave" }, null, null, null])
  })

  it("glossExample: phrases containing the taught word are not grouped", () => {
    const ex = glossExample(
      { text: "Por favor.", en: "Please." },
      (t) => t === "favor",
      () => ({ g: "x" }),
      new Map([["por favor", "please"]])
    )
    assert.equal(ex.phrases, undefined)
    assert.deepEqual(ex.words, [{ g: "x" }, null])
  })

  it("phraseCandidates: all 2–4 word runs", () => {
    const c = phraseCandidates(["Lo siento mucho."])
    assert.ok(c.has("lo siento") && c.has("siento mucho") && c.has("lo siento mucho"))
    assert.ok(!c.has("lo"))
  })
})
