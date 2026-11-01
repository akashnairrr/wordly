import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  buildQuiz,
  grade,
  nearby,
  normalizeAnswer,
  type QuizQuestion,
  type QuizResult,
  shortGloss,
  splitAsides,
  summarize,
  XP,
  xpShare,
} from "./quiz"
import { bueno, casa, es, pool, seeded, tener } from "./test-fixtures"
import { getLanguage } from "./languages"
import type { IndexEntry, Word } from "./types"

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

  it("Russian has no articles: the gender question asks for the gender by name", () => {
    const okno: Word = { ...casa, id: "okno", lemma: "окно", gender: "n", forms: { plural: "окна" } }
    for (let seed = 1; seed < 20; seed++) {
      const q = buildQuiz([okno], pool, getLanguage("ru"), { speech: false, rng: seeded(seed) }).find(
        (q) => q.kind === "gender"
      )
      if (!q) continue
      assert.deepEqual(q.options, ["masculine", "feminine", "neuter"])
      assert.equal(q.answer, "neuter")
      assert.equal(q.reveal.text, "окно")
      return
    }
    assert.fail("no gender question for a Russian noun")
  })

  it("German nouns get a three-way der / die / das question, neuter included", () => {
    const haus: Word = { ...casa, id: "haus", lemma: "Haus", gender: "n", forms: { plural: "Häuser" } }
    for (let seed = 1; seed < 20; seed++) {
      const q = buildQuiz([haus], pool, getLanguage("de"), { speech: false, rng: seeded(seed) }).find(
        (q) => q.kind === "gender"
      )
      if (!q) continue
      assert.deepEqual(q.options, ["der", "die", "das"])
      assert.equal(q.answer, "das")
      assert.equal(q.reveal.text, "das Haus")
      return
    }
    assert.fail("no gender question for a neuter noun")
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

  it("shortGloss keeps the core meaning", () => {
    assert.equal(shortGloss("I (first person singular nominative (subject) pronoun)"), "I")
    assert.equal(shortGloss("she; her"), "she")
    assert.equal(shortGloss("of the, from the (+ a masculine noun in singular)."), "of the, from the")
    assert.equal(shortGloss("(only in parentheses)"), "(only in parentheses)", "never empty")
    assert.equal(shortGloss("first-person singular pronoun in the nominative case; I"), "I", "shortest sense")
    assert.equal(shortGloss("you (singular familiar), thou"), "you, thou")
    assert.equal(shortGloss("to make, to produce, to create"), "to make, to produce")
  })

  it("splitAsides separates bracketed notes, nested too", () => {
    assert.deepEqual(splitAsides("I (first (subject) pronoun) here"), [
      { text: "I ", aside: false },
      { text: "(first (subject) pronoun)", aside: true },
      { text: " here", aside: false },
    ])
    assert.deepEqual(splitAsides("house"), [{ text: "house", aside: false }])
  })

  it("distractors come from the closest ranks, without inflection glosses", () => {
    const entry = (rank: number, gloss = `word ${rank}`): IndexEntry => ({
      id: `w${rank}`,
      lemma: `w${rank}`,
      pos: "pron",
      rank,
      gloss,
    })
    const big = [
      ...Array.from({ length: 40 }, (_, n) => entry(n * 10 + 10)),
      entry(101, "Dative singular forms of alles"),
    ]
    const near = nearby({ id: "x", pos: "pron", rank: 100 }, big)
    assert.equal(near.length, 8)
    assert.ok(
      near.every((p) => Math.abs(p.rank - 100) <= 40),
      "closest ranks only"
    )
    assert.ok(!near.some((p) => p.id === "w101"), "inflection gloss excluded")
  })
})

describe("summarize", () => {
  const q = (wordId: string): QuizQuestion => ({
    kind: "meaning",
    wordId,
    prompt: wordId,
    answer: "a",
    reveal: { text: wordId },
  })
  const [a, b, c] = [q("a"), q("b"), q("c")]
  const r = (question: QuizQuestion, right: boolean, retry = false): QuizResult => ({
    question,
    given: right ? "a" : "x",
    grade: right ? "correct" : "wrong",
    retry,
  })

  it("scores first tries; one retry decides what progress records", () => {
    // b: wrong, then right on retry. c: wrong twice.
    const s = summarize([r(a, true), r(b, false), r(c, false), r(b, true, true), r(c, false, true)])
    assert.deepEqual([s.score, s.total], [1, 3])
    assert.deepEqual(s.progress, [
      { wordId: "a", correct: true },
      { wordId: "b", correct: true },
      { wordId: "c", correct: false },
    ])
    assert.deepEqual(s.missed, ["c"])
    assert.equal(s.xp, XP.firstTry + XP.retry)
    assert.equal(s.bestCombo, 1)
  })

  it("perfect run and match round bonuses; combo counts the longest streak", () => {
    const s = summarize([r(a, true), r(b, true), r(c, true)], 0)
    assert.equal(s.xp, 3 * XP.firstTry + XP.perfect + XP.match)
    assert.equal(s.bestCombo, 3)
    assert.equal(summarize([r(a, true)], 2).xp, XP.firstTry + XP.perfect + XP.matchWithMistakes)
  })

  it("reviewed words earn less: full, then half, a quarter, nothing", () => {
    assert.deepEqual([0, 1, 2, 3, 9].map(xpShare), [1, 0.5, 0.25, 0, 0])
    // a new, b on its first review, c on its third: answers 10 + 5 + 0, bonuses at the average share of 0.5.
    const seen = { a: 0, b: 1, c: 3 } as Record<string, number>
    const s = summarize([r(a, true), r(b, true), r(c, true)], 0, (id) => seen[id]!)
    assert.equal(s.share, 0.5)
    assert.equal(s.xp, 15 + 0.5 * (XP.perfect + XP.match))
    assert.equal(summarize([r(c, true)], 0, () => 5).xp, 0, "well-worn words earn nothing")
  })
})
