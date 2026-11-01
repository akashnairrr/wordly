"use client"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Paper from "@mui/material/Paper"
import { useEffect, useState } from "react"
import { shortGloss, shuffle } from "@/lib/quiz"
import { playSfx } from "@/lib/sfx"
import type { Word } from "@/lib/types"
import { C, RADIUS_SM } from "@/theme"
import { ANSWER } from "./quiz"
import { useSpeech } from "./speech-provider"

const PAIRS = 5

interface Pair {
  id: string
  lemma: string
  gloss: string
  audio?: string
}

/** Up to 5 session words with distinct lemmas and meanings, so every tile has exactly one partner. */
export function matchPairs(words: Word[]): Pair[] {
  const seen = new Set<string>()
  return shuffle(words, Math.random)
    .map((w) => ({ id: w.id, lemma: w.lemma, gloss: shortGloss(w.glosses[0]), audio: w.audio }))
    .filter((p) => !seen.has(p.lemma) && !seen.has(p.gloss) && seen.add(p.lemma).add(p.gloss))
    .slice(0, PAIRS)
}

interface MatchRoundProps {
  pairs: Pair[]
  lang: string
  sound: boolean
  onDone: (mistakes: number) => void
}

/** Finale: tap a word, then its meaning (or the other way round), until every pair is matched. */
export function MatchRound({ pairs, lang, sound, onDone }: MatchRoundProps) {
  const { say } = useSpeech()
  const [cols] = useState(() => ({ left: shuffle(pairs, Math.random), right: shuffle(pairs, Math.random) }))
  const [picked, setPicked] = useState<{ side: "left" | "right"; id: string } | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrong, setWrong] = useState<{ left: string; right: string } | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const done = matched.size === pairs.length

  // A beat to see the last pair turn green.
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => onDone(mistakes), 700)
    return () => clearTimeout(t)
  }, [done, mistakes, onDone])

  const tap = (side: "left" | "right", p: Pair) => {
    if (side === "left") say(p.lemma, { audio: p.audio })
    if (!picked || picked.side === side) return setPicked(picked?.id === p.id ? null : { side, id: p.id })
    setPicked(null)
    if (picked.id === p.id) {
      if (sound) playSfx("correct")
      setMatched((m) => new Set(m).add(p.id))
    } else {
      if (sound) playSfx("wrong")
      setMistakes((n) => n + 1)
      setWrong(side === "left" ? { left: p.id, right: picked.id } : { left: picked.id, right: p.id })
      setTimeout(() => setWrong(null), 450)
    }
  }

  const tile = (side: "left" | "right", p: Pair) => {
    const state = matched.has(p.id)
      ? ANSWER.right
      : wrong?.[side] === p.id
        ? ANSWER.wrong
        : picked?.side === side && picked.id === p.id
          ? { borderColor: C.venice, bgcolor: C.tintSoft }
          : undefined
    return (
      <Button
        key={p.id}
        variant="outlined"
        lang={side === "left" ? lang : undefined}
        onClick={() => tap(side, p)}
        disabled={matched.has(p.id)}
        aria-pressed={picked?.side === side && picked.id === p.id}
        sx={{
          minHeight: 56,
          px: 1.5,
          bgcolor: C.merino,
          color: C.venice,
          borderColor: C.line,
          borderWidth: 2,
          borderRadius: `${RADIUS_SM}px`,
          fontSize: 17,
          fontWeight: side === "left" ? 600 : 500,
          lineHeight: 1.25,
          "&:hover": { borderColor: C.venice, bgcolor: C.merino },
          "&.Mui-disabled": { color: C.green, borderColor: C.green },
          ...state,
        }}
      >
        {side === "left" ? p.lemma : p.gloss}
      </Button>
    )
  }

  return (
    <Paper component="section" variant="outlined" aria-label="Match the pairs" sx={{ p: 3 }}>
      <Box sx={{ fontSize: 14, fontWeight: 600, color: C.muted }}>Final round · Match the pairs</Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25, mt: 2 }}>
        <Box sx={{ display: "grid", gap: 1.25, alignContent: "start" }}>{cols.left.map((p) => tile("left", p))}</Box>
        <Box sx={{ display: "grid", gap: 1.25, alignContent: "start" }}>{cols.right.map((p) => tile("right", p))}</Box>
      </Box>
    </Paper>
  )
}
