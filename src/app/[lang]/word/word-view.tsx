"use client"

import Box from "@mui/material/Box"
import Skeleton from "@mui/material/Skeleton"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { EmptyState } from "@/components/empty-state"
import { WordsBackLink } from "@/components/links"
import { WordCard } from "@/components/word-card"
import { WordStatusBar } from "@/components/word-status-bar"
import { fetchWord } from "@/lib/data"
import type { Word } from "@/lib/types"

interface WordViewProps {
  lang: string
}

type Loaded = { id: string; word?: Word; error?: string }

/** One word's page (/es/word/?id=casa), loaded in the browser from public/data. */
export function WordView({ lang }: WordViewProps) {
  const id = useSearchParams().get("id") ?? ""
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    let current = true
    fetchWord(lang, id).then(
      (word) => current && setLoaded({ id, word }),
      () => current && setLoaded({ id, error: "not found" })
    )
    return () => {
      current = false
    }
  }, [lang, id])

  const word = loaded?.id === id ? loaded.word : undefined
  useEffect(() => {
    if (word) document.title = `${word.lemma} — ${word.glosses[0]} · Wordly`
  }, [word])

  return (
    <>
      <Box component="p" sx={{ mt: 2.5, mb: 1.5 }}>
        <WordsBackLink lang={lang} />
      </Box>
      {loaded?.id === id && loaded.error ? (
        <EmptyState text="That word isn't in the list." />
      ) : word ? (
        <>
          <WordStatusBar lang={lang} id={id} />
          <WordCard word={word} lang={lang} />
        </>
      ) : (
        <Skeleton sx={{ minHeight: 480 }} />
      )}
    </>
  )
}
