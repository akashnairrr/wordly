import Chip, { type ChipProps } from "@mui/material/Chip";
import { C } from "@/theme";

export type Tone = "plain" | "studied" | "practice" | "skipped";

const TONES: Record<Tone, ChipProps> = {
  plain: { variant: "outlined" },
  skipped: { variant: "outlined", sx: { borderStyle: "dashed" } },
  studied: { sx: { bgcolor: C.tintSoft, color: C.venice } },
  practice: { sx: { bgcolor: C.dangerSoft, color: C.danger } },
};

/** Small status label: plain outline, studied (pale blue), needs practice (pale red) or skipped (dashed). */
export function ToneChip({ tone = "plain", label, sx }: { tone?: Tone; label: React.ReactNode; sx?: ChipProps["sx"] }) {
  const t = TONES[tone];
  return <Chip size="small" variant={t.variant} label={label} sx={[t.sx ?? {}, ...(Array.isArray(sx) ? sx : [sx ?? {}])] as ChipProps["sx"]} />;
}
