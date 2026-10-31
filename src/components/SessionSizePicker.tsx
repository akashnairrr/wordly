"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import { useState } from "react";
import { DIFFICULTY_INFO, difficulty, MAX_SIZE, MIN_SIZE, type Difficulty } from "@/lib/session";
import { C, displayFont, num } from "@/theme";

const ORDER: Difficulty[] = ["Easy", "Moderate", "Hard"];
const NOTICE: Record<Difficulty, object> = {
  Easy: { bgcolor: C.tintSoft },
  Moderate: { bgcolor: C.warningSoft, color: C.warning },
  Hard: { bgcolor: C.dangerSoft, color: C.danger },
};

export function SessionSizePicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const level = difficulty(value);
  // Set only when the user moves *up* into a harder band; cleared when they come back to easy.
  const [warning, setWarning] = useState<Difficulty | null>(null);

  function change(n: number) {
    const next = difficulty(n);
    if (ORDER.indexOf(next) > ORDER.indexOf(level)) setWarning(next);
    else if (next === "Easy") setWarning(null);
    onChange(n);
  }

  return (
    <div>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1.5 }}>
        <Box component="span" id="session-size" sx={{ fontSize: 14, fontWeight: 600, color: C.muted }}>
          New words per lesson
        </Box>
        <Box component="span" sx={{ ...displayFont, ...num, fontSize: 36, lineHeight: 1, color: C.venice }}>
          {value}
        </Box>
      </Box>
      <Slider
        aria-labelledby="session-size"
        min={MIN_SIZE}
        max={MAX_SIZE}
        step={1}
        value={value}
        onChange={(_, n) => change(n as number)}
        getAriaValueText={(n) => `${n} words, ${DIFFICULTY_INFO[difficulty(n)].label}`}
        sx={{ mt: 1, mb: 0.25 }}
      />

      <Alert role="status" sx={{ mt: 1.75, ...NOTICE[warning ?? level] }}>
        {warning ? <b>{DIFFICULTY_INFO[warning].label}. </b> : null}
        {DIFFICULTY_INFO[warning ?? level].note}
      </Alert>
    </div>
  );
}
