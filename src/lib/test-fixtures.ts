// Shared fixtures for the src/lib tests.
import { getLanguage } from "./languages"
import type { IndexEntry, Word } from "./types"

export const es = getLanguage("es")

// Deterministic RNG so failures are reproducible.
export function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}

export const tener: Word = {
  id: "tener",
  lemma: "tener",
  pos: "verb",
  rank: 1,
  glosses: ["to have"],
  conjugation: { indicative: { present: { "1s": "tengo", "2s": "tienes", "3s": "tiene", "1p": "tenemos" } } },
  examples: [{ text: "Tengo un perro.", en: "I have a dog." }],
}
export const casa: Word = {
  id: "casa",
  lemma: "casa",
  pos: "noun",
  rank: 2,
  glosses: ["house"],
  gender: "f",
  forms: { plural: "casas" },
  examples: [],
}
export const bueno: Word = {
  id: "bueno",
  lemma: "bueno",
  pos: "adj",
  rank: 3,
  glosses: ["good"],
  forms: { feminine: "buena", masculinePlural: "buenos", femininePlural: "buenas" },
  examples: [],
}
export const pool: IndexEntry[] = [
  ...[tener, casa, bueno].map((w) => ({ id: w.id, lemma: w.lemma, pos: w.pos, rank: w.rank, gloss: w.glosses[0] })),
  { id: "ser", lemma: "ser", pos: "verb", rank: 4, gloss: "to be" },
  { id: "ir", lemma: "ir", pos: "verb", rank: 5, gloss: "to go" },
  { id: "hacer", lemma: "hacer", pos: "verb", rank: 6, gloss: "to do" },
  { id: "perro", lemma: "perro", pos: "noun", rank: 7, gloss: "dog" },
]
