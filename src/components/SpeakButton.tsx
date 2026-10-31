"use client";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import SvgIcon from "@mui/material/SvgIcon";
import { C, num } from "@/theme";
import { useSpeech } from "./SpeechProvider";

const SIZES = {
  sm: { box: 30, icon: 14, slow: 11 },
  md: { box: 36, icon: 16, slow: 12 },
  lg: { box: 48, icon: 22, slow: 14 },
} as const;

/**
 * Plays `audio` (a native speaker's recording) when given, otherwise text-to-speech.
 * Second button plays slowly. Hidden only when there's neither a recording nor a voice.
 */
export function SpeakButton({ text, audio, size = "md" }: { text: string; audio?: string; size?: "sm" | "md" | "lg" }) {
  const { available, say } = useSpeech();
  if (!audio && available === false) return null;
  const who = audio ? "native speaker" : "synthetic voice";
  const s = SIZES[size];
  const button = { minWidth: s.box, height: s.box, px: 1, borderRadius: 999, border: `1px solid ${C.lineStrong}`, color: C.venice } as const;
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
      <IconButton
        sx={{ ...button, fontSize: s.icon }}
        onClick={() => say(text, { audio })}
        aria-label={`Listen to “${text}” (${who})`}
        title={`Listen · ${who}`}
      >
        <SpeakerIcon />
      </IconButton>
      <IconButton
        sx={{ ...button, ...num, fontSize: s.slow, fontWeight: 600 }}
        onClick={() => say(text, { audio, slow: true })}
        aria-label={`Listen slowly to “${text}”`}
        title="Listen slowly"
      >
        0.7×
      </IconButton>
      {audio && size !== "sm" && (
        <Box component="span" sx={{ fontSize: 12, color: C.muted }}>
          Native speaker
        </Box>
      )}
    </Box>
  );
}

function SpeakerIcon() {
  return (
    <SvgIcon fontSize="inherit" sx={{ fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </SvgIcon>
  );
}
