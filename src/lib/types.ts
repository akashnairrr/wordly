// Shared by the data pipeline (scripts/build-data) and the app.

export type Pos =
  | "noun"
  | "verb"
  | "adj"
  | "adv"
  | "pron"
  | "prep"
  | "conj"
  | "det"
  | "intj"
  | "num"
  | "other";

export type Mood = "indicative" | "subjunctive" | "imperative";
export type Tense =
  | "present"
  | "preterite"
  | "imperfect"
  | "future"
  | "conditional"
  | "affirmative"
  | "negative";
export type Person = "1s" | "2s" | "3s" | "1p" | "2p" | "3p";

export type Conjugation = Partial<Record<Mood, Partial<Record<Tense, Partial<Record<Person, string>>>>>>;

export interface Example {
  text: string;
  en: string;
  /** Human recording of `text` (Tatoeba), when one exists. */
  audio?: string;
}

export interface WordForms {
  masculine?: string;
  feminine?: string;
  plural?: string;
  masculinePlural?: string;
  femininePlural?: string;
}

export interface Word {
  id: string;
  lemma: string;
  pos: Pos;
  rank: number;
  glosses: string[];
  ipa?: string;
  /** Human recording of the lemma (Lingua Libre / Wiktionary), when one exists. */
  audio?: string;
  /** Human recordings of inflected forms (form → URL), for those that have one. */
  formAudio?: Record<string, string>;
  gender?: "m" | "f" | "mf";
  forms?: WordForms;
  conjugation?: Conjugation;
  nonFinite?: { gerund?: string; participle?: string };
  examples: Example[];
}

/** One row of public/data/<lang>/index.json. */
export interface IndexEntry {
  id: string;
  lemma: string;
  pos: Pos;
  rank: number;
  gloss: string;
}

export interface Settings {
  sessionSize: number;
  voiceURI?: string;
  rate: number;
}

export interface WordProgress {
  learnedAt: string;
  /** Last time the word appeared in a finished lesson or review. */
  reviewedAt?: string;
  correct: number;
  wrong: number;
}

export interface Progress {
  version: 1;
  settings: Settings;
  learned: Record<string, WordProgress>;
  /** Words the learner chose to skip (id → when). Never offered as new words; can be un-skipped. */
  skipped: Record<string, string>;
  history: { date: string; words: string[]; score: number; total: number; kind?: "lesson" | "review" }[];
  streak: number;
  lastDay: string | null;
}
