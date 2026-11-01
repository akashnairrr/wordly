"use client"

import Box from "@mui/material/Box"
import MenuItem from "@mui/material/MenuItem"
import Select, { type SelectProps } from "@mui/material/Select"
import { getLanguage, LANGUAGE_LIST } from "@/lib/languages"
import { C, displayFontSx } from "@/theme"
import { Flag } from "./flag"

interface LanguageSelectProps {
  value: string
  onChange: (code: string) => void
  /** "large" for the landing page, "small" for the header (flag only below desktop width). */
  size?: "large" | "small"
  sx?: SelectProps["sx"]
}

/** Dropdown of languages with their flags; native name first, English name alongside in the menu. */
export function LanguageSelect({ value, onChange, size = "large", sx }: LanguageSelectProps) {
  const large = size === "large"
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      size={large ? "medium" : "small"}
      inputProps={{ "aria-label": "Language" }}
      // An empty value (landing page, first visit) shows a prompt instead of a language.
      displayEmpty
      renderValue={(code) => {
        if (!code) {
          return (
            <Box component="span" sx={{ color: C.muted, fontSize: large ? 20 : 14 }}>
              Pick a language
            </Box>
          )
        }
        const l = getLanguage(code)
        return (
          <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: large ? 1.5 : 1 }}>
            <Flag country={l.country} height={large ? 24 : 16} />
            <Box
              component="span"
              lang={l.code}
              sx={
                large
                  ? { ...displayFontSx, fontSize: 24, lineHeight: 1.2 }
                  : { fontSize: 14, display: { xs: "none", md: "inline" } }
              }
            >
              {l.nativeName}
            </Box>
          </Box>
        )
      }}
      sx={[
        large
          ? { minHeight: 64 }
          : // Flag-only below desktop width (the header has four links), so keep the padding tight there.
            {
              minHeight: 36,
              borderRadius: 999,
              // !important beats MUI's more specific input padding; without it the name runs under the arrow.
              "& .MuiSelect-select": {
                py: 0.75,
                pl: { xs: 1, md: 1.75 },
                pr: { xs: "8px !important", md: "32px !important" },
              },
              "& .MuiSelect-icon": { display: { xs: "none", md: "block" } },
            },
        ...(Array.isArray(sx) ? sx : [sx ?? {}]),
      ]}
    >
      {LANGUAGE_LIST.map((l) => (
        <MenuItem key={l.code} value={l.code} sx={{ gap: 1.5, minWidth: 220 }}>
          <Flag country={l.country} height={20} />
          <Box component="span" lang={l.code} sx={{ fontWeight: 600 }}>
            {l.nativeName}
          </Box>
          <Box component="span" sx={{ ml: "auto", fontSize: 14, color: C.muted }}>
            {l.name}
          </Box>
        </MenuItem>
      ))}
    </Select>
  )
}
