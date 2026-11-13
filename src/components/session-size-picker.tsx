"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Slider from "@mui/material/Slider"
import { DIFFICULTY_NOTE, difficulty, MAX_SIZE, MIN_SIZE, type Difficulty } from "@/lib/session"
import { C, displayFontSx, numSx } from "@/theme"

const NOTICE: Record<Difficulty, object> = {
  Easy: { bgcolor: C.tintSoft },
  Moderate: { bgcolor: C.warningSoft, color: C.warning },
  Hard: { bgcolor: C.dangerSoft, color: C.danger },
}

interface SessionSizePickerProps {
  value: number
  onChange: (n: number) => void
}

export function SessionSizePicker({ value, onChange }: SessionSizePickerProps) {
  const level = difficulty(value)
  return (
    <div>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1.5 }}>
        <Box component="span" id="session-size" sx={{ fontSize: 14, fontWeight: 600, color: C.muted }}>
          New words per lesson
        </Box>
        <Box component="span" sx={{ ...displayFontSx, ...numSx, fontSize: 36, lineHeight: 1, color: C.venice }}>
          {value}
        </Box>
      </Box>
      <Slider
        aria-labelledby="session-size"
        min={MIN_SIZE}
        max={MAX_SIZE}
        step={1}
        value={value}
        onChange={(_, n) => onChange(n as number)}
        getAriaValueText={(n) => `${n} words, ${difficulty(n)}`}
        sx={{ mt: 1, mb: 0.25 }}
      />

      <Alert role="status" sx={{ mt: 1.75, ...NOTICE[level] }}>
        {level !== "Easy" && <b>{level}. </b>}
        {DIFFICULTY_NOTE[level]}
      </Alert>
    </div>
  )
}
