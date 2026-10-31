import Chip, { type ChipProps } from "@mui/material/Chip"
import { C } from "@/theme"

export type Tone = "plain" | "studied" | "practice" | "skipped"

const TONES: Record<Tone, ChipProps> = {
  plain: { variant: "outlined" },
  skipped: { variant: "outlined", sx: { borderStyle: "dashed" } },
  studied: { sx: { bgcolor: C.tintSoft, color: C.venice } },
  practice: { sx: { bgcolor: C.dangerSoft, color: C.danger } },
}

interface ToneChipProps {
  tone?: Tone
  label: React.ReactNode
}

/** Small status label: plain outline, studied (pale blue), needs practice (pale red) or skipped (dashed). */
export function ToneChip({ tone = "plain", label }: ToneChipProps) {
  return <Chip size="small" label={label} {...TONES[tone]} />
}
