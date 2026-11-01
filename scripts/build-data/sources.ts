// Per-language dataset sources. Adding a language = add an entry here + in src/lib/languages.ts.

export interface Sources {
  /** FrequencyWords (OpenSubtitles 2018) "word count" list. */
  frequency: string
  /** kaikki.org Wiktionary extract, gzipped JSONL. */
  wiktionary: string
  /** manythings.org Tatoeba sentence pairs (zip containing `<file>`). */
  sentences: { url: string; file: string }
  /** Lingua Libre file-name prefix on Wikimedia Commons: "LL-<Wikidata language id>_(<ISO 639-3>)-". */
  lingualibre: string
}

/** How many lemmas to keep, by spoken frequency. */
export const TOP_N = 5000
export const MAX_EXAMPLES = 5

/** Tatoeba's list of sentences with human recordings (all languages). */
export const SENTENCE_AUDIO = "https://downloads.tatoeba.org/exports/sentences_with_audio.tar.bz2"

export const SOURCES: Record<string, Sources> = {
  it: {
    frequency: "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/it/it_50k.txt",
    wiktionary: "https://kaikki.org/dictionary/Italian/kaikki.org-dictionary-Italian.jsonl.gz",
    sentences: { url: "https://www.manythings.org/anki/ita-eng.zip", file: "ita.txt" },
    lingualibre: "LL-Q652_(ita)-",
  },
  // European Portuguese subtitles.
  pt: {
    frequency: "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/pt/pt_50k.txt",
    wiktionary: "https://kaikki.org/dictionary/Portuguese/kaikki.org-dictionary-Portuguese.jsonl.gz",
    sentences: { url: "https://www.manythings.org/anki/por-eng.zip", file: "por.txt" },
    lingualibre: "LL-Q5146_(por)-",
  },
  ru: {
    frequency: "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ru/ru_50k.txt",
    wiktionary: "https://kaikki.org/dictionary/Russian/kaikki.org-dictionary-Russian.jsonl.gz",
    sentences: { url: "https://www.manythings.org/anki/rus-eng.zip", file: "rus.txt" },
    lingualibre: "LL-Q7737_(rus)-",
  },
  de: {
    frequency: "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/de/de_50k.txt",
    wiktionary: "https://kaikki.org/dictionary/German/kaikki.org-dictionary-German.jsonl.gz",
    sentences: { url: "https://www.manythings.org/anki/deu-eng.zip", file: "deu.txt" },
    lingualibre: "LL-Q188_(deu)-",
  },
  es: {
    frequency: "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_50k.txt",
    wiktionary: "https://kaikki.org/dictionary/Spanish/kaikki.org-dictionary-Spanish.jsonl.gz",
    sentences: { url: "https://www.manythings.org/anki/spa-eng.zip", file: "spa.txt" },
    lingualibre: "LL-Q1321_(spa)-",
  },
}
