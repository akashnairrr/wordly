"use client";

import { skipWord, unskipWord } from "@/lib/progress";
import { wordStatus, type WordStatus } from "@/lib/session";
import { useProgress } from "@/lib/useProgress";

export const STATUS_LABEL: Record<WordStatus, string> = { new: "Not started", studied: "Studied", practice: "Needs practice", skipped: "Skipped" };
export const STATUS_CHIP: Record<WordStatus, string> = { new: "chip", studied: "chip chip-studied", practice: "chip chip-practice", skipped: "chip chip-skipped" };

/** Where this word stands for the learner, with skip / un-skip. */
export function WordStatusBar({ lang, id }: { lang: string; id: string }) {
  const [progress, update] = useProgress(lang);
  if (!progress) return <div style={{ minHeight: 48 }} />;
  const status = wordStatus(id, progress);
  const stats = progress.learned[id];
  return (
    <div className="spread" style={{ flexWrap: "wrap", margin: "0 0 14px" }}>
      <span className="row">
        <span className={STATUS_CHIP[status]}>{STATUS_LABEL[status]}</span>
        {stats && (
          <span className="small num">
            {stats.correct} right · {stats.wrong} missed
          </span>
        )}
      </span>
      {status === "skipped" ? (
        <button type="button" className="btn btn-outline" onClick={() => update((p) => unskipWord(p, id))}>
          Add back to lessons
        </button>
      ) : status === "new" ? (
        <button type="button" className="btn btn-quiet" onClick={() => update((p) => skipWord(p, id))}>
          Skip this word
        </button>
      ) : null}
    </div>
  );
}
