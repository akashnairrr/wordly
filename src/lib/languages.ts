import type { Mood, Person, Pos, Tense, Word } from "./types"

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
  /**
   * The article as it's written before this noun, when that depends on how the noun starts (Italian l'albero,
   * lo zio). Without it, the article and a space.
   */
  articleBefore?: (lemma: string, gender: "m" | "f" | "n") => string
  /** Pronoun rows for a past tense that goes by gender rather than person (Russian он / она / оно / они). */
  pastLabels?: Record<"m" | "f" | "n" | "p", string>
  /** Wiktionary marks stress on forms (Italian fàccio for faccio); the data pipeline strips non-final accents. */
  formsMarkStress?: boolean
  /**
   * Build the present perfect from the auxiliary's present plus the past participle (Italian ho fatto, sono andati),
   * which Wiktionary's tables leave out. Verbs with the `agreeing` auxiliary make the participle plural in the plural.
   */
  compoundPerfect?: {
    auxiliaries: Record<string, Record<Person, string>>
    agreeing: string
    plural: (participle: string) => string
  }
  /**
   * Teach one country's usage: Wiktionary senses, forms and pronunciations tagged only for a `drop` country are left
   * out unless also tagged `keep` (data pipeline).
   */
  region?: { keep: string; drop: string[] }
  /** Nouns are written with a capital (German), so a capital mid-sentence isn't a sign of a name (data pipeline). */
  capitalisedNouns?: boolean
  personLabels: Record<Person, string>
  /** Tenses shown in the conjugation table, in display order. */
  tenses: { mood: Mood; tense: Tense; label: string }[]
}

export const LANGUAGES: Record<string, Language> = {
  it: {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    country: "IT",
    ttsLocales: ["it-IT", "it-CH", "it"],
    sample: "Ciao, come stai? Sto imparando l'italiano.",
    greeting: "Ciao!",
    droppedPronouns: ["io", "tu", "lui", "lei", "noi", "voi", "loro"],
    articles: { m: "il", f: "la" },
    articleBefore: (lemma, gender) => italianArticle(lemma, gender),
    formsMarkStress: true,
    compoundPerfect: {
      auxiliaries: {
        avere: { "1s": "ho", "2s": "hai", "3s": "ha", "1p": "abbiamo", "2p": "avete", "3p": "hanno" },
        essere: { "1s": "sono", "2s": "sei", "3s": "è", "1p": "siamo", "2p": "siete", "3p": "sono" },
      },
      agreeing: "essere",
      plural: (participle) => participle.replace(/o$/, "i"),
    },
    personLabels: { "1s": "io", "2s": "tu", "3s": "lui / lei", "1p": "noi", "2p": "voi", "3p": "loro" },
    tenses: [
      { mood: "indicative", tense: "present", label: "Present" },
      // The everyday spoken past (ho fatto).
      { mood: "indicative", tense: "perfect", label: "Past (passato prossimo)" },
      { mood: "indicative", tense: "imperfect", label: "Imperfect" },
      { mood: "indicative", tense: "future", label: "Future" },
      { mood: "indicative", tense: "conditional", label: "Conditional" },
      { mood: "subjunctive", tense: "present", label: "Present subjunctive" },
      { mood: "subjunctive", tense: "imperfect", label: "Imperfect subjunctive" },
      // Mostly written and southern speech (feci).
      { mood: "indicative", tense: "preterite", label: "Simple past (passato remoto)" },
      { mood: "imperative", tense: "affirmative", label: "Imperative" },
      { mood: "imperative", tense: "negative", label: "Negative imperative" },
    ],
  },
  pt: {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    // European Portuguese: the word list comes from Portuguese subtitles.
    country: "PT",
    // Portugal voices only: Brazilian ones would otherwise win on quality.
    ttsLocales: ["pt-PT"],
    sample: "Olá, tudo bem? Estou a aprender português.",
    greeting: "Olá!",
    // European Portuguese usually leaves the subject out (Acho que sim, Queres vir?).
    droppedPronouns: ["eu", "tu", "você", "nós"],
    region: {
      keep: "Portugal",
      drop: ["Brazil", "South-Brazil", "Northeast-Brazil", "Rio-de-Janeiro", "São-Paulo", "Caipira", "Minas-Gerais"],
    },
    articles: { m: "o", f: "a" },
    personLabels: {
      "1s": "eu",
      "2s": "tu",
      "3s": "ele / ela / você",
      "1p": "nós",
      "2p": "vós",
      "3p": "eles / elas / vocês",
    },
    tenses: [
      { mood: "indicative", tense: "present", label: "Present" },
      // The everyday past (eu fiz).
      { mood: "indicative", tense: "preterite", label: "Past (pretérito perfeito)" },
      { mood: "indicative", tense: "imperfect", label: "Imperfect" },
      { mood: "indicative", tense: "future", label: "Future" },
      { mood: "indicative", tense: "conditional", label: "Conditional" },
      { mood: "subjunctive", tense: "present", label: "Present subjunctive" },
      { mood: "subjunctive", tense: "imperfect", label: "Imperfect subjunctive" },
      { mood: "imperative", tense: "affirmative", label: "Imperative" },
      { mood: "imperative", tense: "negative", label: "Negative imperative" },
    ],
  },
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

/** "el ", "der ", "l'" or "lo ": the article as written in front of this noun, or "" when there is none. */
export function articlePrefix(language: Language, lemma: string, gender: Word["gender"]): string {
  if (!gender || gender === "mf" || !language.articles?.[gender]) return ""
  return language.articleBefore?.(lemma, gender) ?? `${language.articles[gender]} `
}

// Italian: l' before a vowel (or h), lo before s + consonant, z, gn, ps, pn, x, y (l'albero, lo zio, il libro).
const VOWEL = /^[aeiouàèéìíòóùúh]/i
function italianArticle(lemma: string, gender: "m" | "f" | "n"): string {
  if (VOWEL.test(lemma)) return "l'"
  if (gender === "f") return "la "
  return /^(s[^aeiouàèéìòù]|z|gn|ps|pn|x|y)/i.test(lemma) ? "lo " : "il "
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
