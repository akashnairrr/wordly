"use client"

import Box from "@mui/material/Box"
import { useState } from "react"
import { LanguageSelect } from "@/components/language-select"
import { ButtonLink } from "@/components/links"
import { LANGUAGE_LIST } from "@/lib/languages"

/** Pick a language, then start: choosing in the dropdown doesn't navigate on its own. */
export function LanguageStart() {
  const [code, setCode] = useState(LANGUAGE_LIST[0]!.code)
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 1.75, mb: 2.25 }}>
      <LanguageSelect value={code} onChange={setCode} sx={{ flex: "1 1 240px" }} />
      <ButtonLink href={`/${code}/`} sx={{ minHeight: 64, px: 4, flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
        Start learning
      </ButtonLink>
    </Box>
  )
}
