import { execFileSync } from "node:child_process";
import type { Example } from "../../src/lib/types";
import { tokenize } from "../../src/lib/words";

/** What makes a sentence sound like everyday speech, measured once per sentence at load time. */
interface SentenceStats {
  tokens: string[];
  /** Tokens outside the common spoken vocabulary. */
  rare: string[];
  /** Tokens outside the basic vocabulary a beginner meets first. */
  uncommon: string[];
  /** Names ("Tom", "María"): capitalised mid-sentence, or anywhere with no dictionary meaning. */
  names: number;
  digits: boolean;
  question: boolean;
  /** Exclamations in Tatoeba are mostly film drama ("¡Fuera de mi casa!"). */
  exclamation: boolean;
  /** Spells out a subject pronoun speakers would drop ("Yo tengo uno" instead of "Tengo uno"). */
  stiff: boolean;
  /** Share of known words whose meaning shows up in the English (0–1): low = loose, hard-to-follow translation. */
  literal: number;
}

export interface SentenceIndex {
  pairs: Example[];
  stats: SentenceStats[];
  byToken: Map<string, number[]>;
}

export interface Everyday {
  /** Surface form → spoken frequency rank (0 = most frequent). */
  rank: Map<string, number>;
  /** Words ranked below this count as rare. */
  commonCutoff: number;
  /** Words ranked below this are past the basics. */
  basicCutoff: number;
  /** Subject pronouns of the language that speakers usually drop (from the language registry). */
  droppedPronouns: Set<string>;
  /** Short English meaning of a token, to check that the translation follows the sentence. */
  gloss?: (token: string) => string | undefined;
}

const NO_EVERYDAY: Everyday = { rank: new Map(), commonCutoff: Infinity, basicCutoff: Infinity, droppedPronouns: new Set() };

// Prefix match so "hungry" counts for hambre → "hunger" and "eats" for "to eat".
const stem = (w: string) => w.slice(0, 4);

/** How much of the sentence the English translates word for word. Unknown words (names…) don't count. */
export function literalness(tokens: string[], en: string, gloss: Everyday["gloss"]): number {
  if (!gloss) return 1;
  const english = new Set(tokenize(en).map(stem));
  let known = 0;
  let hits = 0;
  for (const t of tokens) {
    const g = gloss(t);
    if (!g) continue;
    known++;
    if (tokenize(g).some((w) => w !== "to" && english.has(stem(w)))) hits++;
  }
  return known ? hits / known : 1;
}

function measure(text: string, en: string, everyday: Everyday): SentenceStats {
  const tokens = tokenize(text);
  const rankOf = (t: string) => everyday.rank.get(t) ?? Infinity;
  const isName = (m: RegExpExecArray) => /\s/.test(text[m.index - 1] ?? "") || (!!everyday.gloss && !everyday.gloss(m[0].toLowerCase()));
  return {
    tokens,
    rare: tokens.filter((t) => rankOf(t) >= everyday.commonCutoff),
    uncommon: tokens.filter((t) => rankOf(t) >= everyday.basicCutoff),
    names: [...text.matchAll(/\p{Lu}\p{Ll}+/gu)].filter(isName).length,
    digits: /\d/.test(text),
    question: /[¿?]/.test(text),
    exclamation: /[¡!]/.test(text),
    stiff: tokens.some((t) => everyday.droppedPronouns.has(t)),
    literal: literalness(tokens, en, everyday.gloss),
  };
}

/**
 * Reads manythings "English<TAB>Target<TAB>attribution" lines from inside the zip. The attribution ends with the
 * target sentence's Tatoeba id ("… #2877272 (CM) & #4986655 (user)"), used to attach a human recording.
 */
export function loadSentences(zipPath: string, file: string, recordings: Map<string, string>, everyday: Everyday): SentenceIndex {
  const raw = execFileSync("unzip", ["-p", zipPath, file], { maxBuffer: 1 << 30 }).toString("utf8");
  const pairs: Example[] = [];
  const seen = new Set<string>();
  for (const line of raw.split("\n")) {
    const [en, text, attribution = ""] = line.split("\t");
    if (!en || !text || seen.has(text)) continue;
    seen.add(text);
    const id = [...attribution.matchAll(/#(\d+)/g)].at(-1)?.[1];
    const audio = id && recordings.get(id);
    pairs.push(audio ? { text, en, audio } : { text, en });
  }
  return indexSentences(pairs, everyday);
}

export function indexSentences(pairs: Example[], everyday: Everyday = NO_EVERYDAY): SentenceIndex {
  const stats = pairs.map((p) => measure(p.text, p.en, everyday));
  const byToken = new Map<string, number[]>();
  stats.forEach((s, i) => {
    for (const t of new Set(s.tokens)) {
      let list = byToken.get(t);
      if (!list) byToken.set(t, (list = []));
      list.push(i);
    }
  });
  return { pairs, stats, byToken };
}

/** Lower is better: short, basic-word, literally translated sentences with a native recording win. */
function everydayScore(s: SentenceStats, form: string, audio: boolean, ambiguous: boolean, pronoun: boolean): number {
  const n = s.tokens.length;
  const rare = s.rare.filter((t) => t !== form).length;
  const uncommon = s.uncommon.filter((t) => t !== form).length;
  return (
    rare * 6 +
    uncommon * 2 +
    s.names * 12 +
    (s.digits ? 6 : 0) +
    // Three to six words is easy to read, say and remember.
    (n < 3 ? 4 : n > 6 ? (n - 6) * 3 : 0) +
    (audio ? 0 : 4) +
    // Matched only through a spelling another word owns (comer ← "como"): probably the other word.
    (ambiguous ? 30 : 0) +
    // Teaching the pronoun itself is the one place spelling it out is right.
    (s.stiff && !pronoun ? 4 : 0) +
    (s.exclamation ? 2 : 0) +
    Math.round((1 - s.literal) * 12) -
    (s.question ? 2 : 0)
  );
}

const FORMS_CONSIDERED = 8;
const SAME_FORM_PENALTY = 4;
const REPEAT_PENALTY = 10;
// Conversation mixes questions with statements: beyond this many questions, prefer other sentences.
const MAX_QUESTIONS = 3;
const QUESTION_PENALTY = 6;

/**
 * Picks up to `max` everyday sentences containing the word. `forms` should be most-spoken first: only the most
 * frequent few are considered, and repeated use of one form is penalised so a verb shows several conjugations.
 * `ambiguous` holds forms shared with other words, whose matches are deprioritised; `pronoun` is set when the word
 * taught is itself a subject pronoun.
 */
export function findExamples(index: SentenceIndex, forms: string[], max: number, ambiguous: Set<string> = new Set(), pronoun = false): Example[] {
  const best = new Map<number, { score: number; form: string }>();
  [...new Set(forms.map((f) => f.toLowerCase()))].slice(0, FORMS_CONSIDERED).forEach((form, rank) => {
    for (const i of index.byToken.get(form) ?? []) {
      // Rarer forms rank slightly lower so the commonest ones get the best sentences.
      const score = everydayScore(index.stats[i], form, !!index.pairs[i].audio, ambiguous.has(form), pronoun) + rank;
      if (score < (best.get(i)?.score ?? Infinity)) best.set(i, { score, form });
    }
  });

  const picked: number[] = [];
  const pickedTokens: Set<string>[] = [];
  let questions = 0;
  const used = new Map<string, number>();
  const remaining = [...best.entries()];
  // Mostly the same words as a sentence already chosen ("¿Me puedo ir a casa?" twice): adds little.
  const repeats = (i: number) => {
    const tokens = new Set(index.stats[i].tokens);
    return pickedTokens.some((p) => [...tokens].filter((t) => p.has(t)).length >= tokens.size * 0.6);
  };
  while (picked.length < max && remaining.length) {
    let bestAt = 0;
    let bestScore = Infinity;
    remaining.forEach(([i, c], k) => {
      let s = c.score + (used.get(c.form) ?? 0) * SAME_FORM_PENALTY;
      if (questions >= MAX_QUESTIONS && index.stats[i].question) s += QUESTION_PENALTY;
      if (s >= bestScore) return; // can't win; skip the overlap check
      if (repeats(i)) s += REPEAT_PENALTY;
      if (s < bestScore) [bestAt, bestScore] = [k, s];
    });
    const [i, c] = remaining.splice(bestAt, 1)[0];
    picked.push(i);
    pickedTokens.push(new Set(index.stats[i].tokens));
    if (index.stats[i].question) questions++;
    used.set(c.form, (used.get(c.form) ?? 0) + 1);
  }
  return picked.map((i) => index.pairs[i]);
}
