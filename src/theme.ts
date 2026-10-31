// Design tokens, safe to import from server components. The MUI theme built from them is in mui-theme.ts.

// Palette: Merino #F5EEDD · Rock Blue #84B3CE · Venice Blue #16587B.
// Merino background, Venice Blue text, Rock Blue highlights. One theme, regardless of system dark mode.
export const C = {
  merino: "#f5eedd",
  rock: "#84b3ce",
  venice: "#16587b",
  surface: "#fbf8f1",
  muted: "#3d6f8c", // 4.7:1 on Merino
  line: "#e4dac5",
  lineStrong: "#b5cfdf",
  // Full Rock Blue is only 3.4:1 under Venice text, so it marks lines, fills and borders; the paler mixes carry text.
  tintSoft: "#d6e6f0",
  warning: "#6f5208",
  warningSoft: "#f1e3b5",
  danger: "#a8432c",
  dangerSoft: "#f4dccf",
} as const

export const RADIUS = 18
export const RADIUS_SM = 12
export const Z = { header: 10, sticky: 20 } as const

export const displayFontSx = {
  fontFamily: "var(--font-display), Georgia, serif",
  fontVariationSettings: '"SOFT" 100, "WONK" 1',
  fontWeight: 800,
} as const

export const numSx = { fontVariantNumeric: "tabular-nums" } as const

/** Content column: 820px wide with safe-area gutters. */
export const columnSx = {
  maxWidth: 820,
  mx: "auto",
  pl: "max(16px, env(safe-area-inset-left))",
  pr: "max(16px, env(safe-area-inset-right))",
} as const
