"use client"

import Box from "@mui/material/Box"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import { useState } from "react"
import { getLanguage, withPronoun } from "@/lib/languages"
import type { Mood, Person, Tense, Word } from "@/lib/types"
import { FormRows } from "./forms-table"

const PERSONS: Person[] = ["1s", "2s", "3s", "1p", "2p", "3p"]
const PAST_KEYS = ["m", "f", "n", "p"] as const

type Tab = { label: string; mood?: Mood; tense?: Tense; past?: true }

interface ConjugationTableProps {
  word: Word
  lang: string
}

export function ConjugationTable({ word, lang }: ConjugationTableProps) {
  const language = getLanguage(lang)
  const tenses = language.tenses.filter(
    ({ mood, tense }) => Object.keys(word.conjugation?.[mood]?.[tense] ?? {}).length
  )
  const tabs: Tab[] = [...tenses]
  // A past tense by gender (Russian) goes right after the first tense: Present, Past, Future…
  if (word.past && language.pastLabels) tabs.splice(Math.min(1, tabs.length), 0, { label: "Past", past: true })
  const [active, setActive] = useState(0)
  const current = tabs[active]
  const row = current?.mood && current.tense ? word.conjugation?.[current.mood]?.[current.tense] : undefined
  const pastLabels = language.pastLabels

  const nonFinite = [
    ["Gerund (-ing)", word.nonFinite?.gerund],
    ["Past participle", word.nonFinite?.participle],
  ].filter((r): r is [string, string] => !!r[1])

  return (
    <div>
      {tabs.length > 0 && (
        <ToggleButtonGroup
          exclusive
          value={active}
          onChange={(_, i: number | null) => i !== null && setActive(i)}
          aria-label="Tense"
          sx={{ mb: 0.75 }}
        >
          {tabs.map((t, i) => (
            <ToggleButton key={t.label} value={i}>
              {t.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}
      {row && (
        <FormRows
          lang={lang}
          rows={PERSONS.filter((p) => row[p]).map((p) => {
            const form = row[p]!
            const recording = word.formAudio?.[form]
            // A recording is of the bare form; synthetic speech says it with its pronoun for context.
            // Imperatives are commands, so no pronoun.
            const spoken =
              recording || current?.mood === "imperative"
                ? form
                : withPronoun(language, language.personLabels[p].split(" / ")[0]!, form)
            return { label: language.personLabels[p], form, spoken, audio: recording }
          })}
        />
      )}
      {current?.past && word.past && pastLabels && (
        <FormRows
          lang={lang}
          rows={PAST_KEYS.filter((k) => word.past?.[k]).map((k) => {
            const form = word.past![k]!
            const recording = word.formAudio?.[form]
            return {
              label: pastLabels[k],
              form,
              spoken: recording ? form : `${pastLabels[k].split(" / ")[0]} ${form}`,
              audio: recording,
            }
          })}
        />
      )}
      {nonFinite.length > 0 && (
        <Box sx={{ mt: 1.5 }}>
          <FormRows
            lang={lang}
            rows={nonFinite.map(([label, form]) => ({ label, form, audio: word.formAudio?.[form] }))}
          />
        </Box>
      )}
    </div>
  )
}
