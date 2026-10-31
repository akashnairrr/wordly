import type { Conjugation, Mood, Person, Pos, Tense, Word, WordForms } from "../../src/lib/types";
import { isLemmaSense, type RawEntry } from "./wiktionary";

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
};

export function mapPos(pos: string): Pos | undefined {
  return POS_MAP[pos];
}

// Senses/forms with these tags are noise for a learner.
const SKIP_TAGS = new Set(["obsolete", "archaic", "dated", "rare", "alternative", "pronunciation-spelling", "nonstandard", "misspelling"]);
const skip = (tags: string[] = []) => tags.some((t) => SKIP_TAGS.has(t));

// "de", "te", "mi"… are also names of letters; that's never the meaning a learner wants.
const LETTER_NAME = /^the name of the .*letter|\bgreek letter\b/i;

/** All learner-relevant meanings of an entry, in Wiktionary order. */
export function usableGlosses(e: RawEntry): string[] {
  const out: string[] = [];
  for (const s of e.senses ?? []) {
    if (!isLemmaSense(s) || skip(s.tags)) continue;
    // Sub-senses repeat the parent gloss first; the last item is the specific meaning.
    const g = s.glosses!.at(-1)!.trim();
    if (g && !LETTER_NAME.test(g) && !out.includes(g)) out.push(g);
  }
  return out;
}

const glosses = (e: RawEntry) => usableGlosses(e).slice(0, 3);

// Tie-break between same-spelled entries: everyday function words and verbs before nouns
// (ser = "to be", not "a being"; haber = "to have", not "asset").
const POS_PRIORITY: Pos[] = ["verb", "pron", "det", "prep", "conj", "adv", "adj", "noun", "intj", "num", "other"];

/** Picks the entry a learner most likely means when several share a spelling: most meanings wins. */
export function bestEntry(entries: RawEntry[]): RawEntry | undefined {
  const scored = entries.map((e) => ({ e, pos: mapPos(e.pos), n: usableGlosses(e).length })).filter((x) => x.pos && x.n > 0);
  scored.sort((a, b) => b.n - a.n || POS_PRIORITY.indexOf(a.pos!) - POS_PRIORITY.indexOf(b.pos!));
  return scored[0]?.e;
}

function ipa(e: RawEntry): string | undefined {
  return e.sounds?.find((s) => s.ipa?.startsWith("/"))?.ipa;
}

function gender(e: RawEntry): Word["gender"] {
  const head = e.head_templates?.[0]?.expansion ?? "";
  const after = head.slice(e.word.length).trim();
  if (/^(m or f|mf|m and f|f or m)\b/.test(after)) return "mf";
  if (/^m\b/.test(after)) return "m";
  if (/^f\b/.test(after)) return "f";
}

const usable = (f: { form: string; tags?: string[] }) => f.form && f.form !== "-" && !f.form.includes(" ") && !skip(f.tags);

function forms(e: RawEntry): WordForms | undefined {
  const out: WordForms = {};
  for (const f of e.forms ?? []) {
    if (f.source === "conjugation" || !usable(f)) continue;
    const t = new Set(f.tags);
    if (t.has("feminine") && t.has("plural")) out.femininePlural ??= f.form;
    else if (t.has("masculine") && t.has("plural")) out.masculinePlural ??= f.form;
    else if (t.has("feminine") && !t.has("participle")) out.feminine ??= f.form;
    else if (t.has("masculine") && !t.has("singular")) out.masculine ??= f.form;
    else if (t.has("plural") && t.size === 1) out.plural ??= f.form;
  }
  return Object.keys(out).length ? out : undefined;
}

// Variants we leave out of the learner's table (vos, -se subjunctive, clitic combos, usted imperative duplicates).
const CONJ_SKIP = new Set(["combined-form", "vos-form", "imperfect-se", "formal", "table-tags", "inflection-template", "class"]);
const TENSES: Tense[] = ["present", "preterite", "imperfect", "future", "conditional"];

function person(t: Set<string>): Person | undefined {
  const n = t.has("singular") ? "s" : t.has("plural") ? "p" : null;
  const p = t.has("first-person") ? "1" : t.has("second-person") ? "2" : t.has("third-person") ? "3" : null;
  return n && p ? (`${p}${n}` as Person) : undefined;
}

function conjugation(e: RawEntry): { conjugation?: Conjugation; nonFinite?: Word["nonFinite"] } {
  const conj: Conjugation = {};
  const nonFinite: NonNullable<Word["nonFinite"]> = {};
  for (const f of e.forms ?? []) {
    if (f.source !== "conjugation" || !usable(f) || (f.tags ?? []).some((x) => CONJ_SKIP.has(x))) continue;
    const t = new Set(f.tags);
    if (t.has("gerund")) nonFinite.gerund ??= f.form;
    if (t.has("participle") && t.has("past") && (t.has("masculine") || t.size === 2)) nonFinite.participle ??= f.form;
    const mood: Mood | undefined = t.has("indicative")
      ? "indicative"
      : t.has("subjunctive")
        ? "subjunctive"
        : t.has("imperative")
          ? "imperative"
          : undefined;
    const p = person(t);
    if (!mood || !p) continue;
    const tense: Tense | undefined = mood === "imperative" ? (t.has("negative") ? "negative" : "affirmative") : TENSES.find((x) => t.has(x));
    if (!tense || (mood === "subjunctive" && tense !== "present" && tense !== "imperfect")) continue;
    const row = ((conj[mood] ??= {})[tense] ??= {});
    row[p] ??= f.form;
  }
  return {
    conjugation: Object.keys(conj).length ? conj : undefined,
    nonFinite: Object.keys(nonFinite).length ? nonFinite : undefined,
  };
}

/** ASCII, URL-safe and stable across rebuilds (progress is keyed by it): está → esta_, año → an_o. */
export function wordId(lemma: string): string {
  return lemma
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "_")
    .replace(/[^a-z0-9_]+/g, "-");
}

/** Converts a kaikki lemma entry into a Word, or undefined when it has nothing teachable. */
export function toWord(e: RawEntry, rank: number, glossOverride?: string[]): Omit<Word, "examples"> | undefined {
  const pos = mapPos(e.pos);
  const g = glossOverride ?? glosses(e);
  if (!pos || !g.length) return;
  const w: Omit<Word, "examples"> = { id: wordId(e.word), lemma: e.word, pos, rank, glosses: g };
  const i = ipa(e);
  if (i) w.ipa = i;
  const audio = e.sounds?.find((s) => s.mp3_url)?.mp3_url;
  if (audio) w.audio = audio;
  if (pos === "noun") {
    const gen = gender(e);
    if (gen) w.gender = gen;
  }
  if (pos === "noun" || pos === "adj" || pos === "det" || pos === "pron") {
    const f = forms(e);
    if (f) w.forms = f;
  }
  if (pos === "verb") Object.assign(w, conjugation(e));
  return w;
}
