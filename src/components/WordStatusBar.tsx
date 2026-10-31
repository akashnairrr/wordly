"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { skipWord, unskipWord } from "@/lib/progress";
import { wordStatus, type WordStatus } from "@/lib/session";
import { useProgress } from "@/lib/useProgress";
import { num } from "@/theme";
import { ToneChip, type Tone } from "./ToneChip";

export const STATUS_LABEL: Record<WordStatus, string> = { new: "Not started", studied: "Studied", practice: "Needs practice", skipped: "Skipped" };
export const STATUS_TONE: Record<WordStatus, Tone> = { new: "plain", studied: "studied", practice: "practice", skipped: "skipped" };

/** Where this word stands for the learner, with skip / un-skip. */
export function WordStatusBar({ lang, id }: { lang: string; id: string }) {
  const [progress, update] = useProgress(lang);
  if (!progress) return <Box sx={{ minHeight: 48 }} />;
  const status = wordStatus(id, progress);
  const stats = progress.learned[id];
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 1.5, mb: 1.75 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <ToneChip tone={STATUS_TONE[status]} label={STATUS_LABEL[status]} />
        {stats && (
          <Typography variant="body2" sx={num}>
            {stats.correct} right · {stats.wrong} missed
          </Typography>
        )}
      </Box>
      {status === "skipped" ? (
        <Button variant="outlined" onClick={() => update((p) => unskipWord(p, id))}>
          Add back to lessons
        </Button>
      ) : status === "new" ? (
        <Button variant="text" onClick={() => update((p) => skipWord(p, id))}>
          Skip this word
        </Button>
      ) : null}
    </Box>
  );
}
