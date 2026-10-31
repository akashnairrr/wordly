import type { Conjugation, Mood, Person, Pos, Tense, Word, WordForms } from "../../src/lib/types"
import { isLemmaSense, type RawEntry } from "./wiktionary"

const POS_MAP: Record<string, Pos> = {
  noun: "noun",
  verb: "verb",
  adj: "adj",
  adv: "adv",
  pron: "pron",
  prep: "prep",
  conj: "conj",
  det: "det",
  article: "det",
  intj: "intj",
  num: "num",
  contraction: "other",
  particle: "other",
}

export function mapPos(pos: string): Pos | undefined {
  return POS_MAP[pos]
}

// Senses/forms with these tags are noise for a learner.
const SKIP_TAGS = new Set([
  "obsolete",
  "archaic",
  "dated",
  "rare",
  "alternative",
  "pronunciation-spelling",
  "nonstandard",
  "misspelling",
])
const skip = (tags: string[] = []) => tags.some((t) => SKIP_TAGS.has(t))

// "de", "te", "mi"… are also names of letters; that's never the meaning a learner wants.
const LETTER_NAME = /^the name of the .*letter|\bgreek letter\b/i

/** All learner-relevant meanings of an entry, in Wiktionary order. */
export function usableGlosses(e: RawEntry): string[] {
  const out: string[] = []
  for (const s of e.senses ?? []) {
    if (!isLemmaSense(s) || skip(s.tags)) continue
    // Sub-senses repeat the parent gloss first; the last item is the specific meaning.
    const g = s.glosses!.at(-1)!.trim()
    if (g && !LETTER_NAME.test(g) && !out.includes(g)) out.push(g)
  }
  return out
}

const glosses = (e: RawEntry) => usableGlosses(e).slice(0, 3)

// Tie-break between same-spelled entries: everyday function words and verbs before nouns
// (ser = "to be", not "a being"; haber = "to have", not "asset").
const POS_PRIORITY: Pos[] = ["verb", "pron", "det", "prep", "conj", "adv", "adj", "noun", "intj", "num", "other"]

/** Picks the entry a learner most likely means when several share a spelling: most meanings wins. */
export function bestEntry(entries: RawEntry[]): RawEntry | undefined {
  const scored = entries
    .map((e) => ({ e, pos: mapPos(e.pos), n: usableGlosses(e).length }))
    .filter((x) => x.pos && x.n > 0)
  scored.sort((a, b) => b.n - a.n || POS_PRIORITY.indexOf(a.pos!) - POS_PRIORITY.indexOf(b.pos!))
  return scored[0]?.e
}

function ipa(e: RawEntry): string | undefined {
  return e.sounds?.find((s) => s.ipa?.startsWith("/"))?.ipa
}

function gender(e: RawEntry): Word["gender"] {
  const head = e.head_templates?.[0]?.expansion ?? ""
  const after = head.slice(e.word.length).trim()
  if (/^(m or f|mf|m and f|f or m)\b/.test(after)) return "mf"
  if (/^m\b/.test(after)) return "m"
  if (/^f\b/.test(after)) return "f"
  if (/^n\b/.test(after)) return "n"
}

const usable = (f: { form: string; tags?: string[] }) =>
  f.form && f.form !== "-" && !f.form.includes(" ") && !skip(f.tags)

function forms(e: RawEntry): WordForms | undefined {
  const out: WordForms = {}
  for (const f of e.forms ?? []) {
    // German adjectives carry a full declension table (gute, guten, gutem…); only the headline forms are shown.
    if (f.source === "conjugation" || f.source === "declension") continue
    const t = new Set(f.tags)
    // German "am besten" is the superlative a learner needs; single-word ones (Spanish -ísimo) are left out.
    if (t.has("superlative")) {
      if (f.form?.includes(" ") && !skip(f.tags)) out.superlative ??= f.form
      continue
    }
    if (!usable(f)) continue
    if (t.has("feminine") && t.has("plural")) out.femininePlural ??= f.form
    else if (t.has("masculine") && t.has("plural")) out.masculinePlural ??= f.form
    else if (t.has("feminine") && !t.has("participle")) out.feminine ??= f.form
    else if (t.has("masculine") && !t.has("singular")) out.masculine ??= f.form
    else if (t.has("plural") && t.size === 1) out.plural ??= f.form
    else if (t.has("genitive") && t.size === 1) out.genitive ??= f.form
    else if (t.has("comparative") && t.size === 1) out.comparative ??= f.form
  }
  return Object.keys(out).length ? out : undefined
}

// Variants we leave out of the learner's table: Spanish vos, -se subjunctive, clitic combos and usted imperative
// duplicates; German subordinate-clause word order (anrufe), Konjunktiv I and the rarer compound tenses.
const CONJ_SKIP = new Set([
  "combined-form",
  "vos-form",
  "imperfect-se",
  "formal",
  "table-tags",
  "inflection-template",
  "class",
  "subordinate-clause",
  "subjunctive-i",
  "pluperfect",
  "future-ii",
])
const TENSES: Tense[] = ["present", "preterite", "imperfect", "perfect", "future", "conditional"]
const SUBJUNCTIVE_TENSES: Tense[] = ["present", "imperfect", "conditional"]

/** German Konjunktiv II has no tense tag: hätte is the "imperfect" subjunctive, würde machen the conditional. */
function tenseOf(t: Set<string>, mood: Mood): Tense | undefined {
  if (mood === "imperative") return t.has("negative") ? "negative" : "affirmative"
  if (t.has("subjunctive-ii")) return t.has("future") ? "conditional" : "imperfect"
  return TENSES.find((x) => t.has(x))
}

function person(t: Set<string>): Person | undefined {
  const n = t.has("singular") ? "s" : t.has("plural") ? "p" : null
  const p = t.has("first-person") ? "1" : t.has("second-person") ? "2" : t.has("third-person") ? "3" : null
  return n && p ? (`${p}${n}` as Person) : undefined
}

function conjugation(e: RawEntry): { conjugation?: Conjugation; nonFinite?: Word["nonFinite"] } {
  const conj: Conjugation = {}
  const nonFinite: NonNullable<Word["nonFinite"]> = {}
  for (const f of e.forms ?? []) {
    // Multi-word forms are real tenses here (German habe gemacht, rufe an), unlike in noun and adjective forms.
    if (f.source !== "conjugation" || !f.form || f.form === "-" || skip(f.tags)) continue
    if ((f.tags ?? []).some((x) => CONJ_SKIP.has(x))) continue
    const t = new Set(f.tags)
    if (t.has("gerund")) nonFinite.gerund ??= f.form
    if (t.has("participle") && t.has("past") && (t.has("masculine") || t.size === 2)) nonFinite.participle ??= f.form
    const mood: Mood | undefined = t.has("indicative")
      ? "indicative"
      : t.has("subjunctive")
        ? "subjunctive"
        : t.has("imperative")
          ? "imperative"
          : undefined
    const p = person(t)
    if (!mood || !p) continue
    const tense = tenseOf(t, mood)
    if (!tense || (mood === "subjunctive" && !SUBJUNCTIVE_TENSES.includes(tense))) continue
    const row = ((conj[mood] ??= {})[tense] ??= {})
    row[p] ??= f.form
  }
  return {
    conjugation: Object.keys(conj).length ? conj : undefined,
    nonFinite: Object.keys(nonFinite).length ? nonFinite : undefined,
  }
}

/** ASCII, URL-safe and stable across rebuilds (progress is keyed by it): está → esta_, año → an_o, groß → gross. */
export function wordId(lemma: string): string {
  return lemma
    .toLowerCase()
    .replaceAll("ß", "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "_")
    .replace(/[^a-z0-9_]+/g, "-")
}

/** Converts a kaikki lemma entry into a Word, or undefined when it has nothing teachable. */
export function toWord(e: RawEntry, rank: number, glossOverride?: string[]): Omit<Word, "examples"> | undefined {
  const pos = mapPos(e.pos)
  const [first, ...rest] = glossOverride ?? glosses(e)
  // Single letters as nouns are letter names ("S", from geht's), never vocabulary.
  if (!pos || !first || (pos === "noun" && e.word.length === 1)) return
  const w: Omit<Word, "examples"> = { id: wordId(e.word), lemma: e.word, pos, rank, glosses: [first, ...rest] }
  const i = ipa(e)
  if (i) w.ipa = i
  const audio = e.sounds?.find((s) => s.mp3_url)?.mp3_url
  if (audio) w.audio = audio
  if (pos === "noun") {
    const gen = gender(e)
    if (gen) w.gender = gen
  }
  if (pos === "noun" || pos === "adj" || pos === "det" || pos === "pron") {
    const f = forms(e)
    if (f) w.forms = f
  }
  if (pos === "verb") Object.assign(w, conjugation(e))
  return w
}
