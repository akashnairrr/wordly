// Builds public/data/<lang>/ from public datasets.
// Usage: pnpm data --lang es

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { parseArgs } from "node:util"
import { LANGUAGES } from "../../src/lib/languages"
import type { Example, IndexEntry, TokenGloss, Word } from "../../src/lib/types"
import { UNITS } from "../../src/lib/units"
import { allForms, tokenize } from "../../src/lib/words"
import { download } from "./download"
import { glossExample, phraseCandidates, shortGloss, translatingGloss } from "./glosses"
import { CURRICULA } from "./curriculum"
import { bestEntry, mapPos, resolveIdClashes, toWord, usableGlosses } from "./normalize"
import { OVERRIDES, SHORT_GLOSSES } from "./overrides"
import { loadSentenceRecordings, loadWordRecordings } from "./recordings"
import { findExamples, loadSentences, mostlyCapitalised, readTargetSentences } from "./sentences"
import { CANDIDATES, MAX_EXAMPLES, SOURCES, TOP_N } from "./sources"
import { applyVetted, loadVetted } from "./vetted"
import { formOfTargets, isLemmaEntry, streamEntries, type RawEntry } from "./wiktionary"

const ROOT = join(import.meta.dirname, "../..")

// Plain-object dictionaries: "constructor" is a Spanish word too.
const own = <T>(dict: Record<string, T>, key: string) => (Object.hasOwn(dict, key) ? dict[key] : undefined)

async function main() {
  const { values } = parseArgs({ options: { lang: { type: "string", default: "es" } } })
  const lang = values.lang!
  // Languages that capitalise nouns are matched case-insensitively: the frequency list is lowercase, Wiktionary writes
  // Haus. Maps are keyed by this; the Word keeps Wiktionary's spelling. Elsewhere spelling must match exactly, so
  // capitalised entries (Spanish Jesús, OK) stay out.
  const region = LANGUAGES[lang]?.region
  const key = LANGUAGES[lang]?.capitalisedNouns ? (word: string) => word.toLowerCase() : (word: string) => word
  const sources = SOURCES[lang]
  if (!sources) throw new Error(`No sources configured for "${lang}" in scripts/build-data/sources.ts`)

  const files = await download(lang, sources, join(ROOT, "data-raw"))
  const freq = readFileSync(files.frequency, "utf8")
    .split("\n")
    .map((l) => l.replace(/ .*/, "").trim())
    .filter(Boolean)
  const freqSet = new Set(freq)

  const overrides = OVERRIDES[lang] ?? {}
  const posOverride = (word: string) => {
    const o = own(overrides, word)
    return o && "pos" in o ? o : undefined
  }

  // Pass 1: every Wiktionary entry spelled like a frequent word.
  // All teachable entries per spelling; bestEntry() picks one (de = preposition, not the letter).
  const lemmas = new Map<string, RawEntry[]>()
  const formOf = new Map<string, string[]>()
  const gerunds = new Set<string>()
  const seeOther = new Set<string>()
  const addLemma = (e: RawEntry) => {
    const pos = mapPos(e.pos)
    // An override with its own glosses may target an entry Wiktionary only lists as a form (mi → mío).
    const forced = posOverride(key(e.word))
    const forcedByOverride = !!pos && forced?.pos === pos && !!forced?.glosses
    if (pos && (isLemmaEntry(e) || forcedByOverride)) lemmas.set(key(e.word), [...(lemmas.get(key(e.word)) ?? []), e])
  }
  console.log("Reading Wiktionary (pass 1)…")
  await streamEntries(
    files.wiktionary,
    (w) => freqSet.has(key(w)),
    (e) => {
      addLemma(e)
      const targets = formOfTargets(e).map(key)
      if (targets.length) formOf.set(key(e.word), [...(formOf.get(key(e.word)) ?? []), ...targets])
      if (e.senses?.some((s) => s.form_of && s.tags?.includes("gerund"))) gerunds.add(key(e.word))
      for (const s of e.senses ?? []) if (s.see) seeOther.add(key(s.see))
    },
    region
  )

  // Pass 2: lemmas of inflected forms whose dictionary form isn't itself in the frequency list.
  const overrideLemmas = Object.values(overrides).flatMap((o) => ("lemma" in o ? [key(o.lemma)] : []))
  const missing = new Set(
    [...[...formOf.values()].flat(), ...overrideLemmas, ...seeOther].filter((t) => !lemmas.has(t))
  )
  console.log(`Reading Wiktionary (pass 2, ${missing.size} lemmas)…`)
  await streamEntries(files.wiktionary, (w) => missing.has(key(w)), addLemma, region)
  // Senses that point at another entry take that entry's meanings (camião: "truck", from caminhão).
  for (const entries of lemmas.values())
    for (const e of entries)
      if (e.senses?.some((s) => s.see))
        e.senses = e.senses.flatMap((s) =>
          s.see
            ? (lemmas.get(key(s.see)) ?? [])
                .filter((t) => t.pos === e.pos)
                .flatMap((t) => t.senses?.filter((ts) => !ts.see) ?? [])
            : [s]
        )

  // A surface form's lemma (tengo → tener). A spelling that is itself a lemma wins (casa = house, not a form of
  // casar) unless overrides.ts says otherwise.
  // Where a lowercase and a capitalised entry share a spelling (ich / Ich "ego", tag "meet!" / Tag "day"), how the
  // word is written in real sentences decides. Only for languages that capitalise nouns.
  const capitalised = LANGUAGES[lang]?.capitalisedNouns
    ? mostlyCapitalised(readTargetSentences(files.sentences, sources.sentences.file))
    : new Set<string>()
  // Capitalised noun entries (formal Sie is capitalised too, but stays with sie).
  const upperCase = (k: string) => lemmas.get(k)?.filter((e) => e.word !== k && mapPos(e.pos) === "noun") ?? []
  const sameCase = (k: string) => lemmas.get(k)?.filter((e) => e.word === k) ?? []
  // The entries a spelling means: the capitalised noun when that's how it's written, else the exact spelling,
  // else whatever exists (haus → Haus).
  const meant = (k: string) => {
    if (capitalised.has(k) && upperCase(k).length) return upperCase(k)
    return sameCase(k).length ? sameCase(k) : (lemmas.get(k) ?? [])
  }
  // A spelling that is itself a word usually means that word (casa = house, not a form of casar), but a gerund is
  // always its verb: nadando → nadar, not the heraldic adjective "naiant".
  const gerundOf = (form: string) => (gerunds.has(form) ? formOf.get(form)?.find((t) => lemmas.has(t)) : undefined)
  const resolve = (form: string) => {
    const o = own(overrides, form)
    const lemma =
      o && "skip" in o
        ? undefined
        : o && "lemma" in o
          ? key(o.lemma)
          : capitalised.has(form) && upperCase(form).length
            ? form
            : sameCase(form).length
              ? (gerundOf(form) ?? form)
              : (formOf.get(form)?.find((t) => lemmas.has(t)) ?? (lemmas.has(form) ? form : undefined))
    // A skipped word stays out however it's reached (el, from another spelling that points at it).
    const skipped = lemma && own(overrides, lemma)
    if (skipped && "skip" in skipped) return undefined
    return lemma && lemmas.has(lemma) ? lemma : undefined
  }
  // The entry used for a lemma. Part-of-speech overrides are keyed by lemma, so they also apply when reached via a
  // form (puede → poder).
  const entryFor = (lemma: string) => {
    const candidates = meant(lemma)
    const po = posOverride(lemma)
    // An override may pick the capitalised entry over a lowercase one (zeit → the noun Zeit).
    const forced = po && lemmas.get(lemma)!.find((e) => mapPos(e.pos) === po.pos)
    if (po && !forced) console.warn(`Override ${lemma} → ${po.pos}: no such entry`)
    return { entry: forced ?? bestEntry(candidates), glosses: po?.glosses }
  }

  const language = LANGUAGES[lang]
  const toWordOptions = { stressMarks: language?.formsMarkStress, perfect: language?.compoundPerfect }

  // Course units: lemma → [unit, position in the course].
  const units = CURRICULA[lang] ?? []
  if (units.length > UNITS.length)
    throw new Error(`${lang} curriculum has ${units.length} units, UNITS has ${UNITS.length}`)
  const course = new Map(
    units.flatMap((u, i) => u.map((l) => [key(l), i + 1] as const)).map(([l, u], k) => [l, { unit: u, at: k }])
  )

  // Walk spoken frequency order; each surface form counts towards its lemma. Past TOP_N, keep walking only for course
  // words the subtitles rarely use (pasaporte), so every course word is taught.
  const picked: Omit<Word, "examples" | "order" | "unit">[] = []
  const seen = new Set<string>()
  let ranked = 0
  let courseLeft = course.size
  for (const form of freq) {
    if (picked.length >= TOP_N && !courseLeft) break
    const lemma = resolve(form)
    if (!lemma || seen.has(lemma)) continue
    seen.add(lemma)
    if (course.has(lemma)) courseLeft--
    else if (picked.length >= TOP_N) continue
    const { entry, glosses } = entryFor(lemma)
    const w = entry && toWord(entry, ++ranked, glosses, toWordOptions)
    if (w) picked.push(w)
  }
  // Course words found past TOP_N push out the least frequent other words.
  const inCourse = (w: { lemma: string }) => course.has(key(w.lemma))
  for (let i = picked.length - 1; picked.length > TOP_N && i >= 0; i--) if (!inCourse(picked[i]!)) picked.splice(i, 1)
  const missingCourse = [...course.keys()].filter((l) => !picked.some((w) => key(w.lemma) === l))
  if (missingCourse.length) console.warn(`Course words not found as lemmas: ${missingCourse.join(", ")}`)
  // Teaching order: the course, then everything else by frequency.
  const orderOf = new Map(
    [...picked]
      .sort(
        (a, b) =>
          (course.get(key(a.lemma))?.at ?? Infinity) - (course.get(key(b.lemma))?.at ?? Infinity) || a.rank - b.rank
      )
      .map((w, i) => [w.lemma, i + 1])
  )

  console.log("Loading human recordings…")
  const wordAudio = await loadWordRecordings(sources.lingualibre, files.wordAudioIndex)
  const sentenceAudio = loadSentenceRecordings(files.sentenceAudio)

  // Short meaning of any word: shown under example sentences, and used to prefer literal translations.
  const pickedLemmas = new Set(picked.map((w) => key(w.lemma)))
  const curated = SHORT_GLOSSES[lang] ?? {}
  const vetted = loadVetted(ROOT, lang)
  // Like resolve(), but a spelling that's also a form of a top word means that word (dije → decir, not "locket").
  // Inflected forms listed in the chosen words' own tables (хочу → хотеть). Russian Wiktionary rarely has a separate
  // "form of" entry for them, so this is the fallback when nothing else resolves a sentence word.
  const pickedForm = new Map<string, string>()
  for (const w of picked) for (const f of allForms(w)) if (!pickedForm.has(key(f))) pickedForm.set(key(f), key(w.lemma))
  const glossLemma = (token: string) => {
    const o = own(overrides, token)
    if (o && "lemma" in o) return key(o.lemma)
    if (lemmas.has(token) && pickedLemmas.has(token)) return token
    return formOf.get(token)?.find((t) => pickedLemmas.has(t)) ?? resolve(token) ?? pickedForm.get(token)
  }
  const glossCache = new Map<string, TokenGloss | undefined>()
  const lookup = (token: string) => {
    if (!glossCache.has(token)) {
      const lemma = glossLemma(token)
      let g = own(curated, token)
      // Dictionary form as Wiktionary spells it (Haus, not haus).
      let shown = lemma
      if (lemma) {
        const { entry, glosses } = entryFor(lemma)
        if (entry) shown = entry.word
        // Meanings Claude cleaned up (scripts/vet-examples.ts) beat Wiktionary's first sense.
        if (!g && entry) g = own(vetted, entry.word)?.meanings[0]
        if (!g) {
          const all = glosses ?? (entry ? usableGlosses(entry) : [])
          const best = translatingGloss(all) ?? all[0]
          g = best && shortGloss(best)
        }
      }
      glossCache.set(token, g ? { g, ...(lemma && lemma !== token && shown && { l: shown }) } : undefined)
    }
    return glossCache.get(token)
  }

  console.log("Matching example sentences…")
  // Everyday-speech scoring: rank = spoken frequency; the top ~1,000 forms are the basics, ~3,000 common vocabulary.
  const rank = new Map(freq.map((f, i) => [f, i] as [string, number]))
  const droppedPronouns = new Set(LANGUAGES[lang]?.droppedPronouns ?? [])
  const everyday = {
    rank,
    commonCutoff: 3000,
    basicCutoff: 1000,
    droppedPronouns,
    gloss: (t: string) => lookup(t)?.g,
    capitalisedNouns: LANGUAGES[lang]?.capitalisedNouns,
  }
  const sentences = loadSentences(files.sentences, sources.sentences.file, sentenceAudio, everyday)
  // A spelling shared by several words (como: "like" and "I eat") is a weak match for all but its own lemma.
  const owners = new Map<string, number>()
  for (const w of picked)
    for (const f of allForms(w)) owners.set(f.toLowerCase(), (owners.get(f.toLowerCase()) ?? 0) + 1)
  const byFrequency = (forms: string[]) =>
    [...forms].sort((a, b) => (rank.get(a.toLowerCase()) ?? Infinity) - (rank.get(b.toLowerCase()) ?? Infinity))

  // Sentence words the course teaches later than the word being illustrated (memoised: called per token per sentence).
  const orderByKey = new Map(picked.map((w) => [key(w.lemma), orderOf.get(w.lemma)!]))
  const taughtAtMemo = new Map<string, number>()
  const taughtAt = (t: string) => {
    if (!taughtAtMemo.has(t)) taughtAtMemo.set(t, orderByKey.get(glossLemma(t) ?? "") ?? Infinity)
    return taughtAtMemo.get(t)!
  }

  const withExamples: Word[] = picked.map((w) => {
    // Wiktionary's own recording (curated) first, then Lingua Libre.
    const audio = w.audio ?? wordAudio.get(w.lemma.toLowerCase())
    const forms = allForms(w).slice(1)
    const formAudio = Object.fromEntries(
      forms.flatMap((f) => (wordAudio.has(f.toLowerCase()) ? [[f, wordAudio.get(f.toLowerCase())!]] : []))
    )
    const unit = course.get(key(w.lemma))?.unit
    const order = orderOf.get(w.lemma)!
    const meanings = own(vetted, w.lemma)?.meanings
    return {
      ...w,
      ...(meanings?.length && { glosses: meanings as [string, ...string[]] }),
      order,
      ...(unit && { unit }),
      ...(audio && { audio }),
      ...(Object.keys(formAudio).length && { formAudio }),
      examples: findExamples(
        sentences,
        byFrequency(allForms(w)),
        CANDIDATES,
        new Set(
          allForms(w)
            .filter((f) => f !== w.lemma && (owners.get(f.toLowerCase()) ?? 0) > 1)
            .map((f) => f.toLowerCase())
        ),
        droppedPronouns.has(w.lemma),
        (t) => taughtAt(t) > order
      ),
    }
  })

  // Pass 3: multi-word phrases that occur in the chosen sentences (por favor, de acuerdo, lo siento…).
  const ngrams = phraseCandidates([
    ...withExamples.flatMap((w) => w.examples.map((e) => e.text)),
    ...Object.values(vetted).flatMap((v) => v.examples.map((e) => e.text)),
  ])
  const top30 = new Set(freq.slice(0, 30))
  // Set phrases are usually interjections or adverbs (de verdad: "really", not the adjective "real").
  const PHRASE_POS = ["intj", "adv", "phrase"]
  const phraseEntries = new Map<string, RawEntry[]>()
  console.log("Reading Wiktionary (pass 3, phrases)…")
  await streamEntries(
    files.wiktionary,
    (w) => ngrams.has(w.toLowerCase()),
    (e) => {
      if (isLemmaEntry(e))
        phraseEntries.set(e.word.toLowerCase(), [...(phraseEntries.get(e.word.toLowerCase()) ?? []), e])
    },
    region
  )
  const phrases = new Map<string, string>()
  for (const [key, entries] of phraseEntries) {
    const rankPos = (e: RawEntry) => PHRASE_POS.indexOf(e.pos) + 1 || PHRASE_POS.length + 1
    const best = entries
      .sort((a, b) => rankPos(a) - rankPos(b))
      .map((e) => translatingGloss(usableGlosses(e)))
      .find(Boolean)
    if (!best) continue
    const gloss = shortGloss(best)
    // Skip non-translations (a la → "a la") and runs of the commonest function words whose meaning is long
    // (a la → "in the style of"); short ones are real phrases (por qué → "why").
    if (gloss.toLowerCase() === key) continue
    if (key.split(" ").every((t) => top30.has(t)) && gloss.replace(/,.*/, "").split(" ").length > 2) continue
    phrases.set(key, gloss)
  }

  // Word-by-word meanings for every candidate sentence; vetted words take Claude's picks, the rest the best-scored.
  const candidates: { word: Word; examples: Example[] }[] = []
  const words: Word[] = resolveIdClashes(withExamples).map((w) => {
    const forms = new Set(allForms(w).map((f) => f.toLowerCase()))
    const isTarget = (t: string) => forms.has(t)
    const gloss = (e: Example, drop = new Set<string>()) =>
      glossExample(e, isTarget, lookup, drop.size ? new Map([...phrases].filter(([k]) => !drop.has(k))) : phrases)
    const glossed = w.examples.map((e) => gloss(e))
    candidates.push({ word: w, examples: glossed })
    const v = own(vetted, w.lemma)
    const examples = v
      ? v.examples.map((e) => applyVetted(e, w.examples, gloss, isTarget))
      : glossed.slice(0, MAX_EXAMPLES)
    for (const e of examples)
      if (!tokenize(e.text).some(isTarget)) console.warn(`${w.lemma}: example lacks the word: ${e.text}`)
    return { ...w, examples }
  })
  // Input for scripts/vet-examples.ts. Wiktionary meanings, so a re-vet doesn't see its own output.
  writeFileSync(
    join(ROOT, "data-raw", lang, "candidates.json"),
    JSON.stringify(
      candidates.map(({ word, examples }) => ({
        lemma: word.lemma,
        pos: word.pos,
        glosses: picked.find((p) => p.lemma === word.lemma)!.glosses,
        order: word.order,
        unit: word.unit,
        examples,
      }))
    )
  )

  const out = join(ROOT, "public/data", lang)
  rmSync(out, { recursive: true, force: true })
  mkdirSync(join(out, "words"), { recursive: true })
  // In teaching order, which is how the word list shows them.
  const index: IndexEntry[] = [...words]
    .sort((a, b) => a.order - b.order)
    .map((w) => ({
      id: w.id,
      lemma: w.lemma,
      pos: w.pos,
      rank: w.rank,
      order: w.order,
      ...(w.unit && { unit: w.unit }),
      gloss: w.glosses[0],
    }))
  writeFileSync(join(out, "index.json"), JSON.stringify(index))
  for (const w of words) writeFileSync(join(out, "words", `${w.id}.json`), JSON.stringify(w))

  const byPos = Object.groupBy(words, (w) => w.pos)
  console.log(`Wrote ${words.length} words to ${out}`)
  console.log(Object.fromEntries(Object.entries(byPos).map(([k, v]) => [k, v!.length])))
  console.log(`Without examples: ${words.filter((w) => !w.examples.length).length}`)
  console.log(`Course: ${words.filter((w) => w.unit).length} words in ${units.length} units`)
  const examples = words.flatMap((w) => w.examples)
  const tokens = examples.flatMap((e) => e.words ?? [])
  console.log(
    `Glosses: ${tokens.filter(Boolean).length}/${tokens.length} words, ${examples.filter((e) => e.phrases).length} sentences with phrases ` +
      `(${phrases.size} phrases found)`
  )
  const forms = words.flatMap((w) => allForms(w).slice(1))
  const formsWithAudio = words.reduce((n, w) => n + Object.keys(w.formAudio ?? {}).length, 0)
  console.log(
    `Human audio: ${words.filter((w) => w.audio).length}/${words.length} words, ${formsWithAudio}/${forms.length} forms, ` +
      `${examples.filter((e) => e.audio).length}/${examples.length} sentences`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
