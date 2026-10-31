"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useSpeech } from "@/components/SpeechProvider";
import { getLanguage, POS_LABELS } from "@/lib/languages";
import { emptyProgress, parseBackup } from "@/lib/progress";
import { isNaturalVoice } from "@/lib/speech";
import type { Pos } from "@/lib/types";
import { useIndex } from "@/lib/useIndex";
import { useProgress } from "@/lib/useProgress";
import styles from "./progress.module.css";

const SPEEDS = [
  { rate: 0.8, label: "Slower" },
  { rate: 0.95, label: "Natural" },
  { rate: 1.1, label: "Faster" },
];

export function ProgressView({ lang }: { lang: string }) {
  const language = getLanguage(lang);
  const [progress, update] = useProgress(lang);
  const { index } = useIndex(lang);
  const { voices, voice, available, say } = useSpeech();
  const [message, setMessage] = useState<{ text: string; bad?: boolean } | null>(null);

  if (!progress) return <div className="skeleton" style={{ marginTop: 24, minHeight: 480 }} />;

  const learnedIds = Object.keys(progress.learned);
  const posOf = new Map(index?.map((w) => [w.id, w.pos]));
  const byPos = learnedIds.reduce<Partial<Record<Pos, number>>>((acc, id) => {
    const pos = posOf.get(id);
    if (pos) acc[pos] = (acc[pos] ?? 0) + 1;
    return acc;
  }, {});
  const total = index?.length ?? 0;
  const hasNatural = voices.some(isNaturalVoice);

  function exportBackup() {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `wordly-${lang}-backup.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importBackup(file: File) {
    file.text().then(
      (text) => {
        try {
          const p = parseBackup(text);
          update(() => p);
          setMessage({ text: "Backup imported." });
        } catch {
          setMessage({ text: "That file isn't a Wordly backup.", bad: true });
        }
      },
      () => setMessage({ text: "Could not read that file.", bad: true }),
    );
  }

  return (
    <>
      <h1 className={styles.title}>Progress</h1>

      <dl className="statline">
        <div>
          <dt>Words studied</dt>
          <dd className="display num">{learnedIds.length}</dd>
        </div>
        <div>
          <dt>Sessions</dt>
          <dd className="display num">{progress.history.length}</dd>
        </div>
        <div>
          <dt>Day streak</dt>
          <dd className="display num">{progress.streak}</dd>
        </div>
      </dl>
      {total > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="meter">
            <i style={{ transform: `scaleX(${learnedIds.length / total})` }} />
          </div>
          <p className="small num">
            {learnedIds.length} of the {total} most common {language.name} words · {Object.keys(progress.skipped).length} skipped
          </p>
        </div>
      )}
      {Object.keys(byPos).length > 0 && (
        <div className="row">
          {Object.entries(byPos).map(([pos, n]) => (
            <span key={pos} className="chip num">
              {POS_LABELS[pos as Pos]} {n}
            </span>
          ))}
        </div>
      )}

      <section className="section">
        <div className="section-head">
          <h2>History</h2>
        </div>
        {progress.history.length === 0 ? (
          <div className="empty surface">
            <p>Finished lessons and reviews appear here.</p>
            <Link href={`/${lang}/session/`} className="btn">
              Start a lesson
            </Link>
          </div>
        ) : (
          <ul className={styles.history}>
            {progress.history.slice(0, 30).map((h) => (
              <li key={h.date}>
                <span>
                  <b>{h.kind === "review" ? "Review" : "Lesson"}</b>{" "}
                  <span className="small">
                    {new Date(h.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })} · {h.words.length} words
                  </span>
                </span>
                <span className="num">
                  {h.score}/{h.total}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Pronunciation</h2>
        </div>
        <div className="surface stack">
          <p style={{ margin: 0 }}>
            Most words and sentences play <b>recordings of native speakers</b>. A synthetic voice is used only where no recording exists.
          </p>
          {available === false ? (
            <p className="small">
              This browser has no {language.name} voice installed, so those few will be silent. Add one in your system speech settings, then reload.
            </p>
          ) : (
            <>
              <div>
                <label className="label" htmlFor="voice">
                  Fallback voice
                </label>
                <select
                  id="voice"
                  className="input"
                  style={{ marginTop: 6 }}
                  value={voice?.voiceURI ?? ""}
                  onChange={(e) => update((p) => ({ ...p, settings: { ...p.settings, voiceURI: e.target.value } }))}
                >
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang}){isNaturalVoice(v) ? " · natural" : ""}
                    </option>
                  ))}
                </select>
                {!hasNatural && (
                  <p className="small">
                    Only basic voices are available. For a more human sound: macOS → System Settings → Accessibility → Spoken Content → System voice → Manage
                    Voices → {language.name}, download an “Enhanced” or “Premium” voice. Microsoft Edge and Chrome also include natural online voices.
                  </p>
                )}
              </div>
              <div>
                <span className="label">Speed</span>
                <div className="segments" role="group" aria-label="Speed">
                  {SPEEDS.map((s) => (
                    <button
                      key={s.rate}
                      type="button"
                      className="segment"
                      aria-pressed={progress.settings.rate === s.rate}
                      onClick={() => update((p) => ({ ...p, settings: { ...p.settings, rate: s.rate } }))}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" className="btn btn-outline" onClick={() => say(language.sample)}>
                Test fallback voice
              </button>
            </>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Backup</h2>
        </div>
        <div className="surface stack">
          <p className="muted" style={{ margin: 0 }}>
            Progress lives only in this browser. Clearing site data erases it, so export a backup now and then.
          </p>
          <div className="row">
            <button type="button" className="btn" onClick={exportBackup}>
              Export backup
            </button>
            <label className="btn btn-outline">
              Import backup
              <input
                type="file"
                accept="application/json"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importBackup(f);
                  e.target.value = "";
                }}
              />
            </label>
            <ConfirmDialog
              trigger="Reset progress"
              title={`Reset ${language.name} progress?`}
              body="This deletes every studied word, skip and session on this device. It can't be undone unless you've exported a backup."
              confirmLabel="Delete progress"
              onConfirm={() => {
                update(() => emptyProgress());
                setMessage({ text: "Progress reset." });
              }}
            />
          </div>
          {message && (
            <p role="status" className={message.bad ? styles.bad : "small"} style={{ margin: 0 }}>
              {message.text}
            </p>
          )}
        </div>
      </section>

      <p className="small" style={{ marginTop: 32 }}>
        <Link href="/about/">Data sources & credits</Link>
      </p>
    </>
  );
}
