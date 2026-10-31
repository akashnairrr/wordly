import type { Mood, Person, Pos, Tense } from "./types"

export interface Language {
  code: string
  name: string
  nativeName: string
  /** ISO 3166 country whose flag represents the language (see components/flag.tsx). */
  country: string
  /** BCP-47 locales accepted for text-to-speech, preferred first. */
  ttsLocales: [string, ...string[]]
  /** Short phrase for testing the selected voice. */
  sample: string
  /** Shown on the home screen. */
  greeting: string
  /** Subject pronouns native speakers usually leave out; sentences spelling them out sound stiff (data pipeline). */
  droppedPronouns: string[]
  /** Definite articles by gender, used for noun display and gender quizzes. */
  articles: { m: string; f: string }
  personLabels: Record<Person, string>
  /** Tenses shown in the conjugation table, in display order. */
  tenses: { mood: Mood; tense: Tense; label: string }[]
}

export const LANGUAGES: Record<string, Language> = {
  es: {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    country: "ES",
    ttsLocales: ["es-ES", "es-MX", "es-US", "es"],
    sample: "Hola, ¿qué tal? Estoy aprendiendo español.",
    greeting: "¡Hola!",
    droppedPronouns: ["yo", "tú", "usted", "ustedes", "nosotros", "nosotras", "vosotros", "vosotras"],
    articles: { m: "el", f: "la" },
    personLabels: {
      "1s": "yo",
      "2s": "tú",
      "3s": "él / ella / usted",
      "1p": "nosotros",
      "2p": "vosotros",
      "3p": "ellos / ustedes",
    },
    tenses: [
      { mood: "indicative", tense: "present", label: "Present" },
      { mood: "indicative", tense: "preterite", label: "Preterite" },
      { mood: "indicative", tense: "imperfect", label: "Imperfect" },
      { mood: "indicative", tense: "future", label: "Future" },
      { mood: "indicative", tense: "conditional", label: "Conditional" },
      { mood: "subjunctive", tense: "present", label: "Present subjunctive" },
      { mood: "subjunctive", tense: "imperfect", label: "Imperfect subjunctive" },
      { mood: "imperative", tense: "affirmative", label: "Imperative" },
      { mood: "imperative", tense: "negative", label: "Negative imperative" },
    ],
  },
}

export function getLanguage(code: string): Language {
  const lang = LANGUAGES[code]
  if (!lang) throw new Error(`Unknown language: ${code}`)
  return lang
}

export const POS_LABELS: Record<Pos, string> = {
  noun: "Noun",
  verb: "Verb",
  adj: "Adjective",
  adv: "Adverb",
  pron: "Pronoun",
  prep: "Preposition",
  conj: "Conjunction",
  det: "Determiner",
  intj: "Interjection",
  num: "Number",
  other: "Other",
}
