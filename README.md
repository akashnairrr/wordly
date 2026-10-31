# Wordly

Learn the most common words of a language **in context**: meaning, native-speaker pronunciation, conjugations, gendered/plural forms and real example sentences. Each lesson teaches 5–15 new words plus a few studied words that need another look, then quizzes you with multiple choice, listening, conjugation, article and fill-in-the-blank questions.

- **Words**: the full frequency list, showing which words you've studied, which need practice and which you skipped.
- **Review**: revisit studied words (weakest and least recently seen first), or only the weak ones.
- **Skip**: leave a word out while learning (it won't come back as new; add it back from its page). Quiz questions can't be skipped.
- **Audio**: native recordings for most words and sentences (Lingua Libre, Wiktionary, Tatoeba); the browser's most natural voice fills the gaps.

Starts with Spanish; built to add more languages. Static Next.js app with no backend. Progress lives in the browser's localStorage (export/import backup on the Progress page).

## Run

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # pipeline + quiz/session/progress logic
pnpm build        # static export to out/
```

## Project layout

```
scripts/build-data/   offline data pipeline (pnpm data)
  sources.ts          dataset URLs per language, TOP_N word count
  overrides.ts        hand fixes for frequent words the heuristics get wrong
  wiktionary.ts       streams the kaikki.org Wiktionary dump
  normalize.ts        Wiktionary entry → Word (glosses, IPA, gender, forms, conjugation)
  sentences.ts        Tatoeba example sentence matching
public/data/<lang>/   generated: index.json + words/<id>.json (committed)
src/lib/              types, language registry, quiz/session/progress logic, speech, data loading
src/components/       WordCard, ConjugationTable, FormsTable, ExampleList, Quiz, SessionSizePicker, …
src/app/[lang]/       Today (home), session, words library + word pages, progress/settings
```

## Word data

`pnpm data --lang es` downloads into `data-raw/` (gitignored, about 110 MB) and regenerates `public/data/es/`:

1. **Frequency**: [FrequencyWords](https://github.com/hermitdave/FrequencyWords) (OpenSubtitles), so the ranking reflects spoken language.
2. **Dictionary**: [kaikki.org](https://kaikki.org/) Wiktionary extract: meanings, IPA, gender, forms, full conjugation tables. Each frequent spelling is mapped to its lemma (*tengo* → *tener*). When several entries share a spelling, the one with the most real meanings wins (*de* = preposition, not the letter).
3. **Sentences**: [Tatoeba](https://tatoeba.org/) pairs via [manythings.org](https://www.manythings.org/anki/), matched by any form of the word and spread across forms, preferring sentences that have a human recording.
4. **Recordings**: [Lingua Libre](https://lingualibre.org/) native-speaker words (listed once from Wikimedia Commons and cached in `data-raw/<lang>/lingualibre.json`), Wiktionary audio, and Tatoeba's sentence recordings. Audio is linked, not copied, so `public/data` stays small.

Spot-check the top words after a run; fix misresolved ones in `scripts/build-data/overrides.ts` (e.g. `son: { lemma: "ser" }`).

## Adding a language

1. Add sources in `scripts/build-data/sources.ts` (FrequencyWords, kaikki, manythings and Lingua Libre all cover many languages).
2. Add a registry entry in `src/lib/languages.ts` (TTS locales, articles, person labels, tenses to show).
3. `pnpm data --lang <code>`, then spot-check and add overrides.

Conjugation parsing in `normalize.ts` relies on Wiktionary's mood/tense/person tags, which are shared across languages. The variant filters (vos, -se subjunctive) are Spanish-specific and harmless elsewhere.

## Deploy (GitHub Pages)

`pnpm build` writes a fully static site to `out/`. For a project page (`user.github.io/wordly`), build with `NEXT_PUBLIC_BASE_PATH=/wordly pnpm build`.

## Licensing

Generated data derives from CC BY-SA sources (Wiktionary, FrequencyWords) and CC BY (Tatoeba); credits are on the in-app `/about` page.
