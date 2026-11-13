import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import FormControlLabel from "@mui/material/FormControlLabel"
import Switch from "@mui/material/Switch"
import Tooltip from "@mui/material/Tooltip"
import { type ReactNode, useState } from "react"
import type { Example, Word } from "@/lib/types"
import { allForms } from "@/lib/words"
import { useProgress } from "@/hooks/use-progress"
import { C } from "@/theme"
import { SpeakButton } from "./speak-button"

/** Sentences shown before "More examples". */
const SHOWN = 2

// Colour pairs (word background / meaning text), each 5:1 or better on the page background in both schemes.
export const COLORS = [
  { bg: C.tintSoft, fg: C.venice },
  { bg: C.orangeSoft, fg: C.orange },
  { bg: C.greenSoft, fg: C.green },
  { bg: C.purpleSoft, fg: C.purple },
  { bg: C.warningSoft, fg: C.warning },
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

/** A word (or phrase) of a plain sentence whose meaning shows on hover, tap or keyboard focus, like Duolingo hints. */
function Hint({ es, en, lemma, lang }: { es: string; en: string; lemma?: string; lang: string }) {
  const title = (
    <Box component="span" sx={{ fontSize: 14 }}>
      {en}
      {lemma && (
        <Box component="span" lang={lang} sx={{ display: "block", fontStyle: "italic", opacity: 0.85 }}>
          {lemma}
        </Box>
      )}
    </Box>
  )
  return (
    // describeChild: the word stays the button's name; the meaning is its description.
    <Tooltip title={title} arrow describeChild enterTouchDelay={0} leaveTouchDelay={4000}>
      <Box
        component="button"
        type="button"
        lang={lang}
        sx={{
          font: "inherit",
          color: "inherit",
          bgcolor: "transparent",
          border: 0,
          p: 0,
          cursor: "help",
          textDecoration: "underline dotted",
          textDecorationColor: C.muted,
          textUnderlineOffset: "5px",
          "&:hover, &:focus-visible": { textDecorationStyle: "solid" },
        }}
      >
        {es}
      </Box>
    </Tooltip>
  )
}

interface GlossedSentenceProps {
  ex: Example
  forms: Set<string>
  lang: string
  /** Every meaning on show as coloured pills, instead of hints on demand. */
  pills: boolean
}

/**
 * The sentence split into its words (phrases like "por favor" as one unit), each with its meaning: below it as a
 * pill, or as a hint. The word being taught keeps its own highlight instead of a gloss.
 */
function GlossedSentence({ ex, forms, lang, pills }: GlossedSentenceProps) {
  if (!pills) return <HintedSentence ex={ex} forms={forms} lang={lang} />
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
          sx={{ ...pillSx, bgcolor: C.primary, color: C.onPrimary, fontWeight: 700 }}
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

/** Plain running text: glossed words are hints, the taught word is highlighted. */
function HintedSentence({ ex, forms, lang }: Omit<GlossedSentenceProps, "pills">) {
  const parts = ex.text.split(/(\p{L}+)/u)
  const items: ReactNode[] = []
  for (let k = 0; k < parts.length; k++) {
    const part = parts[k] ?? ""
    if (k % 2 === 0) {
      items.push(part)
      continue
    }
    const token = (k - 1) / 2
    const phrase = ex.phrases?.find(([start]) => start === token)
    if (phrase) {
      const last = k + 2 * (phrase[1] - phrase[0] - 1)
      items.push(<Hint key={k} es={parts.slice(k, last + 1).join("")} en={phrase[2]} lang={lang} />)
      k = last
      continue
    }
    if (forms.has(part.toLowerCase())) {
      items.push(
        <Box
          component="mark"
          key={k}
          sx={{ bgcolor: C.primary, color: C.onPrimary, fontWeight: 700, px: "4px", borderRadius: "6px" }}
        >
          {part}
        </Box>
      )
      continue
    }
    const gloss = ex.words?.[token]
    items.push(gloss ? <Hint key={k} es={part} en={gloss.g} lemma={gloss.l} lang={lang} /> : part)
  }
  return (
    <Box component="p" lang={lang} sx={{ m: 0, fontSize: 21, fontWeight: 500, lineHeight: 1.6 }}>
      {items}
    </Box>
  )
}

interface ExampleListProps {
  word: Word
  lang: string
}

export function ExampleList({ word, lang }: ExampleListProps) {
  const [progress, update] = useProgress(lang)
  const [all, setAll] = useState(false)
  const pills = !!progress?.settings.showMeanings
  if (!word.examples.length)
    return (
      <Box component="p" sx={{ fontSize: 14, color: C.muted }}>
        No example sentences found for this word yet.
      </Box>
    )
  const forms = new Set(allForms(word).map((f) => f.toLowerCase()))
  const shown = all ? word.examples : word.examples.slice(0, SHOWN)
  const hidden = word.examples.length - shown.length
  return (
    <>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={pills}
            onChange={(e) => update((p) => ({ ...p, settings: { ...p.settings, showMeanings: e.target.checked } }))}
          />
        }
        label="Show all meanings"
        sx={{ mb: 0.5, "& .MuiFormControlLabel-label": { fontSize: 14, color: C.muted } }}
      />
      <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
        {shown.map((ex) => (
          <Box
            component="li"
            key={ex.text}
            sx={{ py: 1.5, borderBottom: `1px solid ${C.line}`, "&:last-child": { borderBottom: 0 } }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1.5 }}>
              <GlossedSentence ex={ex} forms={forms} lang={lang} pills={pills} />
              <SpeakButton text={ex.text} audio={ex.audio} size="sm" />
            </Box>
            <Box sx={{ mt: 1, color: C.muted, fontSize: 15 }}>{ex.en}</Box>
          </Box>
        ))}
      </Box>
      {hidden > 0 && (
        <Button variant="text" size="small" onClick={() => setAll(true)} sx={{ mt: 0.5 }}>
          More examples ({hidden})
        </Button>
      )}
    </>
  )
}
