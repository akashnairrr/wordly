"use client"

import Box from "@mui/material/Box"
import { useState, useSyncExternalStore } from "react"
import { LanguageSelect } from "@/components/language-select"
import { ButtonLink } from "@/components/links"
import { getLanguage, LANGUAGE_LIST } from "@/lib/languages"
import { readLastLanguage } from "@/lib/last-language"

const noSubscribe = () => () => {}

/**
 * Pick a language, then start: choosing in the dropdown doesn't navigate on its own. Returning learners start on the
 * language they used last.
 */
export function LanguageStart() {
  // Read after hydration only; the static HTML starts on the first language.
  const saved = useSyncExternalStore(noSubscribe, readLastLanguage, () => null)
  const [picked, setPicked] = useState<string | null>(null)
  const code = picked ?? saved ?? LANGUAGE_LIST[0]!.code
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 1.75, mb: 2.25 }}>
      <LanguageSelect value={code} onChange={setPicked} sx={{ flex: "1 1 240px" }} />
      <ButtonLink href={`/${code}/`} sx={{ minHeight: 64, px: 4, flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
        {code === saved ? `Continue in ${getLanguage(code).nativeName}` : "Start learning"}
      </ButtonLink>
    </Box>
  )
}
