import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { findExamples, indexSentences, literalness } from "./sentences"

describe("sentences", () => {
  it("whole-word match, spread across forms", () => {
    const index = indexSentences([
      { text: "Tengo un perro pequeño en casa.", en: "I have a small dog at home." },
      { text: "Tengo hambre ahora mismo, de verdad.", en: "I'm really hungry right now." },
      { text: "¿Tienes tiempo para hablar hoy?", en: "Do you have time to talk today?" },
      { text: "Contengo la respiración bajo el agua.", en: "I hold my breath underwater." },
    ])
    const got = findExamples(index, ["tengo", "tienes"], 2).map((e) => e.text)
    assert.equal(got.length, 2)
    assert.ok(
      got.some((t) => t.startsWith("¿Tienes")),
      "second form gets a sentence before the first form's second one"
    )
    assert.ok(!got.some((t) => t.startsWith("Contengo")))
  })

  it("everyday sentences beat rare words, names, numbers and borrowed spellings", () => {
    const common = [
      "yo",
      "tengo",
      "hambre",
      "tú",
      "quieres",
      "comer",
      "algo",
      "como",
      "una",
      "es",
      "el",
      "de",
      "tom",
      "años",
      "están",
      "cabra",
    ]
    const everyday = {
      rank: new Map(common.map((w, i) => [w, i] as [string, number])),
      commonCutoff: common.length,
      basicCutoff: common.length,
      droppedPronouns: new Set(["yo", "tú"]),
    }
    const index = indexSentences(
      [
        { text: "El ornitorrinco come insectos acuáticos.", en: "The platypus eats aquatic insects." },
        { text: "Tom quiere comer algo.", en: "Tom wants to eat something." },
        { text: "Tengo 17 años y quiero comer.", en: "I'm 17 and want to eat." },
        { text: "Están como una cabra.", en: "They're crazy." },
        { text: "¿Quieres comer algo?", en: "Do you want to eat something?", audio: "x.mp3" },
      ],
      everyday
    )
    const [first, second] = findExamples(index, ["comer", "como", "come"], 5, new Set(["como"])).map((e) => e.text)
    assert.equal(first, "¿Quieres comer algo?")
    assert.notEqual(second, "Están como una cabra.")
    assert.equal(
      findExamples(index, ["comer", "como", "come"], 5, new Set(["como"])).at(-1)?.text,
      "Están como una cabra."
    )
  })

  it("dropped pronouns, drama and loose translations lose to plain literal speech", () => {
    const dict: Record<string, string> = {
      tengo: "I have",
      hambre: "hunger",
      yo: "I",
      me: "me",
      puedes: "can",
      decir: "to say",
      la: "the",
      hora: "hour",
      qué: "what",
    }
    const everyday = {
      rank: new Map(),
      commonCutoff: Infinity,
      basicCutoff: Infinity,
      droppedPronouns: new Set(["yo"]),
      gloss: (t: string) => dict[t],
    }
    const index = indexSentences(
      [
        { text: "¡Yo tengo hambre!", en: "I'm hungry!" },
        { text: "Tengo hambre.", en: "I'm hungry." },
      ],
      everyday
    )
    assert.equal(findExamples(index, ["tengo"], 1)[0]?.text, "Tengo hambre.")
    assert.equal(
      literalness(["me", "puedes", "decir", "la", "hora"], "What time is it?", (t) => dict[t]),
      0
    )
    assert.equal(
      literalness(["qué", "hora"], "What hour?", (t) => dict[t]),
      1
    )
  })
})
