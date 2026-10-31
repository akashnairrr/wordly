"use client";

import { useEffect } from "react";
import { getLanguage, POS_LABELS } from "@/lib/languages";
import type { Word } from "@/lib/types";
import { ConjugationTable } from "./ConjugationTable";
import { ExampleList } from "./ExampleList";
import { FormsTable } from "./FormsTable";
import { SpeakButton } from "./SpeakButton";
import { useSpeech } from "./SpeechProvider";
import styles from "./WordCard.module.css";

const GENDER_LABEL = { m: "masculine", f: "feminine", mf: "masculine or feminine" } as const;

export function WordCard({
  word,
  lang,
  autoSpeak = false,
  badge,
}: {
  word: Word;
  lang: string;
  autoSpeak?: boolean;
  /** Small label above the word, e.g. "Review". */
  badge?: string;
}) {
  const language = getLanguage(lang);
  const { available, say } = useSpeech();
  const article = word.gender === "m" || word.gender === "f" ? language.articles[word.gender] : undefined;

  // Speak the word when a lesson card opens. Recordings play without waiting for voices to load.
  useEffect(() => {
    if (autoSpeak && (word.audio || available)) say(word.lemma, { audio: word.audio });
  }, [autoSpeak, available, say, word.lemma, word.audio]);

  return (
    <article className={styles.card}>
      <header className={styles.head}>
        <div>
          <div className={styles.meta}>
            {badge && <span className="chip chip-studied">{badge}</span>}
            <span>{POS_LABELS[word.pos]}</span>
            {word.gender && <span>· {GENDER_LABEL[word.gender]}</span>}
            <span className="num">· #{word.rank}</span>
          </div>
          <h2 className={styles.lemma} lang={lang}>
            {article && <span className={styles.article}>{article} </span>}
            {word.lemma}
          </h2>
          {word.ipa && <div className={styles.ipa}>{word.ipa}</div>}
        </div>
        <SpeakButton text={article ? `${article} ${word.lemma}` : word.lemma} audio={word.audio} size="lg" />
      </header>

      <section className={styles.section}>
        <h3 className={styles.title}>Meaning</h3>
        <ol className={styles.glosses}>
          {word.glosses.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ol>
      </section>

      {word.forms && (
        <section className={styles.section}>
          <h3 className={styles.title}>Forms</h3>
          <FormsTable word={word} lang={lang} />
        </section>
      )}

      {(word.conjugation || word.nonFinite) && (
        <section className={styles.section}>
          <h3 className={styles.title}>Conjugation</h3>
          <ConjugationTable word={word} lang={lang} />
        </section>
      )}

      <section className={styles.section}>
        <h3 className={styles.title}>In real sentences</h3>
        <ExampleList word={word} lang={lang} />
      </section>
      {available === false && (
        <p className="small">
          Words without a native recording use your browser&apos;s {language.name} voice, and none is installed. Add one in your system&apos;s speech settings.
        </p>
      )}
    </article>
  );
}
