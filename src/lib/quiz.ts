import type { Language } from "./languages";
import type { IndexEntry, Person, Word } from "./types";
import { allForms, stripAccents, tokenize } from "./words";

export type QuestionKind = "meaning" | "reverse" | "listen-select" | "listen-type" | "conjugation" | "gender" | "gendered-form" | "cloze";

export interface QuizQuestion {
  kind: QuestionKind;
  wordId: string;
  /** What is shown (word, gloss, sentence with a blank…). Empty for listening questions. */
  prompt: string;
  /** Extra context under the prompt (translation, person + tense…). */
  hint?: string;
  /** Text to speak for listening questions. */
  audio?: string;
  /** Native-speaker recording of `audio`, preferred over text-to-speech. */
  audioUrl?: string;
  /** Multiple choice options; absent for typed answers. */
  options?: string[];
  answer: string;
  /** Spoken once the learner has answered: the correct answer in the target language, in context. */
  reveal: { text: string; audio?: string };
}

export type Grade = "correct" | "accent" | "wrong";

type Rng = () => number;

function shuffle<T>(xs: T[], rng: Rng): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Answer plus up to 3 distractors, shuffled. */
function options(answer: string, candidates: string[], rng: Rng): string[] {
  const distractors = shuffle(
    [...new Set(candidates)].filter((c) => c && c !== answer),
    rng,
  ).slice(0, 3);
  return shuffle([answer, ...distractors], rng);
}

export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/^[¿¡.,!?;:"'«»\s]+|[¿¡.,!?;:"'«»\s]+$/g, "")
    .replace(/\s+/g, " ");
}

/** Missing accents count as right but are flagged, so a typed "esta" for "está" earns a reminder. */
export function grade(q: QuizQuestion, given: string): Grade {
  const a = normalizeAnswer(q.answer);
  const g = normalizeAnswer(given);
  if (g === a) return "correct";
  if (!q.options && stripAccents(g) === stripAccents(a)) return "accent";
  return "wrong";
}

type Maker = (w: Word, ctx: Ctx) => QuizQuestion | undefined;
interface Ctx {
  lang: Language;
  pool: IndexEntry[];
  rng: Rng;
}

const samePos = (w: Word, pool: IndexEntry[]) => {
  const same = pool.filter((p) => p.pos === w.pos && p.id !== w.id);
  return same.length >= 3 ? same : pool.filter((p) => p.id !== w.id);
};

const sayWord = (w: Word) => ({ text: w.lemma, audio: w.audio });
const sayForm = (w: Word, form: string) => ({ text: form, audio: form === w.lemma ? w.audio : w.formAudio?.[form] });

const meaning: Maker = (w, { pool, rng }) => ({
  kind: "meaning",
  wordId: w.id,
  prompt: w.lemma,
  options: options(
    w.glosses[0],
    samePos(w, pool).map((p) => p.gloss),
    rng,
  ),
  answer: w.glosses[0],
  reveal: sayWord(w),
});

const reverse: Maker = (w, { pool, rng }) => ({
  kind: "reverse",
  wordId: w.id,
  prompt: w.glosses[0],
  options: options(
    w.lemma,
    samePos(w, pool).map((p) => p.lemma),
    rng,
  ),
  answer: w.lemma,
  reveal: sayWord(w),
});

// Spoken alone, one-letter words (a, y, o, e) sound like letter names or homophones — not fair to test by ear.
const audible = (w: Word) => [...w.lemma].length > 1;

const listenSelect: Maker = (w, { pool, rng }) =>
  audible(w)
    ? {
        kind: "listen-select",
        wordId: w.id,
        prompt: "",
        audio: w.lemma,
        audioUrl: w.audio,
        options: options(
          w.lemma,
          samePos(w, pool).map((p) => p.lemma),
          rng,
        ),
        answer: w.lemma,
        reveal: sayWord(w),
      }
    : undefined;

const listenType: Maker = (w) =>
  audible(w)
    ? { kind: "listen-type", wordId: w.id, prompt: "", audio: w.lemma, audioUrl: w.audio, hint: w.glosses[0], answer: w.lemma, reveal: sayWord(w) }
    : undefined;

const conjugation: Maker = (w, { lang, rng }) => {
  const cells = lang.tenses.flatMap(({ mood, tense, label }) =>
    Object.entries(w.conjugation?.[mood]?.[tense] ?? {}).map(([person, form]) => ({ mood, tense, label, person: person as Person, form: form! })),
  );
  if (cells.length < 4) return;
  const c = cells[Math.floor(rng() * cells.length)];
  return {
    kind: "conjugation",
    wordId: w.id,
    prompt: w.lemma,
    hint: `${lang.personLabels[c.person]} · ${c.label}`,
    options: options(
      c.form,
      cells.map((x) => x.form),
      rng,
    ),
    answer: c.form,
    reveal: sayForm(w, c.form),
  };
};

const gender: Maker = (w, { lang }) => {
  if (w.gender !== "m" && w.gender !== "f") return;
  const article = lang.articles[w.gender];
  return {
    kind: "gender",
    wordId: w.id,
    prompt: w.lemma,
    hint: w.glosses[0],
    options: [lang.articles.m, lang.articles.f],
    answer: article,
    // Article + noun together, so the gender is heard with the word (no recording exists for the pair).
    reveal: { text: `${article} ${w.lemma}` },
  };
};

const genderedForm: Maker = (w, { rng }) => {
  const f = w.forms;
  if (!f?.feminine) return;
  return {
    kind: "gendered-form",
    wordId: w.id,
    prompt: w.lemma,
    hint: w.glosses[0],
    options: options(f.feminine, [w.lemma, f.masculinePlural, f.femininePlural, f.plural].filter(Boolean) as string[], rng),
    answer: f.feminine,
    reveal: sayForm(w, f.feminine),
  };
};

const cloze: Maker = (w, { pool, rng }) => {
  const forms = allForms(w);
  const lower = new Set(forms.map((f) => f.toLowerCase()));
  for (const ex of shuffle(w.examples, rng)) {
    const hit = tokenize(ex.text).find((t) => lower.has(t));
    if (!hit) continue;
    const re = new RegExp(`(?<!\\p{L})${hit}(?!\\p{L})`, "iu");
    const answer = ex.text.match(re)![0];
    const others = forms.length >= 4 ? forms : samePos(w, pool).map((p) => p.lemma);
    return {
      kind: "cloze",
      wordId: w.id,
      prompt: ex.text.replace(re, "_____"),
      hint: ex.en,
      options: options(
        answer,
        others.filter((o) => o.toLowerCase() !== answer.toLowerCase()),
        rng,
      ),
      answer,
      // The whole sentence with the gap filled, in the native recording when Tatoeba has one.
      reveal: { text: ex.text, audio: ex.audio },
    };
  }
};

const CORE: Maker[] = [meaning, reverse];
const LISTEN: Maker[] = [listenSelect, listenType];
const SPECIFIC: Maker[] = [conjugation, gender, genderedForm, cloze];

/**
 * Two questions per word: one recall question (meaning / reverse / listening) and one about how the word
 * is used (conjugation, gender, gendered form, sentence cloze) when the data supports it.
 * With speech available, at least one listening question is guaranteed (if any word is long enough to hear).
 */
export function buildQuiz(words: Word[], pool: IndexEntry[], lang: Language, opts: { speech: boolean; rng?: Rng }): QuizQuestion[] {
  const rng = opts.rng ?? Math.random;
  const ctx: Ctx = { lang, pool, rng };
  const recall = opts.speech ? [...CORE, ...LISTEN] : CORE;
  const qs: QuizQuestion[] = [];
  for (const w of words) {
    // Meaning/reverse always apply, so there are at least two recall questions.
    const [first, other] = shuffle(recall, rng)
      .map((m) => m(w, ctx))
      .filter((q): q is QuizQuestion => !!q);
    const usage = shuffle(SPECIFIC, rng)
      .map((m) => m(w, ctx))
      .find(Boolean);
    qs.push(first, usage ?? other);
  }
  if (opts.speech && !qs.some((q) => q.kind.startsWith("listen"))) {
    const i = qs.findIndex((q) => (q.kind === "meaning" || q.kind === "reverse") && audible(words.find((w) => w.id === q.wordId)!));
    if (i >= 0)
      qs[i] = listenSelect(
        words.find((w) => w.id === qs[i].wordId)!,
        ctx,
      )!;
  }
  return shuffle(qs, rng);
}

export const QUESTION_TITLES: Record<QuestionKind, string> = {
  meaning: "What does this mean?",
  reverse: "How do you say this?",
  "listen-select": "Which word did you hear?",
  "listen-type": "Type the word you hear",
  conjugation: "Pick the right form",
  gender: "Which article?",
  "gendered-form": "What is the feminine form?",
  cloze: "Fill in the blank",
};
