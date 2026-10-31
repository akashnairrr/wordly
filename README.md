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
pnpm format       # Prettier
pnpm check        # lint + format check + typecheck + tests (what CI runs)
```

## Contributing

`.github/workflows/ci.yml` runs `pnpm check` on every push to any branch. Files are kebab-case (`word-card.tsx`, hooks `use-*.ts`), component props are an `interface <Component>Props`, and PR titles follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `build:`, `chore:` …) since each PR lands as one squashed commit named after it. `main` is protected: changes land through a pull request with one approval, a green `check`, signed commits, and **squash and merge** only, so history stays linear (one commit per PR, titled after the PR). The repo owner can bypass.

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
src/hooks/            use-index, use-progress (React hooks over src/lib)
src/components/       word-card, conjugation-table, forms-table, example-list, quiz, session-size-picker, … (MUI)
src/theme.ts          design tokens: Merino / Rock Blue / Venice Blue palette, shared *Sx style objects
src/mui-theme.ts      MUI theme built from them: Fraunces + Jost, flat components
src/app/[lang]/       Today (home), session, words library + word pages, progress/settings (each route's *-view.tsx)
```

## Word data

`pnpm data --lang es` downloads into `data-raw/` (gitignored, about 110 MB) and regenerates `public/data/es/`:

1. **Frequency**: [FrequencyWords](https://github.com/hermitdave/FrequencyWords) (OpenSubtitles), so the ranking reflects spoken language.
2. **Dictionary**: [kaikki.org](https://kaikki.org/) Wiktionary extract: meanings, IPA, gender, forms, full conjugation tables. Each frequent spelling is mapped to its lemma (_tengo_ → _tener_). When several entries share a spelling, the one with the most real meanings wins (_de_ = preposition, not the letter).
3. **Sentences**: [Tatoeba](https://tatoeba.org/) pairs via [manythings.org](https://www.manythings.org/anki/), chosen to sound like everyday conversation: three to six words, built from the most common spoken words, translated close to word for word (checked against the word meanings), no spelled-out subject pronouns speakers would drop (_Tengo hambre_, not _Yo tengo hambre_), few film-drama exclamations, no names or numbers, a mix of questions and statements, native recording preferred. Spread across the word's most-spoken forms; matches through a spelling another word owns (_comer_ ← _como_) come last. Every other word in each sentence gets a short meaning (and its dictionary form if inflected), and common phrases (_por favor_, _de acuerdo_) are glossed as one unit, from a third Wiktionary pass; `SHORT_GLOSSES` in `overrides.ts` covers the commonest little words.
4. **Recordings**: [Lingua Libre](https://lingualibre.org/) native-speaker words (listed once from Wikimedia Commons and cached in `data-raw/<lang>/lingualibre.json`), Wiktionary audio, and Tatoeba's sentence recordings. Audio is linked, not copied, so `public/data` stays small.

Spot-check the top words after a run; fix misresolved ones in `scripts/build-data/overrides.ts` (e.g. `son: { lemma: "ser" }`).

## Adding a language

Spanish (`es`) and German (`de`) are built. For another language:

1. Add sources in `scripts/build-data/sources.ts` (FrequencyWords, kaikki, manythings and Lingua Libre all cover many languages).
2. Add a registry entry in `src/lib/languages.ts`: TTS locales, articles (with neuter if the language has it), person labels, tenses to show, pronouns speakers drop, and `capitalisedNouns` for languages like German.
3. Add the country's flag to `src/components/flag.tsx`.
4. `pnpm data --lang <code>`, then spot-check and add overrides and short glosses in `overrides.ts`.

Conjugation parsing in `normalize.ts` relies on Wiktionary's mood/tense/person tags, which are shared across languages. Variant filters cover Spanish (vos, -se subjunctive) and German (subordinate-clause order, Konjunktiv I, pluperfect, Futur II); compound tenses such as the German Perfekt are kept as two-word forms. Words are matched case-insensitively, so German nouns (Haus) are found from the lowercase frequency list.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` tests, builds and publishes the static export on every push to `main`, to `https://<user>.github.io/<repo>/`. It sets `NEXT_PUBLIC_BASE_PATH` to the repo path so links and data fetches work under that prefix.

One-time setup: repo **Settings → Pages → Source: GitHub Actions** (or `gh api -X POST repos/<user>/<repo>/pages -f build_type=workflow`). Pages is free for public repos.

To preview that build locally: `NEXT_PUBLIC_BASE_PATH=/wordly pnpm build`, then serve a folder containing `out/` renamed to `wordly/`.

## Licensing

Generated data derives from CC BY-SA sources (Wiktionary, FrequencyWords) and CC BY (Tatoeba); credits are on the in-app `/about` page.
