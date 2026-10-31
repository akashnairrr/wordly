"use client";

import { useSpeech } from "./SpeechProvider";
import styles from "./SpeakButton.module.css";

/**
 * Plays `audio` (a native speaker's recording) when given, otherwise text-to-speech.
 * Second button plays slowly. Hidden only when there's neither a recording nor a voice.
 */
export function SpeakButton({ text, audio, size = "md" }: { text: string; audio?: string; size?: "sm" | "md" | "lg" }) {
  const { available, say } = useSpeech();
  if (!audio && available === false) return null;
  const who = audio ? "native speaker" : "synthetic voice";
  return (
    <span className={`${styles.group} ${styles[size]}`}>
      <button type="button" className={styles.btn} onClick={() => say(text, { audio })} aria-label={`Listen to “${text}” (${who})`} title={`Listen · ${who}`}>
        <SpeakerIcon />
      </button>
      <button
        type="button"
        className={styles.btn}
        onClick={() => say(text, { audio, slow: true })}
        aria-label={`Listen slowly to “${text}”`}
        title="Listen slowly"
      >
        <span className={styles.slow}>0.7×</span>
      </button>
      {audio && size !== "sm" && <span className={styles.human}>Native speaker</span>}
    </span>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}
