import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { allForms } from "../../src/lib/words"
import { bestEntry, toWord, wordId } from "./normalize"
import type { RawEntry } from "./wiktionary"

// Trimmed from real kaikki.org entries.
const conj = (form: string, ...tags: string[]) => ({ form, tags, source: "conjugation" })
const tener: RawEntry = {
  word: "tener",
  pos: "verb",
  sounds: [{ ipa: "/teˈneɾ/" }, { ipa: "[t̪eˈneɾ]" }],
  senses: [{ glosses: ["to have; to possess"] }, { glosses: ["to hold; to grasp"] }],
  forms: [
    { form: "tengo", tags: ["first-person", "present", "singular"] },
    conj("irregular", "table-tags"),
    conj("teniendo", "gerund"),
    conj("tenido", "masculine", "participle", "past", "singular"),
    conj("tengo", "first-person", "indicative", "present", "singular"),
    conj("tienes", "indicative", "informal", "present", "second-person", "singular"),
    conj("tenés", "indicative", "informal", "present", "second-person", "singular", "vos-form"),
    conj("tenéis", "indicative", "plural", "present", "second-person"),
    conj("tuvo", "indicative", "preterite", "singular", "third-person"),
    conj("tuviera", "first-person", "imperfect", "singular", "subjunctive"),
    conj("tuviese", "first-person", "imperfect", "imperfect-se", "singular", "subjunctive"),
    conj("tuviere", "first-person", "future", "singular", "subjunctive"),
    conj("ten", "imperative", "informal", "second-person", "singular"),
    conj("tenga", "formal", "imperative", "second-person-semantically", "singular", "third-person"),
    conj("tenga", "imperative", "singular", "third-person"),
    conj("tengas", "imperative", "negative", "second-person", "singular"),
    conj("tenerlo", "accusative", "combined-form", "infinitive", "object-singular", "object-third-person"),
  ],
}
const casa: RawEntry = {
  word: "casa",
  pos: "noun",
  head_templates: [{ expansion: "casa f (plural casas)" }],
  sounds: [{ ipa: "/ˈkasa/" }],
  senses: [{ glosses: ["house"], tags: ["feminine"] }],
  forms: [{ form: "casas", tags: ["plural"] }],
}
const bueno: RawEntry = {
  word: "bueno",
  pos: "adj",
  senses: [
    { glosses: ["good (of good quality)"] },
    { glosses: ["good (morally)"] },
    { glosses: ["obsolete sense"], tags: ["obsolete"] },
  ],
  forms: [
    { form: "before a noun buen", tags: ["masculine", "singular"] },
    { form: "buena", tags: ["feminine"] },
    { form: "buenos", tags: ["masculine", "plural"] },
    { form: "buenas", tags: ["feminine", "plural"] },
    { form: "güeno", tags: ["alternative", "pronunciation-spelling"] },
  ],
}
describe("normalize", () => {
  it("verb: conjugation grid keeps standard forms and drops vos/-se/clitic/formal variants", () => {
    const w = toWord(tener, 1)!
    assert.equal(w.pos, "verb")
    assert.equal(w.ipa, "/teˈneɾ/")
    assert.deepEqual(w.glosses, ["to have; to possess", "to hold; to grasp"])
    assert.deepEqual(w.conjugation?.indicative?.present, { "1s": "tengo", "2s": "tienes", "2p": "tenéis" })
    assert.equal(w.conjugation?.indicative?.preterite?.["3s"], "tuvo")
    assert.deepEqual(w.conjugation?.subjunctive?.imperfect, { "1s": "tuviera" })
    assert.equal(w.conjugation?.subjunctive?.future, undefined)
    assert.deepEqual(w.conjugation?.imperative?.affirmative, { "2s": "ten", "3s": "tenga" })
    assert.deepEqual(w.conjugation?.imperative?.negative, { "2s": "tengas" })
    assert.deepEqual(w.nonFinite, { gerund: "teniendo", participle: "tenido" })
    assert.ok(!allForms(w).includes("tenés"))
    assert.ok(!allForms(w).includes("irregular"))
  })

  it("noun: gender from headword, plural from forms", () => {
    const w = toWord(casa, 2)!
    assert.equal(w.gender, "f")
    assert.deepEqual(w.forms, { plural: "casas" })
  })

  it("adjective: gendered forms, skips phrases and alternative spellings", () => {
    const w = toWord(bueno, 3)!
    assert.deepEqual(w.forms, { feminine: "buena", masculinePlural: "buenos", femininePlural: "buenas" })
    assert.equal(w.glosses.length, 2)
  })

  it("wordId is ASCII and keeps accented words distinct", () => {
    assert.equal(wordId("está"), "esta_")
    assert.equal(wordId("esta"), "esta")
    assert.equal(wordId("año"), "an_o")
  })

  it("bestEntry: most real meanings wins; letter names don't count; verbs win ties", () => {
    const e = (pos: string, ...glosses: string[]): RawEntry => ({
      word: "x",
      pos,
      senses: glosses.map((g) => ({ glosses: [g] })),
    })
    const letter = e("noun", "The name of the Latin-script letter D/d.")
    const prep = e("prep", "of", "from")
    assert.equal(bestEntry([letter, prep]), prep)
    const verb = e("verb", "to be", "to exist")
    const noun = e("noun", "a being", "essence")
    assert.equal(bestEntry([noun, verb]), verb)
    assert.equal(bestEntry([letter]), undefined)
  })
})

describe("normalize: German", () => {
  const conj = (form: string, ...tags: string[]) => ({ form, tags, source: "conjugation" })
  const sense = { glosses: ["to make, to produce"] }

  it("noun: neuter gender, plural and genitive; diminutives left out", () => {
    const w = toWord(
      {
        word: "Haus",
        pos: "noun",
        head_templates: [{ expansion: "Haus n (strong, genitive Hauses, plural Häuser)" }],
        senses: [{ glosses: ["house, building"] }],
        forms: [
          { form: "Hauses", tags: ["genitive"] },
          { form: "Häuser", tags: ["plural"] },
          { form: "Häuschen", tags: ["diminutive", "neuter"] },
        ],
      },
      1
    )!
    assert.equal(w.gender, "n")
    assert.deepEqual(w.forms, { plural: "Häuser", genitive: "Hauses" })
    assert.equal(w.id, "haus")
  })

  it("verb: present, Präteritum, Perfekt, Futur, Konjunktiv II and würde; separable forms kept whole", () => {
    const w = toWord(
      {
        word: "anrufen",
        pos: "verb",
        senses: [sense],
        forms: [
          conj("rufe an", "first-person", "indicative", "present", "singular"),
          conj("anrufe", "first-person", "indicative", "present", "singular", "subordinate-clause"),
          conj("rief an", "first-person", "indicative", "preterite", "singular"),
          conj("habe angerufen", "first-person", "indicative", "multiword-construction", "perfect", "singular"),
          conj("hatte angerufen", "first-person", "indicative", "multiword-construction", "pluperfect", "singular"),
          conj(
            "werde anrufen",
            "first-person",
            "future",
            "future-i",
            "indicative",
            "multiword-construction",
            "singular"
          ),
          conj(
            "würde anrufen",
            "first-person",
            "future",
            "future-i",
            "multiword-construction",
            "singular",
            "subjunctive",
            "subjunctive-ii"
          ),
          conj("riefe an", "first-person", "singular", "subjunctive", "subjunctive-ii"),
          conj("rufe an", "first-person", "singular", "subjunctive", "subjunctive-i"),
          conj("ruf an", "imperative", "second-person", "singular"),
          conj("angerufen", "participle", "past"),
        ],
      },
      1
    )!
    assert.deepEqual(w.conjugation, {
      indicative: {
        present: { "1s": "rufe an" },
        preterite: { "1s": "rief an" },
        perfect: { "1s": "habe angerufen" },
        future: { "1s": "werde anrufen" },
      },
      subjunctive: { conditional: { "1s": "würde anrufen" }, imperfect: { "1s": "riefe an" } },
      imperative: { affirmative: { "2s": "ruf an" } },
    })
    assert.equal(w.nonFinite?.participle, "angerufen")
  })

  it("adjective: comparative and superlative, not the declension table", () => {
    const w = toWord(
      {
        word: "gut",
        pos: "adj",
        senses: [{ glosses: ["good"] }],
        forms: [
          { form: "guter", tags: ["masculine", "nominative", "singular", "strong"] },
          { form: "besser", tags: ["comparative"] },
          { form: "am besten", tags: ["superlative"] },
          {
            form: "gute",
            tags: ["feminine", "nominative", "singular", "strong", "without-article"],
            source: "declension",
          },
        ],
      },
      1
    )!
    assert.deepEqual(w.forms, { comparative: "besser", superlative: "am besten" })
  })

  it("wordId spells ß as ss", () => {
    assert.equal(wordId("groß"), "gross")
  })
})
