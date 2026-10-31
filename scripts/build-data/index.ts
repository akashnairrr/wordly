// Builds public/data/<lang>/ from public datasets.
// Usage: pnpm data --lang es

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import type { IndexEntry, Word } from "../../src/lib/types";
import { download } from "./download";
import { allForms } from "../../src/lib/words";
import { bestEntry, mapPos, toWord } from "./normalize";
import { OVERRIDES } from "./overrides";
import { loadSentenceRecordings, loadWordRecordings } from "./recordings";
import { findExamples, loadSentences } from "./sentences";
import { MAX_EXAMPLES, SOURCES, TOP_N } from "./sources";
import { formOfTargets, isLemmaEntry, streamEntries, type RawEntry } from "./wiktionary";

const ROOT = join(import.meta.dirname, "../..");

async function main() {
  const { values } = parseArgs({ options: { lang: { type: "string", default: "es" } } });
  const lang = values.lang!;
  const sources = SOURCES[lang];
  if (!sources) throw new Error(`No sources configured for "${lang}" in scripts/build-data/sources.ts`);

  const files = await download(lang, sources, join(ROOT, "data-raw"));
  const freq = readFileSync(files.frequency, "utf8")
    .split("\n")
    .map((l) => l.split(" ")[0]?.trim())
    .filter(Boolean);
  const freqSet = new Set(freq);

  const overrides = OVERRIDES[lang] ?? {};
  const posOverride = (word: string) => {
    const o = overrides[word];
    return o && "pos" in o ? o : undefined;
  };

  // Pass 1: every Wiktionary entry spelled like a frequent word.
  // All teachable entries per spelling; bestEntry() picks one (de = preposition, not the letter).
  const lemmas = new Map<string, RawEntry[]>();
  const formOf = new Map<string, string[]>();
  const addLemma = (e: RawEntry) => {
    const pos = mapPos(e.pos);
    // An override with its own glosses may target an entry Wiktionary only lists as a form (mi → mío).
    const forcedByOverride = !!pos && posOverride(e.word)?.pos === pos && !!posOverride(e.word)?.glosses;
    if (pos && (isLemmaEntry(e) || forcedByOverride)) lemmas.set(e.word, [...(lemmas.get(e.word) ?? []), e]);
  };
  console.log("Reading Wiktionary (pass 1)…");
  await streamEntries(files.wiktionary, (w) => freqSet.has(w), (e) => {
    addLemma(e);
    const targets = formOfTargets(e);
    if (targets.length) formOf.set(e.word, [...(formOf.get(e.word) ?? []), ...targets]);
  });

  // Pass 2: lemmas of inflected forms whose dictionary form isn't itself in the frequency list.
  const overrideLemmas = Object.values(overrides).flatMap((o) => ("lemma" in o ? [o.lemma] : []));
  const missing = new Set([...[...formOf.values()].flat(), ...overrideLemmas].filter((t) => !lemmas.has(t)));
  console.log(`Reading Wiktionary (pass 2, ${missing.size} lemmas)…`);
  await streamEntries(files.wiktionary, (w) => missing.has(w), addLemma);

  // Walk spoken frequency order; each surface form counts towards its lemma (tengo → tener).
  // A spelling that is itself a lemma wins (casa = house, not a form of casar) unless overrides.ts says otherwise.
  const picked: Omit<Word, "examples">[] = [];
  const seen = new Set<string>();
  for (const form of freq) {
    if (picked.length >= TOP_N) break;
    const o = overrides[form];
    const lemma = o && "lemma" in o ? o.lemma : lemmas.has(form) ? form : formOf.get(form)?.find((t) => lemmas.has(t));
    if (!lemma || seen.has(lemma) || !lemmas.has(lemma)) continue;
    seen.add(lemma);
    const candidates = lemmas.get(lemma)!;
    // Part-of-speech overrides are keyed by lemma, so they also apply when reached via a form (puede → poder).
    const po = posOverride(lemma);
    const forced = po && candidates.find((e) => mapPos(e.pos) === po.pos);
    if (po && !forced) console.warn(`Override ${lemma} → ${po.pos}: no such entry`);
    const entry = forced ?? bestEntry(candidates);
    const w = entry && toWord(entry, picked.length + 1, po?.glosses);
    if (w) picked.push(w);
  }

  console.log("Loading human recordings…");
  const wordAudio = await loadWordRecordings(sources.lingualibre, files.wordAudioIndex);
  const sentenceAudio = loadSentenceRecordings(files.sentenceAudio);

  console.log("Matching example sentences…");
  const sentences = loadSentences(files.sentences, sources.sentences.file, sentenceAudio);
  const words: Word[] = picked.map((w) => {
    // Wiktionary's own recording (curated) first, then Lingua Libre.
    const audio = w.audio ?? wordAudio.get(w.lemma.toLowerCase());
    const forms = allForms(w).slice(1);
    const formAudio = Object.fromEntries(forms.flatMap((f) => (wordAudio.has(f.toLowerCase()) ? [[f, wordAudio.get(f.toLowerCase())!]] : [])));
    return {
      ...w,
      ...(audio && { audio }),
      ...(Object.keys(formAudio).length && { formAudio }),
      examples: findExamples(sentences, allForms(w), MAX_EXAMPLES),
    };
  });

  const out = join(ROOT, "public/data", lang);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, "words"), { recursive: true });
  const index: IndexEntry[] = words.map((w) => ({ id: w.id, lemma: w.lemma, pos: w.pos, rank: w.rank, gloss: w.glosses[0] }));
  writeFileSync(join(out, "index.json"), JSON.stringify(index));
  for (const w of words) writeFileSync(join(out, "words", `${w.id}.json`), JSON.stringify(w));

  const byPos = Object.groupBy(words, (w) => w.pos);
  console.log(`Wrote ${words.length} words to ${out}`);
  console.log(Object.fromEntries(Object.entries(byPos).map(([k, v]) => [k, v!.length])));
  console.log(`Without examples: ${words.filter((w) => !w.examples.length).length}`);
  const examples = words.flatMap((w) => w.examples);
  const forms = words.flatMap((w) => allForms(w).slice(1));
  const formsWithAudio = words.reduce((n, w) => n + Object.keys(w.formAudio ?? {}).length, 0);
  console.log(
    `Human audio: ${words.filter((w) => w.audio).length}/${words.length} words, ${formsWithAudio}/${forms.length} forms, ` +
      `${examples.filter((e) => e.audio).length}/${examples.length} sentences`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
