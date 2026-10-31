import Box from "@mui/material/Box"
import type { ReactNode } from "react"
import type { Example, Word } from "@/lib/types"
import { allForms } from "@/lib/words"
import { C } from "@/theme"
import { SpeakButton } from "./speak-button"

// Colour pairs (word background / meaning text), each 5:1 or better on Merino.
const COLORS = [
  { bg: "#d6e6f0", fg: "#16587b" },
  { bg: "#f6dcc7", fg: "#8a4317" },
  { bg: "#dce9d3", fg: "#3d6a2a" },
  { bg: "#e5ddf2", fg: "#5b3e8f" },
  { bg: "#f1e3b5", fg: "#6f5208" },
]

const pillSx = {
  fontSize: 19,
  fontWeight: 500,
  lineHeight: 1.3,
  px: "6px",
  py: "1px",
  borderRadius: "6px",
  whiteSpace: "nowrap",
} as const

interface UnitProps {
  es: string
  en?: string
  lemma?: string
  color?: number
  lang: string
}

/** One word or phrase with its meaning (and dictionary form, if inflected) underneath, in a matching colour. */
function Unit({ es, en, lemma, color, lang }: UnitProps) {
  const c = color === undefined ? undefined : COLORS[color % COLORS.length]
  return (
    // As wide as the word, or the longest word of its meaning: meanings wrap instead of widening the gap to the next word.
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "flex-start",
        width: "min-content",
        maxWidth: "100%",
      }}
    >
      <Box component="span" lang={lang} sx={{ ...pillSx, bgcolor: c?.bg }}>
        {es}
      </Box>
      {en && (
        <Box component="span" sx={{ fontSize: 13, lineHeight: 1.25, pt: "3px", px: "6px", color: c?.fg }}>
          {lemma && (
            <Box component="span" lang={lang} sx={{ display: "block", fontStyle: "italic" }}>
              {lemma}
            </Box>
          )}
          {/* Keep "to come" and "the /" together when the meaning wraps under a short word. */}
          {en.replace(/^to /, "to\u00a0").replaceAll(" / ", "\u00a0/ ")}
        </Box>
      )}
    </Box>
  )
}

interface GlossedSentenceProps {
  ex: Example
  forms: Set<string>
  lang: string
}

/**
 * The sentence split into its words, each with its meaning below (phrases like "por favor" as one unit).
 * The word being taught keeps its own highlight instead of a gloss.
 */
function GlossedSentence({ ex, forms, lang }: GlossedSentenceProps) {
  // Odd entries are letter runs, aligned with ex.words; even entries are spaces and punctuation.
  const parts = ex.text.split(/(\p{L}+)/u)
  const items: ReactNode[] = []
  let color = 0
  for (let k = 0; k < parts.length; k++) {
    const part = parts[k] ?? ""
    if (k % 2 === 0) {
      const punct = part.trim()
      if (punct)
        items.push(
          <Box component="span" key={k} sx={{ ...pillSx, px: 0 }}>
            {punct}
          </Box>
        )
      continue
    }
    const token = (k - 1) / 2
    const phrase = ex.phrases?.find(([start]) => start === token)
    if (phrase) {
      const last = k + 2 * (phrase[1] - phrase[0] - 1)
      items.push(<Unit key={k} es={parts.slice(k, last + 1).join("")} en={phrase[2]} color={color++} lang={lang} />)
      k = last
      continue
    }
    if (forms.has(part.toLowerCase())) {
      // The word being taught: the one solid pill among the pastel ones.
      items.push(
        <Box
          component="mark"
          key={k}
          lang={lang}
          sx={{ ...pillSx, bgcolor: C.venice, color: C.merino, fontWeight: 700 }}
        >
          {part}
        </Box>
      )
      continue
    }
    const gloss = ex.words?.[token]
    items.push(
      gloss ? (
        <Unit key={k} es={part} en={gloss.g} lemma={gloss.l} color={color++} lang={lang} />
      ) : (
        <Unit key={k} es={part} lang={lang} />
      )
    )
  }
  return <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: "8px 4px" }}>{items}</Box>
}

interface ExampleListProps {
  word: Word
  lang: string
}

export function ExampleList({ word, lang }: ExampleListProps) {
  if (!word.examples.length)
    return (
      <Box component="p" sx={{ fontSize: 14, color: C.muted }}>
        No example sentences found for this word yet.
      </Box>
    )
  const forms = new Set(allForms(word).map((f) => f.toLowerCase()))
  return (
    <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
      {word.examples.map((ex) => (
        <Box
          component="li"
          key={ex.text}
          sx={{ py: 1.5, borderBottom: `1px solid ${C.line}`, "&:last-child": { borderBottom: 0 } }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1.5 }}>
            <GlossedSentence ex={ex} forms={forms} lang={lang} />
            <SpeakButton text={ex.text} audio={ex.audio} size="sm" />
          </Box>
          <Box sx={{ mt: 1, color: C.muted, fontSize: 15 }}>{ex.en}</Box>
        </Box>
      ))}
    </Box>
  )
}
