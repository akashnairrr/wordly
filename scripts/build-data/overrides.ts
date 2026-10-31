import type { Pos } from "../../src/lib/types"

/**
 * Hand fixes for frequent spellings the heuristics resolve wrongly.
 * - `{ pos }`: use this part of speech's entry (la → article, not the musical note). `glosses` replaces
 *   Wiktionary's meaning, for words it only lists as "form of …" (mi = "apocopic form of mío").
 * - `{ lemma }`: count the spelling as a form of this lemma (son → ser, not "tone").
 * Add entries when spot-checking the generated top words.
 */
export type Override = { pos: Pos; glosses?: string[] } | { lemma: string }

export const OVERRIDES: Record<string, Record<string, Override>> = {
  es: {
    la: { pos: "det", glosses: ["the (feminine singular)"] },
    los: { pos: "det", glosses: ["the (masculine plural)"] },
    las: { pos: "det", glosses: ["the (feminine plural)"] },
    una: { pos: "det", glosses: ["a, an (feminine)", "one (feminine)"] },
    mi: { pos: "det", glosses: ["my"] },
    tu: { pos: "det", glosses: ["your (informal)"] },
    su: { pos: "det", glosses: ["his, her, its, their", "your (formal)"] },
    mis: { pos: "det", glosses: ["my (plural)"] },
    tus: { pos: "det", glosses: ["your (informal, plural)"] },
    sus: { pos: "det", glosses: ["his, her, its, their (plural)", "your (formal, plural)"] },
    poder: { pos: "verb" },
    deber: { pos: "verb" },
    nada: { pos: "pron" },
    gracias: { pos: "intj" },
    son: { lemma: "ser" },
    era: { lemma: "ser" },
    fue: { lemma: "ser" },
    sé: { lemma: "saber" },
    sabes: { lemma: "saber" },
    puede: { lemma: "poder" },
    he: { lemma: "haber" },
    ha: { lemma: "haber" },
    vino: { lemma: "venir" },
    ve: { lemma: "ver" },
    vamos: { lemma: "ir" },
    hace: { lemma: "hacer" },
    haces: { lemma: "hacer" },
    haz: { lemma: "hacer" },
    dije: { lemma: "decir" },
    creo: { lemma: "creer" },
    cree: { lemma: "creer" },
    crees: { lemma: "creer" },
  },
}

/**
 * Short meanings for the commonest little words, shown under them in example sentences. Wiktionary describes these
 * grammatically ("first-person singular pronoun…"), which is no help mid-sentence.
 */
export const SHORT_GLOSSES: Record<string, Record<string, string>> = {
  es: {
    yo: "I",
    tú: "you",
    usted: "you (formal)",
    él: "he",
    ella: "she",
    nosotros: "we",
    vosotros: "you all",
    ustedes: "you all",
    ellos: "they",
    ellas: "they",
    me: "me",
    te: "you",
    se: "oneself",
    nos: "us",
    os: "you all",
    le: "him / her",
    les: "them",
    lo: "it / him",
    la: "the / her",
    los: "the / them",
    las: "the / them",
    el: "the",
    un: "a",
    una: "a",
    mí: "me",
    ti: "you",
    esto: "this",
    eso: "that",
    este: "this",
    esta: "this",
    ese: "that",
    esa: "that",
    que: "that",
    qué: "what",
    quién: "who",
    cómo: "how",
    dónde: "where",
    cuándo: "when",
    no: "no / not",
    sí: "yes",
    y: "and",
    o: "or",
    de: "of / from",
    a: "to",
    en: "in / on",
    con: "with",
    por: "for / by",
    para: "for",
    mi: "my",
    tu: "your",
    su: "his / her / your",
    del: "of the",
    al: "to the",
  },
}
