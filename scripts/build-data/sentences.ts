import { execFileSync } from "node:child_process";
import type { Example } from "../../src/lib/types";
import { tokenize } from "../../src/lib/words";

export interface SentenceIndex {
  pairs: Example[];
  byToken: Map<string, number[]>;
}

/**
 * Reads manythings "English<TAB>Target<TAB>attribution" lines from inside the zip. The attribution ends with the
 * target sentence's Tatoeba id ("… #2877272 (CM) & #4986655 (user)"), used to attach a human recording.
 */
export function loadSentences(zipPath: string, file: string, recordings: Map<string, string>): SentenceIndex {
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
  const byToken = new Map<string, number[]>();
  pairs.forEach((p, i) => {
    for (const t of new Set(tokenize(p.text))) {
      let list = byToken.get(t);
      if (!list) byToken.set(t, (list = []));
      list.push(i);
    }
  });
  return { pairs, byToken };
}

/**
 * Picks up to `max` sentences containing any of `forms`.
 * Prefers sentences with a human recording, then 4–10 words, and spreads picks across different forms so a verb
 * shows several conjugations.
 */
export function findExamples(index: SentenceIndex, forms: string[], max: number): Example[] {
  const words = (s: string) => tokenize(s).length;
  const score = (i: number) => {
    const n = words(index.pairs[i].text);
    return (n >= 4 && n <= 10 ? n : n + 20) + (index.pairs[i].audio ? 0 : 8);
  };
  const perForm = [...new Set(forms.map((f) => f.toLowerCase()))]
    .map((f) => (index.byToken.get(f) ?? []).slice().sort((a, b) => score(a) - score(b)))
    .filter((l) => l.length);

  const picked = new Set<number>();
  // Round-robin over forms: best sentence of each form first, then second-best, ...
  for (let round = 0; picked.size < max && perForm.some((l) => l.length > round); round++) {
    for (const list of perForm) {
      if (picked.size >= max) break;
      if (list[round] !== undefined) picked.add(list[round]);
    }
  }
  return [...picked].map((i) => index.pairs[i]);
}
