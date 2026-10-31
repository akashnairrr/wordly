import type { Pos } from "../../src/lib/types";

/**
 * Hand fixes for frequent spellings the heuristics resolve wrongly.
 * - `{ pos }`: use this part of speech's entry (la → article, not the musical note). `glosses` replaces
 *   Wiktionary's meaning, for words it only lists as "form of …" (mi = "apocopic form of mío").
 * - `{ lemma }`: count the spelling as a form of this lemma (son → ser, not "tone").
 * Add entries when spot-checking the generated top words.
 */
export type Override = { pos: Pos; glosses?: string[] } | { lemma: string };

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
    creo: { lemma: "creer" },
    cree: { lemma: "creer" },
    crees: { lemma: "creer" },
  },
};
