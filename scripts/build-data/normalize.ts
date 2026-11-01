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
// Russian Wiktionary words them "The Cyrillic letter М, м." / "The Roman letter X, x."
const LETTER_NAME =
  /^the name of the .*letter|\bgreek letter\b|^the (archaic |old )?(cyrillic |latin |roman )(script )?letter\b|^the russian name of the .*letter/i

/** All learner-relevant meanings of an entry, in Wiktionary order. */
// Meanings that only describe a form of another word, without Wiktionary marking them as one: Italian clitic
// compounds ("compound of di', the second-person singular imperative of dire, and mi") and bare verb forms
// ("first-person plural present indicative of potere").
const FORM_GLOSS =
  /^(compound|combined form) of\b|^(first|second|third)-person (singular|plural)\b.*\b(present|past|imperfect|preterite|future|conditional|subjunctive|imperative|indicative)\b.*\bof\b/i

export function usableGlosses(e: RawEntry): string[] {
  const out: string[] = []
  for (const s of e.senses ?? []) {
    if (!isLemmaSense(s) || skip(s.tags)) continue
    // Sub-senses repeat the parent gloss first; the last item is the specific meaning.
    const g = s.glosses!.at(-1)!.trim()
    if (g && !LETTER_NAME.test(g) && !FORM_GLOSS.test(g) && !out.includes(g)) out.push(g)
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
  // Russian headings spell the word with its stress mark (окно́), one character longer than e.word.
  const head = (e.head_templates?.[0]?.expansion ?? "").replace(/[\u0300\u0301]/g, "")
  // They also put a transliteration first: "дом • (dom) m inan".
  const after = head
    .slice(e.word.length)
    .trim()
    .replace(/^•\s*\([^)]*\)\s*/, "")
  if (/^(m or f|mf|m and f|f or m)\b/.test(after)) return "mf"
  if (/^m\b/.test(after)) return "m"
  if (/^f\b/.test(after)) return "f"
  if (/^n\b/.test(after)) return "n"
}

// Russian forms carry stress marks (до́ма) and optional parts ((по)нове́е) that real sentences don't. Only the
// combining marks are removed: Spanish accents are precomposed letters (á) and stay.
const clean = (form: string, opts: ToWordOptions = {}) => {
  const out = form.replace(/\([^)]*\)/g, "").replace(/[\u0300\u0301]/g, "")
  return opts.stressMarks ? unstress(out) : out
}

// Italian Wiktionary marks stress on forms (fàccio, facévo); only a word-final accent is real spelling (farò,
// perché), so accents on a vowel followed by another letter are removed.
const PLAIN: Record<string, string> = { à: "a", è: "e", é: "e", ì: "i", í: "i", ò: "o", ó: "o", ù: "u", ú: "u" }
// One-syllable words keep a final accent only when it's written (è, dà, più); fà, và, stà are dictionary marks.
const WRITTEN_ACCENT = new Set(["è", "dà", "dì", "già", "giù", "più", "può", "ciò", "sé", "né", "lì", "là", "tè", "sì"])
const unstress = (form: string) => {
  const out = form.replace(/[àèéìíòóùú](?=\p{L})/gu, (c) => PLAIN[c] ?? c)
  const oneSyllable = (out.match(/[aeiouàèéìíòóùú]+/gi) ?? []).length === 1
  return oneSyllable && !WRITTEN_ACCENT.has(out.toLowerCase()) ? out.replace(/[àèéìíòóùú]/g, (c) => PLAIN[c] ?? c) : out
}

export interface ToWordOptions {
  /** Forms carry dictionary stress marks that aren't part of the spelling (Italian). */
  stressMarks?: boolean
  /**
   * Build the present perfect from the auxiliary's present and the past participle (Italian ho fatto, sono andati),
   * which Wiktionary's tables leave out. `plural` turns the participle plural for verbs that agree (essere).
   */
  perfect?: { auxiliaries: Record<string, Record<Person, string>>; agreeing: string; plural: (p: string) => string }
}
// "до́мы^*" and similar: footnote markers for rare variants.
const marked = (form: string) => /[*^]/.test(form)

const usable = (f: { form: string; tags?: string[] }) =>
  f.form && f.form !== "-" && !f.form.includes(" ") && !marked(f.form) && !skip(f.tags)

function forms(e: RawEntry, opts: ToWordOptions): WordForms | undefined {
  const out: WordForms = {}
  for (const raw of e.forms ?? []) {
    if (raw.source === "conjugation") continue
    const f = { ...raw, form: clean(raw.form ?? "", opts) }
    const t = new Set(f.tags)
    // The headword's own entry (Russian lists кни́га tagged canonical, feminine). Forms that merely look the same
    // stay: German die Übersetzung → genitive Übersetzung, Spanish tesis → plural tesis.
    if (t.has("canonical")) continue
    // Declension tables (German gute, guten, gutem…) are mostly noise; only the nominative gender forms count
    // (Russian новая, новое, новые). German tables also tag strong/weak, so they never match.
    if (f.source === "declension") {
      if (!usable(f) || t.size !== 2 || !t.has("nominative")) continue
      if (t.has("feminine")) out.feminine ??= f.form
      else if (t.has("neuter")) out.neuter ??= f.form
      else if (t.has("plural")) out.plural ??= f.form
      continue
    }
    // German "am besten" is the superlative a learner needs; single-word ones (Spanish -ísimo) are left out.
    if (t.has("superlative")) {
      if (f.form.includes(" ") && !skip(f.tags)) out.superlative ??= f.form
      continue
    }
    if (!usable(f)) continue
    if (t.has("feminine") && t.has("plural")) out.femininePlural ??= f.form
    else if (t.has("masculine") && t.has("plural")) out.masculinePlural ??= f.form
    else if (t.has("feminine") && !t.has("participle")) out.feminine ??= f.form
    else if (t.has("masculine") && !t.has("singular")) out.masculine ??= f.form
    // Russian tags the plural "nominative plural" (дома).
    else if (t.has("plural") && (t.size === 1 || (t.size === 2 && t.has("nominative")))) out.plural ??= f.form
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
  // Italian passato remoto (feci) is tagged "historic past".
  if (t.has("historic")) return "preterite"
  if (t.has("subjunctive-ii")) return t.has("future") ? "conditional" : "imperfect"
  return TENSES.find((x) => t.has(x))
}

function person(t: Set<string>): Person | undefined {
  const n = t.has("singular") ? "s" : t.has("plural") ? "p" : null
  const p = t.has("first-person") ? "1" : t.has("second-person") ? "2" : t.has("third-person") ? "3" : null
  return n && p ? (`${p}${n}` as Person) : undefined
}

function conjugation(e: RawEntry, opts: ToWordOptions): Pick<Word, "conjugation" | "nonFinite" | "past"> {
  const conj: Conjugation = {}
  const nonFinite: NonNullable<Word["nonFinite"]> = {}
  const past: NonNullable<Word["past"]> = {}
  for (const raw of e.forms ?? []) {
    // Multi-word forms are real tenses here (German habe gemacht, rufe an), unlike in noun and adjective forms.
    if (raw.source !== "conjugation" || !raw.form || raw.form === "-" || marked(raw.form) || skip(raw.tags)) continue
    if ((raw.tags ?? []).some((x) => CONJ_SKIP.has(x))) continue
    const f = { ...raw, form: clean(raw.form, opts) }
    const t = new Set(f.tags)
    // Russian past tense goes by gender and number, not person (делал, делала, делало, делали).
    if (t.has("past") && !t.has("participle") && !person(t)) {
      const g = t.has("plural")
        ? "p"
        : t.has("feminine")
          ? "f"
          : t.has("neuter")
            ? "n"
            : t.has("masculine")
              ? "m"
              : null
      if (g) past[g] ??= f.form
      continue
    }
    if (t.has("gerund")) nonFinite.gerund ??= f.form
    if (t.has("participle") && t.has("past") && (t.has("masculine") || t.size === 2)) nonFinite.participle ??= f.form
    // Russian present and future forms carry no mood tag; they're indicative.
    const mood: Mood | undefined = t.has("indicative")
      ? "indicative"
      : t.has("subjunctive")
        ? "subjunctive"
        : t.has("imperative")
          ? "imperative"
          : TENSES.some((x) => t.has(x))
            ? "indicative"
            : undefined
    const p = person(t)
    if (!mood || !p) continue
    const tense = tenseOf(t, mood)
    if (!tense || (mood === "subjunctive" && !SUBJUNCTIVE_TENSES.includes(tense))) continue
    const row = ((conj[mood] ??= {})[tense] ??= {})
    row[p] ??= f.form
  }
  const present = conj.indicative?.present
  const participle = nonFinite.participle
  // Italian writes the auxiliary with its stress mark too (avére).
  const auxRaw = e.forms?.find((f) => f.tags?.includes("auxiliary"))?.form
  const aux = auxRaw && clean(auxRaw, opts)
  const auxForms = aux ? opts.perfect?.auxiliaries[aux] : undefined
  if (opts.perfect && present && participle && auxForms) {
    const perfect: Partial<Record<Person, string>> = {}
    for (const p of Object.keys(present) as Person[]) {
      const agrees = aux === opts.perfect.agreeing && p.endsWith("p")
      perfect[p] = `${auxForms[p]} ${agrees ? opts.perfect.plural(participle) : participle}`
    }
    conj.indicative!.perfect = perfect
  }
  return {
    ...(Object.keys(conj).length && { conjugation: conj }),
    ...(Object.keys(nonFinite).length && { nonFinite }),
    ...(Object.keys(past).length && { past }),
  }
}

/** Russian verb aspect and its partner, from the headword's forms: делать is imperfective, partner сделать. */
function aspect(e: RawEntry): Pick<Word, "aspect" | "aspectPartner"> {
  const tags = e.forms?.find((f) => f.tags?.includes("canonical"))?.tags ?? []
  const kind = tags.includes("perfective") ? "perfective" : tags.includes("imperfective") ? "imperfective" : undefined
  if (!kind) return {}
  const other = kind === "perfective" ? "imperfective" : "perfective"
  const partner = e.forms?.find((f) => !f.source && f.tags?.length === 1 && f.tags[0] === other)?.form
  return { aspect: kind, ...(partner && { aspectPartner: clean(partner) }) }
}

// Cyrillic → Latin for word IDs. The soft and hard signs get underscores so брат (brat) and брать (brat_) differ.
const CYRILLIC: Record<string, string> = Object.fromEntries(
  [..."абвгдезийклмнопрстуфы"].map((c, i) => [c, "abvgdezijklmnoprstufy"[i]!])
)
Object.assign(CYRILLIC, {
  ё: "yo",
  ж: "zh",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "__",
  ь: "_",
  э: "eh",
  ю: "yu",
  я: "ya",
})

/**
 * ASCII, URL-safe and stable across rebuilds (progress is keyed by it): está → esta_, año → an_o, groß → gross,
 * дом → dom.
 */
export function wordId(lemma: string): string {
  return [...lemma.toLowerCase()]
    .map((c) => CYRILLIC[c] ?? c)
    .join("")
    .replaceAll("ß", "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "_")
    .replace(/[^a-z0-9_]+/g, "-")
}

// Which accent a mark is, for telling apart words wordId() would merge (Portuguese avó / avô, lá / lã).
const MARK: Record<string, string> = { "\u0300": "g", "\u0302": "c", "\u0303": "t", "\u0308": "d", "\u0327": "s" }

/**
 * Makes IDs unique without touching the ones that already are (progress is keyed by them). Within a clash, a word
 * whose only accents are acute keeps the plain ID; the others spell their marks out (avô → avo_c, lã → la_t, à → a_g).
 * The rule doesn't depend on word order, so IDs stay stable across rebuilds.
 */
export function resolveIdClashes<T extends { id: string; lemma: string }>(words: T[]): T[] {
  const count = new Map<string, number>()
  for (const w of words) count.set(w.id, (count.get(w.id) ?? 0) + 1)
  return words.map((w) => {
    const marks = [...w.lemma.toLowerCase().normalize("NFD")].filter((c) => /[\u0300-\u036f]/.test(c))
    if (count.get(w.id)! < 2 || marks.every((c) => c === "\u0301")) return w
    const id = [...w.lemma.toLowerCase().replaceAll("ß", "ss").normalize("NFD")]
      .map((c) => (/[\u0300-\u036f]/.test(c) ? `_${MARK[c] ?? (c === "\u0301" ? "" : "x")}` : c))
      .join("")
      .replace(/[^a-z0-9_]+/g, "-")
    return { ...w, id }
  })
}

/** Converts a kaikki lemma entry into a Word, or undefined when it has nothing teachable. */
export function toWord(
  e: RawEntry,
  rank: number,
  glossOverride?: string[],
  opts: ToWordOptions = {}
): Omit<Word, "examples"> | undefined {
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
    const f = forms(e, opts)
    if (f) w.forms = f
  }
  if (pos === "verb") Object.assign(w, conjugation(e, opts), aspect(e))
  return w
}
