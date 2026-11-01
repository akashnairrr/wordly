import { createReadStream } from "node:fs"
import { createInterface } from "node:readline"
import { createGunzip } from "node:zlib"

/** The subset of a kaikki.org entry we use. */
export interface RawEntry {
  word: string
  pos: string
  head_templates?: { expansion?: string }[]
  forms?: { form: string; tags?: string[]; source?: string }[]
  sounds?: { ipa?: string; mp3_url?: string; tags?: string[] }[]
  senses?: {
    glosses?: string[]
    tags?: string[]
    form_of?: { word: string }[]
    alt_of?: unknown[]
    links?: string[][]
    /** Set by streamEntries: this sense's meanings are those of another word (camião → caminhão). */
    see?: string
  }[]
}

// "pre-reform spelling (used until 1943 in Brazil and 1990 in Portugal) of ação", "Brazilian Portuguese standard
// spelling of demónio": a form of the spelling taught.
const OLD_SPELLING = /^(?:pre-reform|Brazilian Portuguese standard) (?:spelling|form)\b.*?\bof (\S+?)[;,]?(?: |$)/
// "European Portuguese standard form of caminhão": a current word whose meanings Wiktionary keeps on the other entry.
const SEE_OTHER = /^European Portuguese standard (?:spelling|form) of (\S+?)[;,]?(?: |$)/

export function pointers(e: RawEntry): RawEntry {
  if (!e.senses?.some((s) => OLD_SPELLING.test(s.glosses?.[0] ?? "") || SEE_OTHER.test(s.glosses?.[0] ?? ""))) return e
  const senses = e.senses.map((s) => {
    const g = s.glosses?.[0] ?? ""
    const target = s.links?.[0]?.[0] ?? (OLD_SPELLING.exec(g) ?? SEE_OTHER.exec(g))?.[1]
    if (!target) return s
    if (OLD_SPELLING.test(g)) return { ...s, form_of: [{ word: target }] }
    return SEE_OTHER.test(g) ? { ...s, see: target } : s
  })
  return { ...e, senses }
}

const NON_LEMMA_TAGS = new Set(["form-of", "alt-of", "misspelling", "abbreviation", "initialism", "acronym"])

export function isLemmaSense(s: NonNullable<RawEntry["senses"]>[number]) {
  return !s.form_of && !s.alt_of && !(s.tags ?? []).some((t) => NON_LEMMA_TAGS.has(t)) && !!s.glosses?.length
}

export function isLemmaEntry(e: RawEntry) {
  return (e.senses ?? []).some(isLemmaSense)
}

/** Lemmas this entry is an inflected form of (e.g. tengo → tener). */
export function formOfTargets(e: RawEntry): string[] {
  return [...new Set((e.senses ?? []).flatMap((s) => (s.form_of ?? []).map((f) => f.word)))]
}

/** Which country's usage to teach when Wiktionary tags senses, forms and pronunciations by country. */
export interface Region {
  keep: string
  drop: string[]
}

/** Removes senses, forms and pronunciations tagged only for another country (Brazilian ônibus, IPA, spellings). */
export function forRegion(e: RawEntry, region: Region): RawEntry {
  const ours = (x: { tags?: string[] }) => !x.tags?.some((t) => region.drop.includes(t)) || x.tags.includes(region.keep)
  return { ...e, senses: e.senses?.filter(ours), forms: e.forms?.filter(ours), sounds: e.sounds?.filter(ours) }
}

/** Streams a gzipped kaikki JSONL dump, calling `onEntry` for entries whose word passes `keep`. */
export async function streamEntries(
  path: string,
  keep: (word: string) => boolean,
  onEntry: (e: RawEntry) => void,
  region?: Region
) {
  const lines = createInterface({ input: createReadStream(path).pipe(createGunzip()), crlfDelay: Infinity })
  for await (const line of lines) {
    // Cheap pre-filter before paying for JSON.parse on ~1 GB of text. Nested objects (form_of, derived…) also
    // have "word" keys and may come first, so parse if *any* of them matches, then check the real one.
    const words = line.matchAll(/"word": ?"((?:[^"\\]|\\.)*)"/g)
    if (!words.some((m) => keep(JSON.parse(`"${m[1]}"`)))) continue
    const e = JSON.parse(line) as RawEntry
    if (keep(e.word)) onEntry(pointers(region ? forRegion(e, region) : e))
  }
}
