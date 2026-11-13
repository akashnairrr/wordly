// Example sentences and meanings checked by Claude (scripts/vet-examples.ts), committed so pipeline reruns reuse them.

import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { Example, TokenGloss } from "../../src/lib/types"
import { tokenize } from "../../src/lib/words"

export interface VettedExample {
  text: string
  en: string
  /** Better meanings for words of the sentence, by spelling as written (rufe → "call (anrufen)"). */
  fixes?: { token: string; g: string; l?: string }[]
  /** Set phrases glossed wrongly in this sentence ("Quién vive"), to gloss word by word instead. */
  dropPhrases?: string[]
}

export interface VettedWord {
  /** Short learner-facing meanings of the word, most useful first. */
  meanings: string[]
  /** Final example sentences, easiest first: Tatoeba candidates (same text) or written for the course. */
  examples: VettedExample[]
}

/** Lemma → vetted entry. */
export type Vetted = Record<string, VettedWord>

export const vettedPath = (root: string, lang: string) => join(root, "scripts/build-data/vetted", `${lang}.json`)

export function loadVetted(root: string, lang: string): Vetted {
  const path = vettedPath(root, lang)
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as Vetted) : {}
}

/**
 * Builds the final example from a vetted one: the matching candidate keeps its recording, and `gloss` (glossExample,
 * minus the dropped phrases) supplies word meanings before the fixes are applied.
 */
export function applyVetted(
  v: VettedExample,
  candidates: Example[],
  gloss: (e: Example, dropPhrases: Set<string>) => Example,
  isTarget: (token: string) => boolean
): Example {
  const candidate = candidates.find((c) => c.text === v.text)
  const base: Example = { text: v.text, en: v.en, ...(candidate?.audio && { audio: candidate.audio }) }
  const e = gloss(base, new Set(v.dropPhrases?.map((p) => tokenize(p).join(" "))))
  if (!v.fixes?.length || !e.words) return e
  const tokens = tokenize(e.text)
  const words = [...e.words]
  for (const f of v.fixes) {
    const i = tokens.indexOf(f.token.toLowerCase())
    // The taught word stays unglossed (it's highlighted); phrase members are covered by the phrase.
    if (i < 0 || isTarget(tokens[i]!) || e.phrases?.some(([a, b]) => i >= a && i < b)) continue
    words[i] = { g: f.g, ...(f.l && { l: f.l }) } satisfies TokenGloss
  }
  return { ...e, words }
}
