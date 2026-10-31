"use client";

import Link from "next/link";
import { SessionSizePicker } from "@/components/SessionSizePicker";
import { getLanguage } from "@/lib/languages";
import { planLesson, reviewQueue } from "@/lib/session";
import { useIndex } from "@/lib/useIndex";
import { useProgress } from "@/lib/useProgress";
import styles from "./home.module.css";

export function HomeView({ lang }: { lang: string }) {
  const language = getLanguage(lang);
  const [progress, update] = useProgress(lang);
  const { index, error } = useIndex(lang);

  if (error) return <p className="empty">Could not load words: {error}</p>;
  if (!progress || !index)
    return (
      <div className={styles.loading} aria-busy>
        <div className="skeleton" style={{ minHeight: 260 }} />
        <div className="skeleton" />
      </div>
    );

  const learned = Object.values(progress.learned);
  const answers = learned.reduce((n, w) => n + w.correct + w.wrong, 0);
  const correct = learned.reduce((n, w) => n + w.correct, 0);
  const size = progress.settings.sessionSize;
  const { fresh, review } = planLesson(index, progress, size);
  const studied = reviewQueue(index, progress);
  const weak = reviewQueue(index, progress, true);

  return (
    <>
      <section className={`block block-accent ${styles.hero}`}>
        <p className={styles.greeting} lang={lang}>
          {language.greeting}
        </p>
        {fresh.length ? (
          <>
            <h1 className={styles.heroTitle}>
              {fresh.length} new {language.name} words are waiting.
            </h1>
            <p className={styles.heroText}>
              See each one in real sentences, hear a native speaker, then take a short quiz.
              {review.length > 0 && ` ${review.length} word${review.length > 1 ? "s" : ""} you've studied will come back too.`}
            </p>
            <Link href={`/${lang}/session/`} className="btn">
              Start lesson
            </Link>
          </>
        ) : (
          <>
            <h1 className={styles.heroTitle}>You&apos;ve studied every word on the list.</h1>
            <Link href={`/${lang}/session/?mode=review`} className="btn">
              Review studied words
            </Link>
          </>
        )}
      </section>

      <dl className="statline">
        <div>
          <dt>Words studied</dt>
          <dd className="display num">
            {learned.length}
            <span className={styles.of}>/{index.length}</span>
          </dd>
        </div>
        <div>
          <dt>Day streak</dt>
          <dd className="display num">{progress.streak}</dd>
        </div>
        <div>
          <dt>Quiz accuracy</dt>
          <dd className="display num">{answers ? `${Math.round((correct / answers) * 100)}%` : "–"}</dd>
        </div>
      </dl>

      <div className={styles.grid}>
        <section className="surface">
          <SessionSizePicker value={size} onChange={(n) => update((p) => ({ ...p, settings: { ...p.settings, sessionSize: n } }))} />
        </section>

        <section className={`block block-tint ${styles.review}`}>
          <h2 className={styles.reviewTitle}>Review</h2>
          {studied.length ? (
            <>
              <p className={styles.reviewText}>
                <b className="num">{studied.length}</b> studied · <b className="num">{weak.length}</b> need practice
              </p>
              <div className={styles.reviewActions}>
                <Link href={`/${lang}/session/?mode=review`} className="btn">
                  Review studied words
                </Link>
                {weak.length > 0 && (
                  <Link href={`/${lang}/session/?mode=review&filter=practice`} className={styles.reviewLink}>
                    Practise weak words only
                  </Link>
                )}
              </div>
            </>
          ) : (
            <p className={styles.reviewText}>Words you study come back here for revision, weakest first.</p>
          )}
        </section>
      </div>

      {fresh.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Next up</h2>
            <Link href={`/${lang}/words/`} className="small">
              All {index.length} words
            </Link>
          </div>
          <ul className={styles.upcoming}>
            {fresh.map((w) => (
              <li key={w.id}>
                <Link href={`/${lang}/words/${w.id}/`} className={styles.word}>
                  <b lang={lang}>{w.lemma}</b>
                  <span>{w.gloss}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
