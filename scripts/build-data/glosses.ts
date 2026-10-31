// Word-by-word meanings for example sentences, so learners see what every other word in the sentence means.
import type { Example, TokenGloss } from "../../src/lib/types"
import { tokenize } from "../../src/lib/words"

/** Dictionary gloss → a few words that fit under a word: "to have; to possess" → "to have". */
export function shortGloss(gloss: string): string {
  let s = gloss
    .replace(/;.*/, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim()
  if (s.length > 22 && s.includes(",")) s = s.replace(/,.*/, "").trim()
  if (s.length > 24) s = s.slice(0, 24).replace(/\s+\S*$/, "") + "…"
  return s
}

// Wiktionary often explains function words instead of translating them ("Used as an emphatic pronoun…").
const DEFINITIONAL =
  /^(used|response|see|a reflexive|the name|substitutes|first-person|second-person|second person|third-person|indicates|expresses|denotes|refers)\b/i

/** First gloss that translates rather than explains, if any. */
export function translatingGloss(glosses: string[]): string | undefined {
  return glosses.find((g) => !DEFINITIONAL.test(g))
}

const MAX_PHRASE = 4

/** Every 2–4 word run in the sentences, to look up as multi-word phrases. */
export function phraseCandidates(texts: string[]): Set<string> {
  const out = new Set<string>()
  for (const text of texts) {
    const t = tokenize(text)
    for (let i = 0; i < t.length; i++)
      for (let n = 2; n <= MAX_PHRASE && i + n <= t.length; n++) out.add(t.slice(i, i + n).join(" "))
  }
  return out
}

/**
 * Glosses one sentence. Longest known phrase wins (por favor → "please"), but never one containing the word being
 * taught, which keeps its own highlight.
 */
export function glossExample(
  example: Example,
  isTarget: (token: string) => boolean,
  lookup: (token: string) => TokenGloss | undefined,
  phrases: Map<string, string>
): Example {
  const tokens = tokenize(example.text)
  const spans: [number, number, string][] = []
  for (let i = 0; i < tokens.length;) {
    let matched = 0
    for (let n = Math.min(MAX_PHRASE, tokens.length - i); n >= 2; n--) {
      const run = tokens.slice(i, i + n)
      const gloss = phrases.get(run.join(" "))
      if (gloss && !run.some(isTarget)) {
        spans.push([i, i + n, gloss])
        matched = n
        break
      }
    }
    i += matched || 1
  }
  const inPhrase = (i: number) => spans.some(([a, b]) => i >= a && i < b)
  const words = tokens.map((t, i) => (isTarget(t) || inPhrase(i) ? null : (lookup(t) ?? null)))
  return { ...example, words, ...(spans.length && { phrases: spans }) }
}
