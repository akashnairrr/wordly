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
  /**
   * Definite articles by gender, used for noun display and gender quizzes (German adds neuter). Languages without
   * articles (Russian) leave this out; the gender quiz then asks for the gender by name.
   */
  articles?: { m: string; f: string; n?: string }
  /** Pronoun rows for a past tense that goes by gender rather than person (Russian он / она / оно / они). */
  pastLabels?: Record<"m" | "f" | "n" | "p", string>
  /** Nouns are written with a capital (German), so a capital mid-sentence isn't a sign of a name (data pipeline). */
  capitalisedNouns?: boolean
  personLabels: Record<Person, string>
  /** Tenses shown in the conjugation table, in display order. */
  tenses: { mood: Mood; tense: Tense; label: string }[]
}

export const LANGUAGES: Record<string, Language> = {
  ru: {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    country: "RU",
    ttsLocales: ["ru-RU", "ru"],
    sample: "Привет, как дела? Я учу русский.",
    greeting: "Привет!",
    // Russian usually keeps the subject pronoun (Я хочу есть), unlike Spanish.
    droppedPronouns: [],
    // No articles: the gender quiz asks masculine / feminine / neuter.
    pastLabels: { m: "он", f: "она", n: "оно", p: "они" },
    personLabels: {
      "1s": "я",
      "2s": "ты",
      "3s": "он / она / оно",
      "1p": "мы",
      "2p": "вы",
      "3p": "они",
    },
    // Imperfective verbs have a present and a compound future (буду делать); perfective verbs only a future
    // (сделаю). The past, by gender, is added by the conjugation table.
    tenses: [
      { mood: "indicative", tense: "present", label: "Present" },
      { mood: "indicative", tense: "future", label: "Future" },
      { mood: "imperative", tense: "affirmative", label: "Imperative" },
    ],
  },
  de: {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    country: "DE",
    ttsLocales: ["de-DE", "de-AT", "de-CH", "de"],
    sample: "Hallo, wie geht's? Ich lerne Deutsch.",
    greeting: "Hallo!",
    // German always says the subject: "Ich habe Hunger", never just "Habe Hunger".
    droppedPronouns: [],
    articles: { m: "der", f: "die", n: "das" },
    capitalisedNouns: true,
    personLabels: {
      "1s": "ich",
      "2s": "du",
      "3s": "er / sie / es",
      "1p": "wir",
      "2p": "ihr",
      "3p": "sie / Sie",
    },
    tenses: [
      { mood: "indicative", tense: "present", label: "Present" },
      // The everyday spoken past (ich habe gemacht).
      { mood: "indicative", tense: "perfect", label: "Perfect" },
      // Written past; in speech mostly sein, haben and modal verbs (ich war, ich hatte).
      { mood: "indicative", tense: "preterite", label: "Simple past" },
      { mood: "indicative", tense: "future", label: "Future" },
      { mood: "subjunctive", tense: "conditional", label: "Conditional (würde)" },
      { mood: "subjunctive", tense: "imperfect", label: "Subjunctive II" },
      { mood: "imperative", tense: "affirmative", label: "Imperative" },
    ],
  },
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

/** Languages for pickers, by English name. */
export const LANGUAGE_LIST: Language[] = Object.values(LANGUAGES).sort((a, b) => a.name.localeCompare(b.name))

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
