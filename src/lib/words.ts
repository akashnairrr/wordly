import type { Word } from "./types"

export function tokenize(text: string): string[] {
  return text.toLowerCase().match(/\p{L}+/gu) ?? []
}

/** Every spelling of the word a learner might meet, lemma first. */
export function allForms(w: Pick<Word, "lemma" | "forms" | "conjugation" | "nonFinite" | "past">): string[] {
  const out = [
    w.lemma,
    ...Object.values(w.forms ?? {}),
    ...Object.values(w.nonFinite ?? {}),
    ...Object.values(w.past ?? {}),
  ]
  for (const tenses of Object.values(w.conjugation ?? {}))
    for (const row of Object.values(tenses ?? {})) out.push(...Object.values(row ?? {}))
  return [...new Set(out.filter(Boolean) as string[])]
}

export function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "")
}

/** One client-side page shows every word (10,000 pre-built pages would exceed GitHub Pages' 1 GB limit). */
export const wordHref = (lang: string, id: string) => `/${lang}/word/?id=${encodeURIComponent(id)}`
