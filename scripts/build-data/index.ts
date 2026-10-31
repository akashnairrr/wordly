// Builds public/data/<lang>/ from public datasets.
// Usage: pnpm data --lang es

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { LANGUAGES } from "../../src/lib/languages";
import type { IndexEntry, TokenGloss, Word } from "../../src/lib/types";
import { download } from "./download";
import { allForms } from "../../src/lib/words";
import { glossExample, phraseCandidates, shortGloss, translatingGloss } from "./glosses";
import { bestEntry, mapPos, toWord, usableGlosses } from "./normalize";
import { OVERRIDES, SHORT_GLOSSES } from "./overrides";
import { loadSentenceRecordings, loadWordRecordings } from "./recordings";
import { findExamples, loadSentences } from "./sentences";
import { MAX_EXAMPLES, SOURCES, TOP_N } from "./sources";
import { formOfTargets, isLemmaEntry, streamEntries, type RawEntry } from "./wiktionary";

const ROOT = join(import.meta.dirname, "../..");

// Plain-object dictionaries: "constructor" is a Spanish word too.
const own = <T>(dict: Record<string, T>, key: string) => (Object.hasOwn(dict, key) ? dict[key] : undefined);

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
    const o = own(overrides, word);
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
  await streamEntries(
    files.wiktionary,
    (w) => freqSet.has(w),
    (e) => {
      addLemma(e);
      const targets = formOfTargets(e);
      if (targets.length) formOf.set(e.word, [...(formOf.get(e.word) ?? []), ...targets]);
    },
  );

  // Pass 2: lemmas of inflected forms whose dictionary form isn't itself in the frequency list.
  const overrideLemmas = Object.values(overrides).flatMap((o) => ("lemma" in o ? [o.lemma] : []));
  const missing = new Set([...[...formOf.values()].flat(), ...overrideLemmas].filter((t) => !lemmas.has(t)));
  console.log(`Reading Wiktionary (pass 2, ${missing.size} lemmas)…`);
  await streamEntries(files.wiktionary, (w) => missing.has(w), addLemma);

  // A surface form's lemma (tengo → tener). A spelling that is itself a lemma wins (casa = house, not a form of
  // casar) unless overrides.ts says otherwise.
  const resolve = (form: string) => {
    const o = own(overrides, form);
    const lemma = o && "lemma" in o ? o.lemma : lemmas.has(form) ? form : formOf.get(form)?.find((t) => lemmas.has(t));
    return lemma && lemmas.has(lemma) ? lemma : undefined;
  };
  // The entry used for a lemma. Part-of-speech overrides are keyed by lemma, so they also apply when reached via a
  // form (puede → poder).
  const entryFor = (lemma: string) => {
    const candidates = lemmas.get(lemma)!;
    const po = posOverride(lemma);
    const forced = po && candidates.find((e) => mapPos(e.pos) === po.pos);
    if (po && !forced) console.warn(`Override ${lemma} → ${po.pos}: no such entry`);
    return { entry: forced ?? bestEntry(candidates), glosses: po?.glosses };
  };

  // Walk spoken frequency order; each surface form counts towards its lemma.
  const picked: Omit<Word, "examples">[] = [];
  const seen = new Set<string>();
  for (const form of freq) {
    if (picked.length >= TOP_N) break;
    const lemma = resolve(form);
    if (!lemma || seen.has(lemma)) continue;
    seen.add(lemma);
    const { entry, glosses } = entryFor(lemma);
    const w = entry && toWord(entry, picked.length + 1, glosses);
    if (w) picked.push(w);
  }

  console.log("Loading human recordings…");
  const wordAudio = await loadWordRecordings(sources.lingualibre, files.wordAudioIndex);
  const sentenceAudio = loadSentenceRecordings(files.sentenceAudio);

  // Short meaning of any word: shown under example sentences, and used to prefer literal translations.
  const pickedLemmas = new Set(picked.map((w) => w.lemma));
  const curated = SHORT_GLOSSES[lang] ?? {};
  // Like resolve(), but a spelling that's also a form of a top word means that word (dije → decir, not "locket").
  const glossLemma = (token: string) => {
    const o = own(overrides, token);
    if (o && "lemma" in o) return o.lemma;
    if (lemmas.has(token) && pickedLemmas.has(token)) return token;
    return formOf.get(token)?.find((t) => pickedLemmas.has(t)) ?? resolve(token);
  };
  const glossCache = new Map<string, TokenGloss | undefined>();
  const lookup = (token: string) => {
    if (!glossCache.has(token)) {
      const lemma = glossLemma(token);
      let g = own(curated, token);
      if (!g && lemma) {
        const { entry, glosses } = entryFor(lemma);
        const all = glosses ?? (entry ? usableGlosses(entry) : []);
        const best = translatingGloss(all) ?? all[0];
        g = best && shortGloss(best);
      }
      glossCache.set(token, g ? { g, ...(lemma && lemma !== token && { l: lemma }) } : undefined);
    }
    return glossCache.get(token);
  };

  console.log("Matching example sentences…");
  // Everyday-speech scoring: rank = spoken frequency; the top ~1,000 forms are the basics, ~3,000 common vocabulary.
  const rank = new Map(freq.map((f, i) => [f, i] as [string, number]));
  const droppedPronouns = new Set(LANGUAGES[lang]?.droppedPronouns ?? []);
  const everyday = { rank, commonCutoff: 3000, basicCutoff: 1000, droppedPronouns, gloss: (t: string) => lookup(t)?.g };
  const sentences = loadSentences(files.sentences, sources.sentences.file, sentenceAudio, everyday);
  // A spelling shared by several words (como: "like" and "I eat") is a weak match for all but its own lemma.
  const owners = new Map<string, number>();
  for (const w of picked) for (const f of allForms(w)) owners.set(f.toLowerCase(), (owners.get(f.toLowerCase()) ?? 0) + 1);
  const byFrequency = (forms: string[]) =>
    [...forms].sort((a, b) => (rank.get(a.toLowerCase()) ?? Infinity) - (rank.get(b.toLowerCase()) ?? Infinity));

  const withExamples: Word[] = picked.map((w) => {
    // Wiktionary's own recording (curated) first, then Lingua Libre.
    const audio = w.audio ?? wordAudio.get(w.lemma.toLowerCase());
    const forms = allForms(w).slice(1);
    const formAudio = Object.fromEntries(forms.flatMap((f) => (wordAudio.has(f.toLowerCase()) ? [[f, wordAudio.get(f.toLowerCase())!]] : [])));
    return {
      ...w,
      ...(audio && { audio }),
      ...(Object.keys(formAudio).length && { formAudio }),
      examples: findExamples(
        sentences,
        byFrequency(allForms(w)),
        MAX_EXAMPLES,
        new Set(
          allForms(w)
            .filter((f) => f !== w.lemma && (owners.get(f.toLowerCase()) ?? 0) > 1)
            .map((f) => f.toLowerCase()),
        ),
        droppedPronouns.has(w.lemma),
      ),
    };
  });

  // Pass 3: multi-word phrases that occur in the chosen sentences (por favor, de acuerdo, lo siento…).
  const ngrams = phraseCandidates(withExamples.flatMap((w) => w.examples.map((e) => e.text)));
  const top30 = new Set(freq.slice(0, 30));
  // Set phrases are usually interjections or adverbs (de verdad: "really", not the adjective "real").
  const PHRASE_POS = ["intj", "adv", "phrase"];
  const phraseEntries = new Map<string, RawEntry[]>();
  console.log("Reading Wiktionary (pass 3, phrases)…");
  await streamEntries(
    files.wiktionary,
    (w) => ngrams.has(w.toLowerCase()),
    (e) => {
      if (isLemmaEntry(e)) phraseEntries.set(e.word.toLowerCase(), [...(phraseEntries.get(e.word.toLowerCase()) ?? []), e]);
    },
  );
  const phrases = new Map<string, string>();
  for (const [key, entries] of phraseEntries) {
    const rankPos = (e: RawEntry) => PHRASE_POS.indexOf(e.pos) + 1 || PHRASE_POS.length + 1;
    const best = entries
      .sort((a, b) => rankPos(a) - rankPos(b))
      .map((e) => translatingGloss(usableGlosses(e)))
      .find(Boolean);
    if (!best) continue;
    const gloss = shortGloss(best);
    // Skip non-translations (a la → "a la") and runs of the commonest function words whose meaning is long
    // (a la → "in the style of"); short ones are real phrases (por qué → "why").
    if (gloss.toLowerCase() === key) continue;
    if (key.split(" ").every((t) => top30.has(t)) && gloss.split(",")[0].split(" ").length > 2) continue;
    phrases.set(key, gloss);
  }

  // Word-by-word meanings for every example sentence.
  const words: Word[] = withExamples.map((w) => {
    const own = new Set(allForms(w).map((f) => f.toLowerCase()));
    return { ...w, examples: w.examples.map((e) => glossExample(e, (t) => own.has(t), lookup, phrases)) };
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
  const tokens = examples.flatMap((e) => e.words ?? []);
  console.log(
    `Glosses: ${tokens.filter(Boolean).length}/${tokens.length} words, ${examples.filter((e) => e.phrases).length} sentences with phrases ` +
      `(${phrases.size} phrases found)`,
  );
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
