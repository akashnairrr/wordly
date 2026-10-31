"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { STATUS_CHIP, STATUS_LABEL } from "@/components/WordStatusBar";
import { POS_LABELS } from "@/lib/languages";
import { wordStatus, type WordStatus } from "@/lib/session";
import type { Pos } from "@/lib/types";
import { useIndex } from "@/lib/useIndex";
import { useProgress } from "@/lib/useProgress";
import { stripAccents } from "@/lib/words";
import styles from "./words.module.css";

const PAGE = 100;

type StatusFilter = "all" | WordStatus;
const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "studied", label: "Studied" },
  { id: "practice", label: "Needs practice" },
  { id: "new", label: "Not started" },
  { id: "skipped", label: "Skipped" },
];
const POS_FILTERS: Pos[] = ["noun", "verb", "adj", "adv", "pron", "prep", "conj", "det", "intj"];


const fold = (s: string) => stripAccents(s.toLowerCase());

export function WordsView({ lang }: { lang: string }) {
  const [progress] = useProgress(lang);
  const { index, error } = useIndex(lang);
  const initial = useSearchParams().get("filter");
  const [status, setStatus] = useState<StatusFilter>(STATUS_FILTERS.find((f) => f.id === initial)?.id ?? "all");
  const [pos, setPos] = useState<Pos | "all">("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);

  if (error) return <p className="empty">Could not load words: {error}</p>;
  if (!index || !progress) return <div className="skeleton" style={{ marginTop: 24, minHeight: 480 }} />;

  const statuses = new Map(index.map((w) => [w.id, wordStatus(w.id, progress)]));
  const count = (s: WordStatus) => index.filter((w) => statuses.get(w.id) === s).length;
  const studiedCount = count("studied") + count("practice");
  const q = fold(query.trim());
  const list = index.filter(
    (w) =>
      (status === "all" || statuses.get(w.id) === status) &&
      (pos === "all" || w.pos === pos) &&
      (!q || fold(w.lemma).includes(q) || fold(w.gloss).includes(q)),
  );

  return (
    <>
      <header className={styles.head}>
        <h1 className={styles.title}>Common words</h1>
        <p className="muted" style={{ margin: "6px 0 0" }}>
          The {index.length} most spoken words, most frequent first.
        </p>
      </header>

      <section className={styles.summary}>
        <div className={styles.summaryText}>
          <span className="display num" style={{ fontSize: 34, color: "var(--accent)" }}>
            {studiedCount}
          </span>{" "}
          <span className="muted">of {index.length} studied</span>
          <div className="meter" style={{ marginTop: 10 }}>
            <i style={{ transform: `scaleX(${studiedCount / index.length})` }} />
          </div>
        </div>
        <div className="row">
          {studiedCount > 0 ? (
            <>
              <Link href={`/${lang}/session/?mode=review`} className="btn">
                Review studied
              </Link>
              {count("practice") > 0 && (
                <Link href={`/${lang}/session/?mode=review&filter=practice`} className="btn btn-outline">
                  Practise {count("practice")} weak
                </Link>
              )}
            </>
          ) : (
            <Link href={`/${lang}/session/`} className="btn">
              Start your first lesson
            </Link>
          )}
        </div>
      </section>

      <input
        className="input"
        type="search"
        placeholder="Search in either language"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShown(PAGE);
        }}
        aria-label="Search words"
        style={{ marginTop: 20 }}
      />
      <div className="segments" role="group" aria-label="Status" style={{ marginTop: 8 }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="segment"
            aria-pressed={status === f.id}
            onClick={() => {
              setStatus(f.id);
              setShown(PAGE);
            }}
          >
            {f.label} <span className="num muted">{f.id === "all" ? index.length : count(f.id)}</span>
          </button>
        ))}
      </div>
      <div className={styles.posRow}>
        <label htmlFor="pos" className="small">
          Part of speech
        </label>
        <select id="pos" className={styles.select} value={pos} onChange={(e) => setPos(e.target.value as Pos | "all")}>
          <option value="all">Any</option>
          {POS_FILTERS.map((p) => (
            <option key={p} value={p}>
              {POS_LABELS[p]}
            </option>
          ))}
        </select>
        <span className="small num" style={{ marginLeft: "auto" }}>
          {list.length} shown
        </span>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <p>No words match.</p>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setQuery("");
              setStatus("all");
              setPos("all");
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ol className={styles.list}>
          {list.slice(0, shown).map((w) => {
            const s = statuses.get(w.id)!;
            return (
              <li key={w.id}>
                <Link href={`/${lang}/words/${w.id}/`} className={styles.item}>
                  <span className={`num ${styles.rank}`}>{w.rank}</span>
                  <span className={styles.main}>
                    <b lang={lang}>{w.lemma}</b>
                    <span className={styles.gloss}>{w.gloss}</span>
                  </span>
                  <span className={styles.pos}>{POS_LABELS[w.pos]}</span>
                  {s !== "new" && <span className={STATUS_CHIP[s]}>{STATUS_LABEL[s]}</span>}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
      {shown < list.length && (
        <button type="button" className="btn btn-outline btn-block" style={{ marginTop: 16 }} onClick={() => setShown(shown + PAGE)}>
          Show more <span className="num">({list.length - shown} left)</span>
        </button>
      )}
    </>
  );
}
