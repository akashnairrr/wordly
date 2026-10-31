"use client"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import { useState, useSyncExternalStore } from "react"
import { LanguageSelect } from "@/components/language-select"
import { ButtonLink, noSubscribe } from "@/components/links"
import { getLanguage } from "@/lib/languages"
import { readLastLanguage } from "@/lib/last-language"

const startSx = { minHeight: 64, px: 4, flex: { xs: "1 1 100%", sm: "0 0 auto" } }

/**
 * Pick a language, then start: choosing in the dropdown doesn't navigate on its own. First-time visitors start with
 * nothing picked; returning learners start on the language they used last.
 */
export function LanguageStart() {
  // Read after hydration only; the static HTML starts with nothing picked.
  const saved = useSyncExternalStore(noSubscribe, readLastLanguage, () => null)
  const [picked, setPicked] = useState<string | null>(null)
  const code = picked ?? saved ?? ""
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 1.75, mb: 2.25 }}>
      <LanguageSelect value={code} onChange={setPicked} sx={{ flex: "1 1 240px" }} />
      {code ? (
        <ButtonLink href={`/${code}/`} sx={startSx}>
          {code === saved ? `Continue in ${getLanguage(code).nativeName}` : "Start learning"}
        </ButtonLink>
      ) : (
        <Button disabled sx={startSx}>
          Start learning
        </Button>
      )}
    </Box>
  )
}
