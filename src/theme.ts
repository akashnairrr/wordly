// Design tokens, safe to import from server components. The MUI theme built from them is in mui-theme.ts.

// Palette: Merino #F5EEDD · Rock Blue #84B3CE · Venice Blue #16587B.
// Light: Merino background, Venice Blue text, Rock Blue highlights. Dark flips it: a deep Venice background, Merino
// text, the same Rock Blue. Token names follow the light roles (merino = background, venice = text).
export const LIGHT = {
  merino: "#f5eedd",
  rock: "#84b3ce",
  venice: "#16587b",
  surface: "#fbf8f1",
  muted: "#3d6f8c", // 4.7:1 on Merino
  line: "#e4dac5",
  lineStrong: "#b5cfdf",
  // Full Rock Blue is only 3.4:1 under Venice text, so it marks lines, fills and borders; the paler mixes carry text.
  tintSoft: "#d6e6f0",
  // Filled buttons and the taught-word highlight; text on Rock Blue.
  primary: "#16587b",
  onPrimary: "#f5eedd",
  onRock: "#16587b",
  warning: "#6f5208",
  warningSoft: "#f1e3b5",
  danger: "#a8432c",
  dangerSoft: "#f4dccf",
  // Example-sentence word colours (text / background), beside tintSoft and warningSoft.
  orange: "#8a4317",
  orangeSoft: "#f6dcc7",
  green: "#3d6a2a",
  greenSoft: "#dce9d3",
  purple: "#5b3e8f",
  purpleSoft: "#e5ddf2",
  // Word strength meter, 1–4 bars: red, orange, yellow, green. Fills only, never text.
  strength1: "#c0392b",
  strength2: "#e07b1f",
  strength3: "#d9a90b",
  strength4: "#3f8f3a",
  backdrop: "rgb(22 88 123 / 0.35)",
  flagRing: "rgb(22 88 123 / 0.15)",
}

// Text 12:1 on the background, muted 6.9:1, every text / soft pair 6:1 or better.
export const DARK: typeof LIGHT = {
  merino: "#0f2532",
  rock: "#84b3ce",
  venice: "#ece3cf",
  surface: "#163242",
  muted: "#8fb0c4",
  line: "#26404f",
  lineStrong: "#4a7189",
  tintSoft: "#1f4559",
  // A cream button would glare on navy: Rock Blue with dark text (7:1).
  primary: "#84b3ce",
  onPrimary: "#0f2532",
  onRock: "#0f2532",
  warning: "#e8c66a",
  warningSoft: "#3b3214",
  danger: "#f2957c",
  dangerSoft: "#43241c",
  orange: "#f3b48c",
  orangeSoft: "#45291a",
  green: "#b5d69e",
  greenSoft: "#25391d",
  purple: "#cdb9ef",
  purpleSoft: "#33284a",
  strength1: "#f2957c",
  strength2: "#f3b06a",
  strength3: "#ecd36a",
  strength4: "#9fd38a",
  backdrop: "rgb(0 0 0 / 0.55)",
  flagRing: "rgb(255 255 255 / 0.15)",
}

type Token = keyof typeof LIGHT

/** CSS custom properties for one palette (--c-merino…); the MUI theme puts LIGHT on :root and DARK on .dark. */
export const cssVars = (p: typeof LIGHT) =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [`--c-${k}`, v])) as Record<string, string>

/** Colours for sx and styles: CSS variables, so they follow the light / dark scheme without re-rendering. */
export const C = Object.fromEntries(Object.keys(LIGHT).map((k) => [k, `var(--c-${k})`])) as Record<Token, string>

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
