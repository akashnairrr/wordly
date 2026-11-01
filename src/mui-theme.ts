"use client"

import { createTheme } from "@mui/material/styles"
import { C, cssVars, DARK, displayFontSx, LIGHT, RADIUS, RADIUS_SM } from "./theme"

const headingSx = { ...displayFontSx, fontWeight: 700, lineHeight: 1.1, textWrap: "balance", color: C.venice } as const

// MUI computes hover and disabled shades from these, so they take real colours; styles below use C's variables.
const palette = (p: typeof LIGHT) => ({
  primary: { main: p.primary, contrastText: p.onPrimary },
  secondary: { main: p.rock, contrastText: p.onRock },
  error: { main: p.danger, light: p.dangerSoft },
  background: { default: p.merino, paper: p.surface },
  text: { primary: p.venice, secondary: p.muted },
  divider: p.line,
})

export const theme = createTheme({
  // Follows the system until the header toggle picks one; the choice is kept in localStorage (mui-mode).
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: { light: { palette: palette(LIGHT) }, dark: { palette: palette(DARK) } },
  shape: { borderRadius: RADIUS_SM },
  typography: {
    fontFamily: "var(--font-body), system-ui, sans-serif",
    body1: { fontSize: 17, lineHeight: 1.5 },
    body2: { fontSize: 14, color: C.muted },
    h1: { ...headingSx, fontSize: "clamp(34px, 7vw, 48px)", fontWeight: 800 },
    h2: { ...headingSx, fontSize: 26 },
    h3: { ...headingSx, fontSize: 20 },
    button: { textTransform: "none", fontWeight: 600, fontSize: 17 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ":root": cssVars(LIGHT),
        ":root.dark": cssVars(DARK),
        body: { WebkitFontSmoothing: "antialiased" },
        p: { textWrap: "pretty" },
        "::selection": { background: C.rock, color: C.onRock },
        ":focus-visible": { outline: `2px solid ${C.venice}`, outlineOffset: 2 },
      },
    },
    // Flat: no ripples, no elevation shadows.
    MuiButtonBase: { defaultProps: { disableRipple: true } },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: "none" }, outlined: { borderColor: C.line, borderRadius: RADIUS } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, variant: "contained" },
      styleOverrides: {
        root: { borderRadius: 999, minHeight: 48, paddingInline: 22, gap: 8, "&.Mui-disabled": { opacity: 0.4 } },
        contained: { "&.Mui-disabled": { background: C.primary, color: C.onPrimary } },
        outlined: {
          borderWidth: 1.5,
          borderColor: "currentColor",
          "&:hover": { borderWidth: 1.5, background: C.tintSoft },
        },
        text: { color: C.muted, paddingInline: 12, "&:hover": { color: C.venice, background: "transparent" } },
      },
    },
    MuiIconButton: { styleOverrides: { root: { "&:hover": { background: C.tintSoft } } } },
    MuiLink: {
      defaultProps: { underline: "always" },
      styleOverrides: { root: { color: "inherit", textUnderlineOffset: 3 } },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontSize: 13, fontWeight: 500, height: "auto", minHeight: 26, borderRadius: 999 },
        label: { paddingInline: 10, paddingBlock: 3 },
        outlined: { borderColor: C.lineStrong, color: C.muted },
      },
    },
    MuiLinearProgress: {
      defaultProps: { variant: "determinate" },
      styleOverrides: {
        root: { height: 6, borderRadius: 999, background: C.line },
        bar: { background: C.rock, borderRadius: 999 },
      },
    },
    MuiSlider: { defaultProps: { color: "secondary" } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          background: C.surface,
          borderRadius: RADIUS_SM,
          minHeight: 48,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: C.lineStrong },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: C.venice },
        },
      },
    },
    // Segmented filters: plain labels, Rock Blue underline on the selected one.
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          gap: 4,
          maxWidth: "100%",
          overflowX: "auto",
          scrollbarWidth: "none",
          borderBottom: `1px solid ${C.line}`,
          borderRadius: 0,
        },
        grouped: { border: 0, borderRadius: 0, margin: 0, "&:not(:first-of-type)": { borderLeft: 0, marginLeft: 0 } },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: 0,
          borderRadius: 0,
          padding: "10px 12px",
          fontSize: 15,
          fontWeight: 400,
          color: C.muted,
          whiteSpace: "nowrap",
          borderBottom: "3px solid transparent",
          "&:hover": { background: "transparent", color: C.venice },
          "&.Mui-selected, &.Mui-selected:hover": {
            background: "transparent",
            color: C.venice,
            fontWeight: 600,
            borderBottomColor: C.rock,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: C.line, paddingInline: 0, paddingBlock: 8, fontSize: 17, color: C.venice },
        head: { fontWeight: 400 },
      },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: RADIUS, padding: 8, maxWidth: "min(420px, calc(100vw - 32px))" } },
    },
    MuiBackdrop: {
      styleOverrides: { root: { "&:not(.MuiBackdrop-invisible)": { background: C.backdrop } } },
    },
    MuiAlert: {
      defaultProps: { icon: false },
      styleOverrides: {
        root: { borderRadius: RADIUS_SM, fontSize: 15, color: C.venice, background: C.tintSoft, padding: "6px 14px" },
      },
    },
    MuiSkeleton: {
      defaultProps: { variant: "rounded", animation: "wave" },
      styleOverrides: { root: { background: C.line, borderRadius: RADIUS } },
    },
    MuiListItemButton: { styleOverrides: { root: { "&:hover": { background: "transparent" } } } },
  },
})
