import type { Language } from "./languages"
import type { IndexEntry, Person, Word } from "./types"
import { allForms, stripAccents, tokenize } from "./words"

export type QuestionKind =
  "meaning" | "reverse" | "listen-select" | "listen-type" | "conjugation" | "gender" | "gendered-form" | "cloze"

export interface QuizQuestion {
  kind: QuestionKind
  wordId: string
  /** What is shown (word, gloss, sentence with a blank…). Empty for listening questions. */
  prompt: string
  /** Extra context under the prompt (translation, person + tense…). */
  hint?: string
  /** Text to speak for listening questions. */
  audio?: string
  /** Native-speaker recording of `audio`, preferred over text-to-speech. */
  audioUrl?: string
  /** Multiple choice options; absent for typed answers. */
  options?: string[]
  answer: string
  /** Spoken once the learner has answered: the correct answer in the target language, in context. */
  reveal: { text: string; audio?: string }
}

export type Grade = "correct" | "accent" | "wrong"

/** One answered question. A question missed on the first try comes back once more, as a retry. */
export interface QuizResult {
  question: QuizQuestion
  given: string
  grade: Grade
  retry: boolean
}

type Rng = () => number

export function shuffle<T>(xs: T[], rng: Rng): T[] {
  const a = xs.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** Answer plus up to 3 distractors, shuffled. */
function options(answer: string, candidates: string[], rng: Rng): string[] {
  const distractors = shuffle(
    [...new Set(candidates)].filter((c) => c && c !== answer),
    rng
  ).slice(0, 3)
  return shuffle([answer, ...distractors], rng)
}

export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/^[¿¡.,!?;:"'«»\s]+|[¿¡.,!?;:"'«»\s]+$/g, "")
    .replace(/\s+/g, " ")
}

/** Missing accents count as right but are flagged, so a typed "esta" for "está" earns a reminder. */
export function grade(q: QuizQuestion, given: string): Grade {
  const a = normalizeAnswer(q.answer)
  const g = normalizeAnswer(given)
  if (g === a) return "correct"
  if (!q.options && stripAccents(g) === stripAccents(a)) return "accent"
  return "wrong"
}

type Maker = (w: Word, ctx: Ctx) => QuizQuestion | undefined
interface Ctx {
  lang: Language
  pool: IndexEntry[]
  rng: Rng
}

/**
 * Option-sized meaning: no parentheses, the shortest ";" sense, at most two "," synonyms.
 * "I (first person singular (subject) pronoun)" → "I"; "masculine singular definite article; the" → "the".
 */
export function shortGloss(g: string): string {
  let s = g
  for (let prev = ""; prev !== s;) [prev, s] = [s, s.replace(/\([^()]*\)/g, "")]
  const senses = s
    .split(";")
    .map((x) => x.replace(/\s+/g, " ").replace(/ ,/g, ",").replace(/\.$/, "").trim())
    .filter(Boolean)
  const shortest = senses.reduce<string | undefined>((a, x) => (a && a.length <= x.length ? a : x), undefined)
  return shortest?.split(", ").slice(0, 2).join(", ") || g
}

/** Splits out bracketed notes, nested ones included: "I (first (subject) person)" → "I ", "(first (subject) person)". */
export function splitAsides(text: string): { text: string; aside: boolean }[] {
  const parts: { text: string; aside: boolean }[] = []
  let depth = 0
  for (const ch of text) {
    const aside = depth > 0 || ch === "("
    if (ch === "(") depth++
    if (ch === ")") depth = Math.max(0, depth - 1)
    const last = parts.at(-1)
    if (last?.aside === aside) last.text += ch
    else parts.push({ text: ch, aside })
  }
  return parts
}

// Inflection glosses ("Dative singular … forms of alles") and usage notes ("Used as an emphatic pronoun…") look
// nothing like a meaning and give the answer away.
const odd = (gloss: string) => /\bforms? of\b/i.test(gloss) || shortGloss(gloss).length > 30

/** Distractor candidates: same part of speech, closest in frequency rank, so they're about as familiar as the word. */
export function nearby(w: Pick<Word, "id" | "pos" | "rank">, pool: IndexEntry[]): IndexEntry[] {
  const others = pool.filter((p) => p.id !== w.id && !odd(p.gloss))
  const same = others.filter((p) => p.pos === w.pos)
  return (same.length >= 3 ? same : others)
    .sort((a, b) => Math.abs(a.rank - w.rank) - Math.abs(b.rank - w.rank))
    .slice(0, 8)
}

const sayWord = (w: Word) => ({ text: w.lemma, audio: w.audio })
const sayForm = (w: Word, form: string) => ({ text: form, audio: form === w.lemma ? w.audio : w.formAudio?.[form] })

const meaning: Maker = (w, { pool, rng }) => ({
  kind: "meaning",
  wordId: w.id,
  prompt: w.lemma,
  options: options(
    shortGloss(w.glosses[0]),
    nearby(w, pool).map((p) => shortGloss(p.gloss)),
    rng
  ),
  answer: shortGloss(w.glosses[0]),
  reveal: sayWord(w),
})

const reverse: Maker = (w, { pool, rng }) => ({
  kind: "reverse",
  wordId: w.id,
  prompt: w.glosses[0],
  options: options(
    w.lemma,
    nearby(w, pool).map((p) => p.lemma),
    rng
  ),
  answer: w.lemma,
  reveal: sayWord(w),
})

// Spoken alone, one-letter words (a, y, o, e) sound like letter names or homophones — not fair to test by ear.
const audible = (w: Word) => [...w.lemma].length > 1

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
          nearby(w, pool).map((p) => p.lemma),
          rng
        ),
        answer: w.lemma,
        reveal: sayWord(w),
      }
    : undefined

const listenType: Maker = (w) =>
  audible(w)
    ? {
        kind: "listen-type",
        wordId: w.id,
        prompt: "",
        audio: w.lemma,
        audioUrl: w.audio,
        hint: shortGloss(w.glosses[0]),
        answer: w.lemma,
        reveal: sayWord(w),
      }
    : undefined

const conjugation: Maker = (w, { lang, rng }) => {
  const cells = lang.tenses.flatMap(({ mood, tense, label }) =>
    Object.entries(w.conjugation?.[mood]?.[tense] ?? {}).map(([person, form]) => ({
      mood,
      tense,
      label,
      person: person as Person,
      form: form!,
    }))
  )
  if (cells.length < 4) return
  const c = cells[Math.floor(rng() * cells.length)]!
  return {
    kind: "conjugation",
    wordId: w.id,
    prompt: w.lemma,
    hint: `${lang.personLabels[c.person]} · ${c.label}`,
    options: options(
      c.form,
      cells.map((x) => x.form),
      rng
    ),
    answer: c.form,
    reveal: sayForm(w, c.form),
  }
}

const GENDER_NAMES = { m: "masculine", f: "feminine", n: "neuter" } as const

const gender: Maker = (w, { lang }) => {
  if (!w.gender || w.gender === "mf") return
  const hint = shortGloss(w.glosses[0])
  // No articles (Russian): ask for the gender by name.
  if (!lang.articles) {
    return {
      kind: "gender",
      wordId: w.id,
      prompt: w.lemma,
      hint,
      options: Object.values(GENDER_NAMES),
      answer: GENDER_NAMES[w.gender],
      reveal: { text: w.lemma },
    }
  }
  const article = lang.articles[w.gender]
  if (!article) return
  return {
    kind: "gender",
    wordId: w.id,
    prompt: w.lemma,
    hint,
    // el / la, or der / die / das.
    options: Object.values(lang.articles),
    answer: article,
    // Article + noun together, so the gender is heard with the word (no recording exists for the pair).
    reveal: { text: `${article} ${w.lemma}` },
  }
}

const genderedForm: Maker = (w, { rng }) => {
  const f = w.forms
  if (!f?.feminine) return
  return {
    kind: "gendered-form",
    wordId: w.id,
    prompt: w.lemma,
    hint: shortGloss(w.glosses[0]),
    options: options(
      f.feminine,
      [w.lemma, f.masculinePlural, f.femininePlural, f.plural].filter(Boolean) as string[],
      rng
    ),
    answer: f.feminine,
    reveal: sayForm(w, f.feminine),
  }
}

const cloze: Maker = (w, { pool, rng }) => {
  const forms = allForms(w)
  const lower = new Set(forms.map((f) => f.toLowerCase()))
  for (const ex of shuffle(w.examples, rng)) {
    const hit = tokenize(ex.text).find((t) => lower.has(t))
    if (!hit) continue
    const re = new RegExp(`(?<!\\p{L})${hit}(?!\\p{L})`, "iu")
    const answer = ex.text.match(re)![0]
    const others = forms.length >= 4 ? forms : nearby(w, pool).map((p) => p.lemma)
    return {
      kind: "cloze",
      wordId: w.id,
      prompt: ex.text.replace(re, "_____"),
      hint: ex.en,
      options: options(
        answer,
        others.filter((o) => o.toLowerCase() !== answer.toLowerCase()),
        rng
      ),
      answer,
      // The whole sentence with the gap filled, in the native recording when Tatoeba has one.
      reveal: { text: ex.text, audio: ex.audio },
    }
  }
}

const CORE: Maker[] = [meaning, reverse]
const LISTEN: Maker[] = [listenSelect, listenType]
const SPECIFIC: Maker[] = [conjugation, gender, genderedForm, cloze]

/**
 * Two questions per word: one recall question (meaning / reverse / listening) and one about how the word
 * is used (conjugation, gender, gendered form, sentence cloze) when the data supports it.
 * With speech available, at least one listening question is guaranteed (if any word is long enough to hear).
 */
export function buildQuiz(
  words: Word[],
  pool: IndexEntry[],
  lang: Language,
  opts: { speech: boolean; rng?: Rng }
): QuizQuestion[] {
  const rng = opts.rng ?? Math.random
  const ctx: Ctx = { lang, pool, rng }
  const recall = opts.speech ? [...CORE, ...LISTEN] : CORE
  const qs: QuizQuestion[] = []
  for (const w of words) {
    // Meaning/reverse always apply, so there are at least two recall questions.
    const [first, other] = shuffle(recall, rng)
      .map((m) => m(w, ctx))
      .filter((q): q is QuizQuestion => !!q)
    const usage = shuffle(SPECIFIC, rng)
      .map((m) => m(w, ctx))
      .find(Boolean)
    qs.push(first!, (usage ?? other)!)
  }
  if (opts.speech && !qs.some((q) => q.kind.startsWith("listen"))) {
    const byId = new Map(words.map((w) => [w.id, w]))
    const i = qs.findIndex((q) => (q.kind === "meaning" || q.kind === "reverse") && audible(byId.get(q.wordId)!))
    if (i >= 0) qs[i] = listenSelect(byId.get(qs[i]!.wordId)!, ctx)!
  }
  return shuffle(qs, rng)
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
}

export const XP = { firstTry: 10, retry: 5, perfect: 20, match: 10, matchWithMistakes: 5 } as const

/** Share of XP a word earns by how many earlier sessions it was in: full when new, then ½, ¼, nothing. */
export const xpShare = (timesSeen: number) => [1, 0.5, 0.25][timesSeen] ?? 0

export interface QuizSummary {
  /** First tries right, out of questions asked. */
  score: number
  total: number
  /** Longest run of right answers, retries included, in the order answered. */
  bestCombo: number
  xp: number
  /** Average XP share of the quiz's words: below 1 when reviewed words earned less. */
  share: number
  /** Words with a question still wrong after its retry. */
  missed: string[]
  /** One entry per question: right on the first try or the retry. */
  progress: { wordId: string; correct: boolean }[]
}

/**
 * Scores a finished quiz. `matchMistakes` is undefined when the match round didn't run.
 * `timesSeen` counts a word's earlier sessions; answers earn XP by their word's share, bonuses by the average share.
 */
export function summarize(
  attempts: QuizResult[],
  matchMistakes?: number,
  timesSeen: (wordId: string) => number = () => 0
): QuizSummary {
  const ok = (r: QuizResult) => r.grade !== "wrong"
  const first = attempts.filter((r) => !r.retry)
  const retries = attempts.filter((r) => r.retry)
  const progress = first.map((r) => ({
    wordId: r.question.wordId,
    // A word's questions are of different kinds, so word + kind pairs a retry with its first try.
    correct:
      ok(r) ||
      retries.some((x) => x.question.wordId === r.question.wordId && x.question.kind === r.question.kind && ok(x)),
  }))
  let combo = 0
  let bestCombo = 0
  for (const r of attempts) bestCombo = Math.max(bestCombo, (combo = ok(r) ? combo + 1 : 0))
  const score = first.filter(ok).length
  const shareOf = (r: QuizResult) => xpShare(timesSeen(r.question.wordId))
  const words = [...new Set(first.map((r) => r.question.wordId))]
  const share = words.length ? words.reduce((sum, id) => sum + xpShare(timesSeen(id)), 0) / words.length : 1
  const xp = Math.round(
    first.filter(ok).reduce((sum, r) => sum + XP.firstTry * shareOf(r), 0) +
      retries.filter(ok).reduce((sum, r) => sum + XP.retry * shareOf(r), 0) +
      share *
        ((first.length && score === first.length ? XP.perfect : 0) +
          (matchMistakes === undefined ? 0 : matchMistakes ? XP.matchWithMistakes : XP.match))
  )
  return {
    score,
    total: first.length,
    bestCombo,
    xp,
    share,
    missed: [...new Set(progress.filter((p) => !p.correct).map((p) => p.wordId))],
    progress,
  }
}
