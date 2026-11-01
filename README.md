# Wordly

Learn the most common words of a language **in context**: meaning, native-speaker pronunciation, conjugations, gendered/plural forms and real example sentences. Each lesson teaches 5–15 new words plus a few studied words that need another look, then quizzes you with multiple choice, listening, conjugation, article and fill-in-the-blank questions.

- **Levels**: the 5,000 most spoken words in five levels by frequency (Beginner 1–500, Elementary 501–1,000, Pre-intermediate 1,001–2,000, Intermediate 2,001–3,500, Upper-intermediate 3,501–5,000). Home shows your current level; Words and Progress show progress per level.
- **Words**: the full frequency list, showing which words you've studied, which need practice and which you skipped, filterable by level.
- **Review**: revisit studied words (weakest and least recently seen first), or only the weak ones.
- **Skip**: leave a word out while learning (it won't come back as new; add it back from its page). Quiz questions can't be skipped.
- **Audio**: native recordings for most words and sentences (Lingua Libre, Wiktionary, Tatoeba); the browser's most natural voice fills the gaps.

Spanish, German, Russian, Italian and Portuguese (European) so far; built to add more languages. Static Next.js app with no backend. Progress lives in the browser's localStorage (export/import backup on the Progress page).

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

`pnpm data --lang es` downloads into `data-raw/` (gitignored, about 110 MB per language) and regenerates `public/data/es/` with the top `TOP_N` (5,000) words:

1. **Frequency**: [FrequencyWords](https://github.com/hermitdave/FrequencyWords) (OpenSubtitles), so the ranking reflects spoken language.
2. **Dictionary**: [kaikki.org](https://kaikki.org/) Wiktionary extract: meanings, IPA, gender, forms, full conjugation tables. Each frequent spelling is mapped to its lemma (_tengo_ → _tener_). When several entries share a spelling, the one with the most real meanings wins (_de_ = preposition, not the letter).
3. **Sentences**: [Tatoeba](https://tatoeba.org/) pairs via [manythings.org](https://www.manythings.org/anki/), chosen to sound like everyday conversation: three to six words, built from the most common spoken words, translated close to word for word (checked against the word meanings), no spelled-out subject pronouns speakers would drop (_Tengo hambre_, not _Yo tengo hambre_), few film-drama exclamations, no names or numbers, a mix of questions and statements, native recording preferred. Spread across the word's most-spoken forms; matches through a spelling another word owns (_comer_ ← _como_) come last. Every other word in each sentence gets a short meaning (and its dictionary form if inflected), and common phrases (_por favor_, _de acuerdo_) are glossed as one unit, from a third Wiktionary pass; `SHORT_GLOSSES` in `overrides.ts` covers the commonest little words.
4. **Recordings**: [Lingua Libre](https://lingualibre.org/) native-speaker words (listed once from Wikimedia Commons and cached in `data-raw/<lang>/lingualibre.json`), Wiktionary audio, and Tatoeba's sentence recordings. Audio is linked, not copied, so `public/data` stays small.

Spot-check the words after a run; fix misresolved ones in `scripts/build-data/overrides.ts` (`son: { lemma: "ser" }`), give a word the right meaning (`derrota: { pos: "noun", glosses: ["defeat"] }`), or leave out names and English (`am: { skip: true }`). Gerunds always count as their verb (_nadando_ → _nadar_). Further down the list Wiktionary more often files a verb form under an unrelated noun (_pagué_ "cinchweed"), so those ranks need the closest look.

## Adding a language

Spanish (`es`), German (`de`), Russian (`ru`), Italian (`it`) and Portuguese (`pt`, European) are built. For another language:

1. Add sources in `scripts/build-data/sources.ts` (FrequencyWords, kaikki, manythings and Lingua Libre all cover many languages).
2. Add a registry entry in `src/lib/languages.ts`: TTS locales, articles (with neuter if the language has it; leave them out for languages without, and the gender quiz asks for the gender by name), person labels, tenses to show, pronouns speakers drop, `capitalisedNouns` for languages like German, and `pastLabels` for a past tense that goes by gender (Russian).
3. Add the country's flag to `src/components/flag.tsx`.
4. `pnpm data --lang <code>`, then spot-check and add overrides and short glosses in `overrides.ts`.

Conjugation parsing in `normalize.ts` relies on Wiktionary's mood/tense/person tags, which are shared across languages. Variant filters cover Spanish (vos, -se subjunctive) and German (subordinate-clause order, Konjunktiv I, pluperfect, Futur II); compound tenses such as the German Perfekt are kept as two-word forms. German words are matched case-insensitively, so nouns (Haus) are found from the lowercase frequency list.

Russian needs a few extras, all generic: stress marks (до́ма) and optional parts ((по)новее) are stripped from forms; the noun plural comes from "nominative plural" and adjective gender forms from the nominative row of the declension table; the past tense is stored by gender (`past`: делал, делала, делало, делали) instead of person; verbs record their aspect and partner (делать ↔ сделать); and word IDs transliterate Cyrillic (дом → `dom`, with `_` for the soft sign).

Italian adds three options: `articleBefore` writes the article the way it's spelled before the noun (l'albero, lo zio); `formsMarkStress` strips the stress marks Wiktionary puts on forms (fàccio → faccio, keeping real final accents like farò and written ones like è, più); and `compoundPerfect` builds the spoken past (ho fatto, siamo andati) from the auxiliary and participle, which the tables leave out. Wiktionary meanings that only describe a form ("compound of di' … and mi", "first-person plural present indicative of …") don't count as words. Where two words would share an ID (Portuguese avó / avô), the acute-accented one keeps it and the other spells its mark out (`avo_c`).

Portuguese is European: the word list comes from Portuguese subtitles, and `region` leaves out the Wiktionary meanings, forms and pronunciations tagged only for Brazil, so you get _autocarro_ and Lisbon IPA rather than _ônibus_ and Rio IPA.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` tests, builds and publishes the static export on every push to `main`, to `https://<user>.github.io/<repo>/`. It sets `NEXT_PUBLIC_BASE_PATH` to the repo path so links and data fetches work under that prefix.

One-time setup: repo **Settings → Pages → Source: GitHub Actions** (or `gh api -X POST repos/<user>/<repo>/pages -f build_type=workflow`). Pages is free for public repos.

To preview that build locally: `NEXT_PUBLIC_BASE_PATH=/wordly pnpm build`, then serve a folder containing `out/` renamed to `wordly/`.

## Licensing

Generated data derives from CC BY-SA sources (Wiktionary, FrequencyWords) and CC BY (Tatoeba); credits are on the in-app `/about` page.
