"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import { useState } from "react";
import { DIFFICULTY_INFO, difficulty, MAX_SIZE, MIN_SIZE, type Difficulty } from "@/lib/session";
import { C, displayFont, num } from "@/theme";

const NOTICE: Record<Difficulty, object> = {
  Easy: { bgcolor: C.tintSoft },
  Moderate: { bgcolor: C.warningSoft, color: C.warning },
  Hard: { bgcolor: C.dangerSoft, color: C.danger },
};

export function SessionSizePicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  // Set when the user moves up into a harder band, cleared when they move back down.
  const [warning, setWarning] = useState<Difficulty | null>(null);

  function change(n: number) {
    const level = difficulty(n);
    setWarning(level === "Easy" ? null : level);
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

      <Alert role="status" sx={{ mt: 1.75, ...NOTICE[warning ?? "Easy"  ] }}>
        {warning ? <b>{DIFFICULTY_INFO[warning].label}. </b> : null}
        {DIFFICULTY_INFO[warning ?? "Easy"].note}
      </Alert>
    </div>
  );
}
