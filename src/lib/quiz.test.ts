import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildQuiz, grade, normalizeAnswer, type QuizQuestion } from "./quiz"
import { bueno, casa, es, pool, seeded, tener } from "./test-fixtures"
import type { Word } from "./types"

describe("buildQuiz / grade", () => {
  it("two questions per word, answer always among options", () => {
    for (let seed = 1; seed < 50; seed++) {
      const qs = buildQuiz([tener, casa, bueno], pool, es, { speech: true, rng: seeded(seed) })
      assert.equal(qs.length, 6)
      for (const q of qs) {
        if (q.options) {
          assert.ok(q.options.includes(q.answer), `${q.kind}: answer missing from options`)
          assert.equal(new Set(q.options).size, q.options.length, `${q.kind}: duplicate options`)
        }
      }
      assert.ok(
        qs.some((q) => q.kind.startsWith("listen")),
        "speech on → at least one listening question"
      )
    }
  })

  it("no listening questions without speech; usage questions match the data", () => {
    for (let seed = 1; seed < 50; seed++) {
      const qs = buildQuiz([tener, casa, bueno], pool, es, { speech: false, rng: seeded(seed) })
      assert.ok(!qs.some((q) => q.kind.startsWith("listen")))
      const kinds = (id: string) => qs.filter((q) => q.wordId === id).map((q) => q.kind)
      assert.ok(kinds("casa").includes("gender"), "noun with m/f gender gets the article question")
      assert.ok(kinds("bueno").includes("gendered-form"))
      assert.ok(kinds("tener").some((k) => k === "conjugation" || k === "cloze"))
    }
  })

  it("cloze blanks the word and keeps its original casing as the answer", () => {
    // No conjugation → cloze is the only usage question this word supports.
    const word: Word = {
      ...tener,
      conjugation: undefined,
      examples: [{ text: "Tener un perro es bonito.", en: "Having a dog is nice." }],
    }
    const q = buildQuiz([word], pool, es, { speech: false, rng: seeded(3) }).find((x) => x.kind === "cloze")!
    assert.equal(q.prompt, "_____ un perro es bonito.")
    assert.equal(q.answer, "Tener")
    assert.equal(q.reveal.text, "Tener un perro es bonito.", "after answering, the full sentence is spoken")
  })

  it("grading: typed answers tolerate case, punctuation and missing accents", () => {
    const q: QuizQuestion = { kind: "listen-type", wordId: "x", prompt: "", answer: "está", reveal: { text: "está" } }
    assert.equal(grade(q, " Está! "), "correct")
    assert.equal(grade(q, "esta"), "accent")
    assert.equal(grade(q, "eso"), "wrong")
    assert.equal(grade({ ...q, options: ["está", "esta"] }, "esta"), "wrong", "multiple choice must be exact")
    assert.equal(normalizeAnswer("¿Qué?"), "qué")
  })

  it("one-letter words never get listening questions", () => {
    const y: Word = { id: "y", lemma: "y", pos: "conj", rank: 8, glosses: ["and"], examples: [] }
    for (let seed = 1; seed < 50; seed++) {
      const qs = buildQuiz([y], pool, es, { speech: true, rng: seeded(seed) })
      assert.equal(qs.length, 2)
      assert.ok(!qs.some((q) => q.kind.startsWith("listen")))
    }
  })

  it("every question speaks the answer in the target language afterwards", () => {
    for (let seed = 1; seed < 30; seed++) {
      for (const q of buildQuiz([tener, casa, bueno], pool, es, { speech: true, rng: seeded(seed) })) {
        assert.ok(q.reveal.text, `${q.kind}: nothing to say`)
        if (q.kind === "meaning")
          assert.equal(q.reveal.text, q.prompt, "meaning: speak the Spanish word, not the English gloss")
        if (q.kind === "gender") assert.equal(q.reveal.text, "la casa")
        if (q.kind === "gendered-form") assert.equal(q.reveal.text, "buena")
        if (q.kind === "conjugation" || q.kind.startsWith("listen") || q.kind === "reverse")
          assert.equal(q.reveal.text, q.answer)
      }
    }
  })
})
