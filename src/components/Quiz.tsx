"use client";

import { useEffect, useState } from "react";
import { grade, QUESTION_TITLES, type Grade, type QuizQuestion } from "@/lib/quiz";
import { SpeakButton } from "./SpeakButton";
import { useSpeech } from "./SpeechProvider";
import styles from "./Quiz.module.css";

export interface QuizResult {
  question: QuizQuestion;
  given: string;
  grade: Grade;
}

/** Runs the questions in order. There's deliberately no skip: every question must be answered. */
export function Quiz({ questions, lang, onDone }: { questions: QuizQuestion[]; lang: string; onDone: (results: QuizResult[]) => void }) {
  const { say } = useSpeech();
  const [i, setI] = useState(0);
  const [given, setGiven] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [results, setResults] = useState<QuizResult[]>([]);
  const q = questions[i];
  const result = given === null ? null : grade(q, given);
  const play = (slow = false) => q.audio && say(q.audio, { audio: q.audioUrl, slow });

  // Listening questions play as soon as they appear.
  useEffect(() => {
    if (q?.audio) say(q.audio, { audio: q.audioUrl });
  }, [q, say]);

  function answer(value: string) {
    if (given !== null) return;
    // Hear the right answer straight away, whether or not it was chosen, as extra listening practice.
    say(q.reveal.text, { audio: q.reveal.audio });
    setGiven(value);
    setResults((r) => [...r, { question: q, given: value, grade: grade(q, value) }]);
  }

  function next() {
    if (i + 1 >= questions.length) return onDone(results);
    setI(i + 1);
    setGiven(null);
    setTyped("");
  }

  return (
    <section className={styles.quiz} aria-label="Quiz">
      <div className={styles.steps} aria-hidden>
        {questions.map((_, n) => (
          <i key={n} className={n < i || (n === i && given !== null) ? styles.done : n === i ? styles.current : undefined} />
        ))}
      </div>
      <div className="spread">
        <span className="label">{QUESTION_TITLES[q.kind]}</span>
        <span className="small num">
          {i + 1} of {questions.length}
        </span>
      </div>

      {q.prompt && (
        <div className={q.kind === "cloze" ? styles.sentence : styles.prompt} lang={q.kind === "meaning" || q.kind === "cloze" || q.kind === "conjugation" || q.kind === "gender" || q.kind === "gendered-form" ? lang : undefined}>
          {q.prompt}
        </div>
      )}
      {q.hint && (q.kind !== "listen-type" || given !== null) && <p className={styles.hint}>{q.hint}</p>}

      {q.audio && (
        <div className={styles.listen}>
          <button type="button" className={styles.play} onClick={() => play()} aria-label="Play the word again">
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <button type="button" className="btn btn-outline" onClick={() => play(true)}>
            Slower
          </button>
        </div>
      )}

      {q.options ? (
        <div className={styles.options}>
          {q.options.map((o) => {
            const state = given === null ? "" : o === q.answer ? styles.right : o === given ? styles.wrong : styles.dim;
            return (
              <button key={o} type="button" className={`${styles.option} ${state}`} onClick={() => answer(o)} disabled={given !== null}>
                {o}
              </button>
            );
          })}
        </div>
      ) : (
        <form
          className={styles.typeRow}
          onSubmit={(e) => {
            e.preventDefault();
            if (typed.trim()) answer(typed);
          }}
        >
          <input
            className="input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type what you hear"
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled={given !== null}
            aria-label="Your answer"
            lang={lang}
          />
          <button className="btn" disabled={given !== null || !typed.trim()}>
            Check
          </button>
        </form>
      )}

      {result && (
        <div className={`${styles.feedback} ${result === "wrong" ? styles.bad : styles.good}`} role="status">
          <span className={styles.feedbackText}>
            <SpeakButton text={q.reveal.text} audio={q.reveal.audio} size="sm" />
            <span>
              {result === "correct" && "Correct!"}
              {result === "accent" && (
                <>
                  Correct. Mind the accent: <b lang={lang}>{q.answer}</b>
                </>
              )}
              {result === "wrong" && (
                <>
                  The answer is <b lang={lang}>{q.answer}</b>
                </>
              )}
            </span>
          </span>
          <button type="button" className="btn" onClick={next} autoFocus>
            {i + 1 >= questions.length ? "See results" : "Next"}
          </button>
        </div>
      )}
    </section>
  );
}
