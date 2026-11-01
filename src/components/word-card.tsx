"use client"

import Box from "@mui/material/Box"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
import { useEffect } from "react"
import { getLanguage, POS_LABELS } from "@/lib/languages"
import { levelLabel, levelOf } from "@/lib/levels"
import type { Word } from "@/lib/types"
import { C, numSx } from "@/theme"
import { ConjugationTable } from "./conjugation-table"
import { ExampleList } from "./example-list"
import { FormsTable } from "./forms-table"
import { SpeakButton } from "./speak-button"
import { useSpeech } from "./speech-provider"
import { ToneChip } from "./tone-chip"

const GENDER_LABEL = { m: "masculine", f: "feminine", n: "neuter", mf: "masculine or feminine" } as const

interface SectionProps {
  title: string
  children: React.ReactNode
}

function Section({ title, children }: SectionProps) {
  return (
    <Box component="section" sx={{ borderTop: `1px solid ${C.line}`, mt: 2.75, pt: 2.25 }}>
      <Typography variant="h3" sx={{ mb: 1.25 }}>
        {title}
      </Typography>
      {children}
    </Box>
  )
}

interface WordCardProps {
  word: Word
  lang: string
  autoSpeak?: boolean
  /** Small label above the word, e.g. "Review". */
  badge?: string
}

export function WordCard({ word, lang, autoSpeak = false, badge }: WordCardProps) {
  const language = getLanguage(lang)
  const { available, say } = useSpeech()
  const article = word.gender && word.gender !== "mf" ? language.articles?.[word.gender] : undefined

  // Speak the word when a lesson card opens. Recordings play without waiting for voices to load.
  useEffect(() => {
    if (autoSpeak && (word.audio || available)) say(word.lemma, { audio: word.audio })
  }, [autoSpeak, available, say, word.lemma, word.audio])

  return (
    <Paper component="article" variant="outlined" sx={{ p: 3 }}>
      <Box
        component="header"
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px 16px",
        }}
      >
        <Box sx={{ flex: "1 1 200px", minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 0.75,
              fontSize: 14,
              color: C.muted,
              mb: 0.75,
            }}
          >
            {badge && <ToneChip tone="studied" label={badge} />}
            <span>{POS_LABELS[word.pos]}</span>
            {word.gender && <span>· {GENDER_LABEL[word.gender]}</span>}
            {word.aspect && (
              <span>
                · {word.aspect}
                {word.aspectPartner && (
                  <>
                    {" "}
                    (pair:{" "}
                    <Box component="span" lang={lang} sx={{ fontWeight: 600 }}>
                      {word.aspectPartner}
                    </Box>
                    )
                  </>
                )}
              </span>
            )}
            <span>· {levelLabel(levelOf(word.rank))}</span>
            <Box component="span" sx={numSx}>
              · #{word.rank}
            </Box>
          </Box>
          <Typography
            variant="h2"
            lang={lang}
            sx={{ fontSize: "clamp(40px, 9vw, 60px)", fontWeight: 800, overflowWrap: "break-word" }}
          >
            {article && (
              <Box component="span" sx={{ fontWeight: 400, color: C.muted }}>
                {article}{" "}
              </Box>
            )}
            {word.lemma}
          </Typography>
          {word.ipa && <Box sx={{ mt: 0.75, color: C.muted }}>{word.ipa}</Box>}
        </Box>
        <SpeakButton text={article ? `${article} ${word.lemma}` : word.lemma} audio={word.audio} size="lg" />
      </Box>

      <Section title="Meaning">
        <Box component="ol" sx={{ m: 0, pl: 2.75, "& li + li": { mt: 0.5 } }}>
          {word.glosses.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </Box>
      </Section>

      {word.forms && (
        <Section title="Forms">
          <FormsTable word={word} lang={lang} />
        </Section>
      )}

      {(word.conjugation || word.nonFinite) && (
        <Section title="Conjugation">
          <ConjugationTable word={word} lang={lang} />
        </Section>
      )}

      <Section title="In real sentences">
        <ExampleList word={word} lang={lang} />
      </Section>
      {available === false && (
        <Typography variant="body2" sx={{ mt: 2 }}>
          Words without a native recording use your browser&apos;s {language.name} voice, and none is installed. Add one
          in your system&apos;s speech settings.
        </Typography>
      )}
    </Paper>
  )
}
