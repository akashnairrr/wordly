"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Quiz, type QuizResult } from "@/components/Quiz";
import { useSpeech } from "@/components/SpeechProvider";
import { WordCard } from "@/components/WordCard";
import { fetchWord, fetchWords } from "@/lib/data";
import { getLanguage } from "@/lib/languages";
import { recordSession, skipWord } from "@/lib/progress";
import { buildQuiz, type QuizQuestion } from "@/lib/quiz";
import { pickNewWords, planLesson, reviewQueue } from "@/lib/session";
import type { Word } from "@/lib/types";
import { useIndex } from "@/lib/useIndex";
import { useProgress } from "@/lib/useProgress";
import styles from "./session.module.css";

interface Item {
  word: Word;
  /** Already studied: shown again for revision. */
  review: boolean;
}

type Phase = { name: "learn"; card: number } | { name: "quiz"; questions: QuizQuestion[] } | { name: "results"; results: QuizResult[] };

/** Remounts a fresh session whenever the URL (lesson vs review) changes or the learner starts another round. */
export function SessionView({ lang }: { lang: string }) {
  const params = useSearchParams();
  const [round, setRound] = useState(0);
  return (
    <Session
      key={`${params.toString()}#${round}`}
      lang={lang}
      mode={params.get("mode") === "review" ? "review" : "lesson"}
      onlyPractice={params.get("filter") === "practice"}
      onRestart={() => setRound((r) => r + 1)}
    />
  );
}

function Session({ lang, mode, onlyPractice, onRestart }: { lang: string; mode: "lesson" | "review"; onlyPractice: boolean; onRestart: () => void }) {
  const language = getLanguage(lang);
  const [progress, update] = useProgress(lang);
  const { index, error: indexError } = useIndex(lang);
  const { available } = useSpeech();
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ name: "learn", card: 0 });
  const [notice, setNotice] = useState<string | null>(null);
  const started = useRef(false);

  // Pick the words once; recording results updates progress and must not reshuffle them.
  useEffect(() => {
    if (!progress || !index || started.current) return;
    started.current = true;
    const size = progress.settings.sessionSize;
    const picks =
      mode === "review"
        ? reviewQueue(index, progress, onlyPractice)
            .slice(0, size)
            .map((w) => ({ id: w.id, review: true }))
        : (() => {
            const plan = planLesson(index, progress, size);
            return [...plan.fresh.map((w) => ({ id: w.id, review: false })), ...plan.review.map((w) => ({ id: w.id, review: true }))];
          })();
    fetchWords(
      lang,
      picks.map((p) => p.id),
    ).then(
      (words) => setItems(words.map((word, i) => ({ word, review: picks[i].review }))),
      (e: Error) => setError(e.message),
    );
  }, [progress, index, lang, mode, onlyPractice]);

  if (error || indexError) return <p className="empty">Could not load words: {error ?? indexError}</p>;
  if (!items || !progress || !index) return <div className="skeleton" style={{ marginTop: 24, minHeight: 420 }} />;

  if (!items.length)
    return (
      <div className="empty">
        <h1 style={{ fontSize: 32, marginBottom: 12 }}>{mode === "review" ? "Nothing to review yet" : "You've covered every word"}</h1>
        <p>{mode === "review" ? "Finish a lesson first; studied words show up here." : "Revisit what you've learned instead."}</p>
        <Link href={mode === "review" ? `/${lang}/session/` : `/${lang}/session/?mode=review`} className="btn">
          {mode === "review" ? "Start a lesson" : "Review studied words"}
        </Link>
      </div>
    );

  const title = mode === "review" ? (onlyPractice ? "Practice weak words" : "Review") : "Lesson";

  if (phase.name === "learn") {
    const card = Math.min(phase.card, items.length - 1);
    const item = items[card];
    const last = card === items.length - 1;
    const counts = mode === "lesson" ? `${items.filter((i) => !i.review).length} new · ${items.filter((i) => i.review).length} review` : `${items.length} words`;

    async function skip() {
      const skipped = item.word;
      let replacement: Item | undefined;
      if (!item.review) {
        // Skipped new words never come back as new; pull in the next word so the lesson keeps its size.
        update((p) => skipWord(p, skipped.id));
        const next = pickNewWords(index!, skipWord(progress!, skipped.id), 1, new Set(items!.map((i) => i.word.id)))[0];
        if (next) replacement = { word: await fetchWord(lang, next.id), review: false };
      }
      const rest = items!.filter((i) => i !== item);
      const nextItems = replacement ? [...rest, replacement] : rest;
      setItems(nextItems);
      // The following word slides into this position.
      setPhase({ name: "learn", card: Math.max(0, Math.min(card, nextItems.length - 1)) });
      setNotice(
        item.review
          ? `Skipped “${skipped.lemma}” for this session.`
          : `Skipped “${skipped.lemma}”. It won't appear in lessons; bring it back from Words.`,
      );
    }

    return (
      <>
        <div className={styles.top}>
          <div>
            <h1 className={styles.title}>{title}</h1>
            <span className="small">{counts}</span>
          </div>
          <span className="small num">
            {card + 1} / {items.length}
          </span>
        </div>
        <div className="meter" style={{ marginBottom: 18 }}>
          <i style={{ transform: `scaleX(${(card + 1) / items.length})` }} />
        </div>
        {notice && (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        )}
        <WordCard key={item.word.id} word={item.word} lang={lang} autoSpeak badge={item.review ? "Review" : undefined} />
        <div className="sticky-actions">
          <button type="button" className="btn btn-outline" disabled={card === 0} onClick={() => setPhase({ name: "learn", card: card - 1 })} aria-label="Previous word">
            ←
          </button>
          <button type="button" className="btn btn-quiet" onClick={skip}>
            Skip word
          </button>
          <button
            type="button"
            className="btn"
            style={{ flex: 1 }}
            onClick={() => {
              setNotice(null);
              if (last) setPhase({ name: "quiz", questions: buildQuiz(items.map((i) => i.word), index, language, { speech: available === true }) });
              else setPhase({ name: "learn", card: card + 1 });
            }}
          >
            {last ? "Start quiz" : "Next word"}
          </button>
        </div>
      </>
    );
  }

  if (phase.name === "quiz") {
    return (
      <>
        <div className={styles.top}>
          <h1 className={styles.title}>Quiz</h1>
        </div>
        <Quiz
          questions={phase.questions}
          lang={lang}
          onDone={(results) => {
            update((p) => recordSession(p, results.map((r) => ({ wordId: r.question.wordId, correct: r.grade !== "wrong" })), mode));
            setPhase({ name: "results", results });
          }}
        />
      </>
    );
  }

  const { results } = phase;
  const score = results.filter((r) => r.grade !== "wrong").length;
  const missed = items.filter((i) => results.some((r) => r.question.wordId === i.word.id && r.grade === "wrong"));
  return (
    <>
      <section className={`block block-accent ${styles.score}`}>
        <span className="label" style={{ color: "inherit" }}>
          {title} complete
        </span>
        <div className={`display num ${styles.big}`}>
          {score}/{results.length}
        </div>
        <p style={{ margin: 0 }}>{missed.length === 0 ? "Every answer right." : `${missed.length} word${missed.length > 1 ? "s" : ""} to practise again.`}</p>
      </section>
      <ul className={styles.results}>
        {items.map(({ word, review }) => {
          const wrong = results.filter((r) => r.question.wordId === word.id && r.grade === "wrong").length;
          return (
            <li key={word.id}>
              <Link href={`/${lang}/words/${word.id}/`} className={styles.result}>
                <span>
                  <b lang={lang}>{word.lemma}</b> <span className="muted">{word.glosses[0]}</span>
                </span>
                <span className="row">
                  {review && <span className="chip">review</span>}
                  <span className={wrong ? "chip chip-practice" : "chip chip-studied"}>{wrong ? `${wrong} missed` : "✓"}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="row" style={{ marginTop: 20 }}>
        {missed.length > 0 && (
          <Link href={`/${lang}/session/?mode=review&filter=practice`} className="btn btn-outline" onClick={onRestart}>
            Practise missed words
          </Link>
        )}
        <button
          type="button"
          className="btn"
          style={{ flex: 1 }}
          onClick={onRestart}
        >
          {mode === "review" ? "Review more" : "Next lesson"}
        </button>
      </div>
    </>
  );
}
