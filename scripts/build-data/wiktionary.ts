import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { createGunzip } from "node:zlib";

/** The subset of a kaikki.org entry we use. */
export interface RawEntry {
  word: string;
  pos: string;
  head_templates?: { expansion?: string }[];
  forms?: { form: string; tags?: string[]; source?: string }[];
  sounds?: { ipa?: string; mp3_url?: string }[];
  senses?: { glosses?: string[]; tags?: string[]; form_of?: { word: string }[]; alt_of?: unknown[] }[];
}

const NON_LEMMA_TAGS = new Set(["form-of", "alt-of", "misspelling", "abbreviation", "initialism", "acronym"]);

export function isLemmaSense(s: NonNullable<RawEntry["senses"]>[number]) {
  return !s.form_of && !s.alt_of && !(s.tags ?? []).some((t) => NON_LEMMA_TAGS.has(t)) && !!s.glosses?.length;
}

export function isLemmaEntry(e: RawEntry) {
  return (e.senses ?? []).some(isLemmaSense);
}

/** Lemmas this entry is an inflected form of (e.g. tengo → tener). */
export function formOfTargets(e: RawEntry): string[] {
  return [...new Set((e.senses ?? []).flatMap((s) => (s.form_of ?? []).map((f) => f.word)))];
}

/** Streams a gzipped kaikki JSONL dump, calling `onEntry` for entries whose word passes `keep`. */
export async function streamEntries(path: string, keep: (word: string) => boolean, onEntry: (e: RawEntry) => void) {
  const lines = createInterface({ input: createReadStream(path).pipe(createGunzip()), crlfDelay: Infinity });
  for await (const line of lines) {
    // Cheap pre-filter before paying for JSON.parse on ~1 GB of text. Nested objects (form_of, derived…) also
    // have "word" keys and may come first, so parse if *any* of them matches, then check the real one.
    const words = line.matchAll(/"word": ?"((?:[^"\\]|\\.)*)"/g);
    if (!words.some((m) => keep(JSON.parse(`"${m[1]}"`)))) continue;
    const e = JSON.parse(line) as RawEntry;
    if (keep(e.word)) onEntry(e);
  }
}
