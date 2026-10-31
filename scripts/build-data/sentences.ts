import { execFileSync } from "node:child_process";
import type { Example } from "../../src/lib/types";
import { tokenize } from "../../src/lib/words";

/** What makes a sentence sound like everyday speech, measured once per sentence at load time. */
interface SentenceStats {
  tokens: string[];
  /** Tokens outside the common spoken vocabulary. */
  rare: string[];
  /** Capitalised words mid-sentence: almost always names ("Tom", "María"). */
  names: number;
  digits: boolean;
  /** Questions and exclamations: the shape of conversation. */
  talk: boolean;
  question: boolean;
  /** Addresses or talks about the speaker/listener (yo, tú, usted…). */
  personal: boolean;
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
  /** Personal pronouns of the language (from the language registry). */
  personal: Set<string>;
}

const NO_EVERYDAY: Everyday = { rank: new Map(), commonCutoff: Infinity, personal: new Set() };

function measure(text: string, everyday: Everyday): SentenceStats {
  const tokens = tokenize(text);
  return {
    tokens,
    rare: tokens.filter((t) => (everyday.rank.get(t) ?? Infinity) >= everyday.commonCutoff),
    names: text.match(/(?<=\s)\p{Lu}\p{Ll}+/gu)?.length ?? 0,
    digits: /\d/.test(text),
    talk: /[¿?¡!]/.test(text),
    question: /[¿?]/.test(text),
    personal: tokens.some((t) => everyday.personal.has(t)),
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
  const stats = pairs.map((p) => measure(p.text, everyday));
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

/** Lower is better: short, all-common-word, conversational sentences with a native recording win. */
function everydayScore(s: SentenceStats, form: string, audio: boolean, ambiguous: boolean): number {
  const n = s.tokens.length;
  const rare = s.rare.filter((t) => t !== form).length;
  return (
    rare * 6 +
    s.names * 12 +
    (s.digits ? 6 : 0) +
    (n < 3 ? 4 : n > 8 ? (n - 8) * 2 : 0) +
    (audio ? 0 : 4) +
    // Matched only through a spelling another word owns (comer ← "como"): probably the other word.
    (ambiguous ? 30 : 0) -
    (s.talk ? 2 : 0) -
    (s.personal ? 2 : 0)
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
 * `ambiguous` holds forms shared with other words, whose matches are deprioritised.
 */
export function findExamples(index: SentenceIndex, forms: string[], max: number, ambiguous: Set<string> = new Set()): Example[] {
  const best = new Map<number, { score: number; form: string }>();
  [...new Set(forms.map((f) => f.toLowerCase()))].slice(0, FORMS_CONSIDERED).forEach((form, rank) => {
    for (const i of index.byToken.get(form) ?? []) {
      // Rarer forms rank slightly lower so the commonest ones get the best sentences.
      const score = everydayScore(index.stats[i], form, !!index.pairs[i].audio, ambiguous.has(form)) + rank;
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
