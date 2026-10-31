"use client";

import { useState } from "react";
import { DIFFICULTY_INFO, difficulty, MAX_SIZE, MIN_SIZE, type Difficulty } from "@/lib/session";
import styles from "./SessionSizePicker.module.css";

const ORDER: Difficulty[] = ["easy", "moderate", "hard"];

export function SessionSizePicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const level = difficulty(value);
  // Set only when the user moves *up* into a harder band; cleared when they come back to easy.
  const [warning, setWarning] = useState<Difficulty | null>(null);

  function change(n: number) {
    const next = difficulty(n);
    if (ORDER.indexOf(next) > ORDER.indexOf(level)) setWarning(next);
    else if (next === "easy") setWarning(null);
    onChange(n);
  }

  return (
    <div>
      <div className={styles.head}>
        <label htmlFor="session-size" className="label">
          New words per lesson
        </label>
        <span className={styles.count}>{value}</span>
      </div>
      <input
        id="session-size"
        className={styles.range}
        type="range"
        min={MIN_SIZE}
        max={MAX_SIZE}
        value={value}
        onChange={(e) => change(Number(e.target.value))}
        aria-valuetext={`${value} words, ${DIFFICULTY_INFO[level].label}`}
      />
      <div className={styles.scale} aria-hidden>
        {ORDER.map((d, n) => (
          <span key={d} className={d === level ? styles.on : undefined}>
            {["5–8", "9–12", "13–15"][n]} {DIFFICULTY_INFO[d].label.toLowerCase()}
          </span>
        ))}
      </div>
      <p role="status" className={`${styles.notice} ${styles[warning ?? level]}`}>
        {warning ? <b>Getting harder: {DIFFICULTY_INFO[warning].label.toLowerCase()}. </b> : null}
        {DIFFICULTY_INFO[warning ?? level].note}
      </p>
    </div>
  );
}
