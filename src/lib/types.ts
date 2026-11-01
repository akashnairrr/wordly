// Shared by the data pipeline (scripts/build-data) and the app.

export type Pos = "noun" | "verb" | "adj" | "adv" | "pron" | "prep" | "conj" | "det" | "intj" | "num" | "other"

export type Mood = "indicative" | "subjunctive" | "imperative"
export type Tense =
  "present" | "preterite" | "imperfect" | "perfect" | "future" | "conditional" | "affirmative" | "negative"
export type Person = "1s" | "2s" | "3s" | "1p" | "2p" | "3p"

export type Conjugation = Partial<Record<Mood, Partial<Record<Tense, Partial<Record<Person, string>>>>>>

/** Meaning of one word in an example sentence. */
export interface TokenGloss {
  /** Short English meaning. */
  g: string
  /** Dictionary form, when the word is inflected (vamos → ir). */
  l?: string
}

export interface Example {
  text: string
  en: string
  /** Human recording of `text` (Tatoeba), when one exists. */
  audio?: string
  /**
   * Word-by-word meanings, aligned with the letter runs of `text` (tokenize()). null for the word being taught,
   * words inside a phrase, and words with no known meaning.
   */
  words?: (TokenGloss | null)[]
  /** Multi-word phrases as [first token, end token (exclusive), meaning]. */
  phrases?: [number, number, string][]
}

export interface WordForms {
  masculine?: string
  feminine?: string
  neuter?: string
  plural?: string
  masculinePlural?: string
  femininePlural?: string
  genitive?: string
  comparative?: string
  superlative?: string
}

export interface Word {
  id: string
  lemma: string
  pos: Pos
  rank: number
  /** Never empty: entries without a meaning are dropped by the data pipeline. */
  glosses: [string, ...string[]]
  ipa?: string
  /** Human recording of the lemma (Lingua Libre / Wiktionary), when one exists. */
  audio?: string
  /** Human recordings of inflected forms (form → URL), for those that have one. */
  formAudio?: Record<string, string>
  gender?: "m" | "f" | "n" | "mf"
  forms?: WordForms
  conjugation?: Conjugation
  nonFinite?: { gerund?: string; participle?: string }
  /** Past tense by gender and number rather than person (Russian делал, делала, делало, делали). */
  past?: Partial<Record<"m" | "f" | "n" | "p", string>>
  /** Russian verbs come in pairs: делать (imperfective) ↔ сделать (perfective). */
  aspect?: "imperfective" | "perfective"
  aspectPartner?: string
  examples: Example[]
}

/** One row of public/data/<lang>/index.json. */
export interface IndexEntry {
  id: string
  lemma: string
  pos: Pos
  rank: number
  gloss: string
}

export interface Settings {
  sessionSize: number
  /** Words per page on the word list. */
  pageSize: number
  voiceURI?: string
  rate: number
  /** Quiz sound effects. */
  sound: boolean
}

export interface WordProgress {
  learnedAt: string
  /** Last time the word appeared in a finished lesson or review. */
  reviewedAt?: string
  correct: number
  wrong: number
}

export interface Progress {
  version: 1
  settings: Settings
  learned: Record<string, WordProgress>
  /** Words the learner chose to skip (id → when). Never offered as new words; can be un-skipped. */
  skipped: Record<string, string>
  history: { date: string; words: string[]; score: number; total: number; kind?: "lesson" | "review" }[]
  streak: number
  /** Points earned in quizzes, all time. */
  xp: number
  lastDay: string | null
}
