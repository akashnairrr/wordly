import assert from "node:assert/strict";
import { test } from "node:test";
import { LANGUAGES } from "./languages";
import { emptyProgress, recordSession, skipWord, unskipWord } from "./progress";
import { buildQuiz, grade, normalizeAnswer, type QuizQuestion } from "./quiz";
import { difficulty, pickNewWords, planLesson, reviewQueue, wordStatus } from "./session";
import type { IndexEntry, Word } from "./types";

const es = LANGUAGES.es;

// Deterministic RNG so failures are reproducible.
function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

const tener: Word = {
  id: "tener",
  lemma: "tener",
  pos: "verb",
  rank: 1,
  glosses: ["to have"],
  conjugation: { indicative: { present: { "1s": "tengo", "2s": "tienes", "3s": "tiene", "1p": "tenemos" } } },
  examples: [{ text: "Tengo un perro.", en: "I have a dog." }],
};
const casa: Word = { id: "casa", lemma: "casa", pos: "noun", rank: 2, glosses: ["house"], gender: "f", forms: { plural: "casas" }, examples: [] };
const bueno: Word = {
  id: "bueno",
  lemma: "bueno",
  pos: "adj",
  rank: 3,
  glosses: ["good"],
  forms: { feminine: "buena", masculinePlural: "buenos", femininePlural: "buenas" },
  examples: [],
};
const pool: IndexEntry[] = [
  ...[tener, casa, bueno].map((w) => ({ id: w.id, lemma: w.lemma, pos: w.pos, rank: w.rank, gloss: w.glosses[0] })),
  { id: "ser", lemma: "ser", pos: "verb", rank: 4, gloss: "to be" },
  { id: "ir", lemma: "ir", pos: "verb", rank: 5, gloss: "to go" },
  { id: "hacer", lemma: "hacer", pos: "verb", rank: 6, gloss: "to do" },
  { id: "perro", lemma: "perro", pos: "noun", rank: 7, gloss: "dog" },
];

test("quiz: two questions per word, answer always among options", () => {
  for (let seed = 1; seed < 50; seed++) {
    const qs = buildQuiz([tener, casa, bueno], pool, es, { speech: true, rng: seeded(seed) });
    assert.equal(qs.length, 6);
    for (const q of qs) {
      if (q.options) {
        assert.ok(q.options.includes(q.answer), `${q.kind}: answer missing from options`);
        assert.equal(new Set(q.options).size, q.options.length, `${q.kind}: duplicate options`);
      }
    }
    assert.ok(qs.some((q) => q.kind.startsWith("listen")), "speech on → at least one listening question");
  }
});

test("quiz: no listening questions without speech; usage questions match the data", () => {
  for (let seed = 1; seed < 50; seed++) {
    const qs = buildQuiz([tener, casa, bueno], pool, es, { speech: false, rng: seeded(seed) });
    assert.ok(!qs.some((q) => q.kind.startsWith("listen")));
    const kinds = (id: string) => qs.filter((q) => q.wordId === id).map((q) => q.kind);
    assert.ok(kinds("casa").includes("gender"), "noun with m/f gender gets the article question");
    assert.ok(kinds("bueno").includes("gendered-form"));
    assert.ok(kinds("tener").some((k) => k === "conjugation" || k === "cloze"));
  }
});

test("quiz: cloze blanks the word and keeps its original casing as the answer", () => {
  // No conjugation → cloze is the only usage question this word supports.
  const word: Word = { ...tener, conjugation: undefined, examples: [{ text: "Tener un perro es bonito.", en: "Having a dog is nice." }] };
  const q = buildQuiz([word], pool, es, { speech: false, rng: seeded(3) }).find((x) => x.kind === "cloze")!;
  assert.equal(q.prompt, "_____ un perro es bonito.");
  assert.equal(q.answer, "Tener");
});

test("grading: typed answers tolerate case, punctuation and missing accents", () => {
  const q: QuizQuestion = { kind: "listen-type", wordId: "x", prompt: "", answer: "está" };
  assert.equal(grade(q, " Está! "), "correct");
  assert.equal(grade(q, "esta"), "accent");
  assert.equal(grade(q, "eso"), "wrong");
  assert.equal(grade({ ...q, options: ["está", "esta"] }, "esta"), "wrong", "multiple choice must be exact");
  assert.equal(normalizeAnswer("¿Qué?"), "qué");
});

test("session: difficulty bands and next unlearned words by rank", () => {
  assert.deepEqual([5, 8, 9, 12, 13, 15].map(difficulty), ["easy", "easy", "moderate", "moderate", "hard", "hard"]);
  const p = { ...emptyProgress(), learned: { tener: { learnedAt: "", correct: 1, wrong: 0 } } };
  assert.deepEqual(pickNewWords(pool, p, 5).map((w) => w.id), ["casa", "bueno", "ser", "ir", "hacer"]);
});

test("progress: recordSession counts answers and tracks the streak", () => {
  const day1 = new Date(2026, 9, 30, 12);
  const day2 = new Date(2026, 9, 31, 12);
  let p = recordSession(emptyProgress(), [{ wordId: "casa", correct: true }, { wordId: "casa", correct: false }], "lesson", day1);
  assert.deepEqual([p.learned.casa.correct, p.learned.casa.wrong, p.streak], [1, 1, 1]);
  p = recordSession(p, [{ wordId: "ser", correct: true }], "lesson", day2);
  assert.equal(p.streak, 2);
  p = recordSession(p, [{ wordId: "ir", correct: true }], "review", day2);
  assert.equal(p.streak, 2, "second session same day doesn't double count");
  assert.equal(p.history.length, 3);
});

test("quiz: one-letter words never get listening questions", () => {
  const y: Word = { id: "y", lemma: "y", pos: "conj", rank: 8, glosses: ["and"], examples: [] };
  for (let seed = 1; seed < 50; seed++) {
    const qs = buildQuiz([y], pool, es, { speech: true, rng: seeded(seed) });
    assert.equal(qs.length, 2);
    assert.ok(!qs.some((q) => q.kind.startsWith("listen")));
  }
});

test("skip: skipped words leave new lessons and reviews, and come back when un-skipped", () => {
  let p = skipWord(emptyProgress(), "tener");
  assert.equal(wordStatus("tener", p), "skipped");
  assert.ok(!pickNewWords(pool, p, 5).some((w) => w.id === "tener"));
  p = unskipWord(p, "tener");
  assert.equal(pickNewWords(pool, p, 5)[0].id, "tener");
});

test("review: weakest and least recently seen first; lessons mix in 1 old word per 5 new", () => {
  const at = (d: number) => new Date(2026, 9, d).toISOString();
  const p = {
    ...emptyProgress(),
    learned: {
      tener: { learnedAt: at(1), reviewedAt: at(5), correct: 2, wrong: 0 },
      casa: { learnedAt: at(1), reviewedAt: at(2), correct: 2, wrong: 0 },
      bueno: { learnedAt: at(1), reviewedAt: at(9), correct: 0, wrong: 2 },
    },
  };
  assert.deepEqual(reviewQueue(pool, p).map((w) => w.id), ["bueno", "casa", "tener"]);
  assert.deepEqual(reviewQueue(pool, p, true).map((w) => w.id), ["bueno"]);
  assert.equal(wordStatus("bueno", p), "practice");
  const plan = planLesson(pool, p, 10);
  assert.deepEqual(plan.review.map((w) => w.id), ["bueno", "casa"]);
  assert.ok(!plan.fresh.some((w) => p.learned[w.id as keyof typeof p.learned]));
});
