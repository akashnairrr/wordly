"use client"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import IconButton from "@mui/material/IconButton"
import Paper from "@mui/material/Paper"
import SvgIcon from "@mui/material/SvgIcon"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { keyframes } from "@mui/material/styles"
import { useEffect, useState } from "react"
import { grade, QUESTION_TITLES, type QuizQuestion, type QuizResult, shuffle, splitAsides } from "@/lib/quiz"
import { playSfx } from "@/lib/sfx"
import { C, displayFontSx, numSx, RADIUS, RADIUS_SM, Z } from "@/theme"
import { SpeakButton } from "./speak-button"
import { useSpeech } from "./speech-provider"

// Prompts written in the language being learned (the rest are English).
const TARGET_PROMPT = new Set<QuizQuestion["kind"]>(["meaning", "cloze", "conjugation", "gender", "gendered-form"])

const pop = keyframes`0% { transform: scale(1) } 40% { transform: scale(1.04) } 100% { transform: scale(1) }`
const shake = keyframes`0%, 100% { transform: translateX(0) } 20%, 60% { transform: translateX(-6px) } 40%, 80% { transform: translateX(6px) }`
const still = { "@media (prefers-reduced-motion: reduce)": { animation: "none" } }

/** Right / wrong answer looks, shared with the match round. */
export const ANSWER = {
  right: { borderColor: C.green, bgcolor: C.greenSoft, color: C.green, animation: `${pop} 300ms ease-out`, ...still },
  wrong: { borderColor: C.danger, bgcolor: C.dangerSoft, color: C.danger, animation: `${shake} 350ms`, ...still },
  dim: { opacity: 0.5 },
} as const

const icon = (d: string) => (
  <SvgIcon sx={{ fontSize: 20 }}>
    <path d={d} />
  </SvgIcon>
)
const SOUND_ON =
  "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
const SOUND_OFF =
  "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51" +
  "C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5" +
  "v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3z" +
  "M12 4L9.91 6.09 12 8.18V4z"

interface QuizProps {
  questions: QuizQuestion[]
  lang: string
  sound: boolean
  onToggleSound: () => void
  onDone: (attempts: QuizResult[]) => void
}

/**
 * Runs the questions in order. There's deliberately no skip: every question must be answered.
 * A question missed on the first try comes back once at the end; a second miss stands.
 */
export function Quiz({ questions, lang, sound, onToggleSound, onDone }: QuizProps) {
  const { say } = useSpeech()
  const [queue, setQueue] = useState(() => questions.map((q) => ({ q, retry: false })))
  const [i, setI] = useState(0)
  const [given, setGiven] = useState<string | null>(null)
  const [typed, setTyped] = useState("")
  const [attempts, setAttempts] = useState<QuizResult[]>([])
  const [combo, setCombo] = useState(0)
  const entry = queue[i]
  const q = entry?.q

  // Listening questions play as soon as they appear.
  useEffect(() => {
    if (q?.audio) say(q.audio, { audio: q.audioUrl })
  }, [q, say])

  const result = q && given !== null ? grade(q, given) : null
  const last = i + 1 >= queue.length

  const answer = (value: string) => {
    if (!entry || given !== null) return
    const g = grade(entry.q, value)
    const reveal = () => say(entry.q.reveal.text, { audio: entry.q.reveal.audio })
    // Hear the right answer straight away, whether or not it was chosen, as extra listening practice.
    if (sound) {
      playSfx(g === "wrong" ? "wrong" : "correct")
      setTimeout(reveal, 250)
    } else reveal()
    setGiven(value)
    setCombo((c) => (g === "wrong" ? 0 : c + 1))
    setAttempts((a) => [...a, { question: entry.q, given: value, grade: g, retry: entry.retry }])
    if (g === "wrong" && !entry.retry) {
      // Reshuffled, so the retry tests the word rather than where the answer sat.
      const again = { ...entry.q, options: entry.q.options && shuffle(entry.q.options, Math.random) }
      setQueue((qs) => [...qs, { q: again, retry: true }])
    }
  }

  function next() {
    if (given === null) return
    if (last) return onDone(attempts)
    setI(i + 1)
    setGiven(null)
    setTyped("")
  }

  // 1–4 pick an option, Enter continues. Skipped while typing, and Enter on a focused button clicks it already.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.closest("input, textarea") || e.metaKey || e.ctrlKey || e.altKey) return
      const o = q?.options?.[Number(e.key) - 1]
      if (o) answer(o)
      else if (e.key === "Enter" && !el.closest("button")) next()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  if (!entry || !q) return null
  const play = (slow = false) => q.audio && say(q.audio, { audio: q.audioUrl, slow })
  // Only "What does this mean?" answers in English.
  const answerLang = q.kind === "meaning" ? undefined : lang

  return (
    <Paper component="section" variant="outlined" aria-label="Quiz" sx={{ p: 3 }}>
      <Box aria-hidden sx={{ display: "flex", gap: 0.5, mb: 2.25 }}>
        {queue.map((_, n) => (
          <Box
            key={n}
            sx={{
              flex: 1,
              height: 6,
              borderRadius: 999,
              transition: "background-color 200ms",
              bgcolor: n < i || (n === i && given !== null) ? C.venice : n === i ? C.rock : C.line,
            }}
          />
        ))}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.5 }}>
        <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box component="span" sx={{ fontSize: 18, fontWeight: 600, color: C.muted }}>
            {QUESTION_TITLES[q.kind]}
          </Box>
          {entry.retry && <Chip size="small" label="Try again" sx={{ bgcolor: C.warningSoft, color: C.warning }} />}
        </Box>
        <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography variant="body2" component="span" sx={numSx}>
            {i + 1} of {queue.length}
          </Typography>
          <IconButton
            onClick={onToggleSound}
            aria-label={sound ? "Mute sound effects" : "Turn on sound effects"}
            aria-pressed={!sound}
            size="small"
            sx={{ color: C.muted }}
          >
            {icon(sound ? SOUND_ON : SOUND_OFF)}
          </IconButton>
        </Box>
      </Box>

      {q.prompt && (
        <Box
          lang={TARGET_PROMPT.has(q.kind) ? lang : undefined}
          sx={
            q.kind === "cloze"
              ? { fontSize: 24, fontWeight: 500, lineHeight: 1.4, mt: 1.5, textWrap: "pretty" }
              : {
                  ...displayFontSx,
                  fontSize: "clamp(30px, 7vw, 44px)",
                  lineHeight: 1.15,
                  color: C.venice,
                  mt: 1.5,
                  textWrap: "balance",
                }
          }
        >
          {q.kind === "reverse"
            ? // English gloss: the word to translate stays big, bracketed notes shrink to a footnote.
              splitAsides(q.prompt).map((p, n) =>
                p.aside ? (
                  <Box
                    key={n}
                    component="span"
                    sx={{
                      fontFamily: "var(--font-body), system-ui, sans-serif",
                      fontSize: 18,
                      fontWeight: 500,
                      color: C.muted,
                    }}
                  >
                    {p.text}
                  </Box>
                ) : (
                  p.text
                )
              )
            : q.prompt}
        </Box>
      )}
      {q.hint && (q.kind !== "listen-type" || given !== null) && <Box sx={{ color: C.muted, mt: 0.75 }}>{q.hint}</Box>}

      {q.audio && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 2.5, mb: 0.5 }}>
          <IconButton
            onClick={() => play()}
            aria-label="Play the word again"
            sx={{ width: 64, height: 64, bgcolor: C.primary, color: C.onPrimary, "&:hover": { bgcolor: C.primary } }}
          >
            <SvgIcon sx={{ fontSize: 28 }}>
              <path d="M8 5v14l11-7z" />
            </SvgIcon>
          </IconButton>
          <Button variant="outlined" onClick={() => play(true)}>
            Slower
          </Button>
        </Box>
      )}

      {q.options ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 1.25, mt: 2.5 }}>
          {q.options.map((o, n) => {
            const right = o === q.answer
            const state = given === null ? undefined : right ? ANSWER.right : o === given ? ANSWER.wrong : ANSWER.dim
            return (
              <Button
                key={o}
                variant="outlined"
                onClick={() => answer(o)}
                disabled={given !== null}
                lang={answerLang}
                sx={{
                  justifyContent: "flex-start",
                  gap: 1.5,
                  textAlign: "left",
                  minHeight: 64,
                  px: 1.75,
                  py: 1.25,
                  bgcolor: C.merino,
                  color: C.venice,
                  borderColor: C.line,
                  borderWidth: 2,
                  borderRadius: `${RADIUS_SM}px`,
                  fontSize: 17,
                  fontWeight: 500,
                  lineHeight: 1.3,
                  "&:hover": { borderColor: C.venice, bgcolor: C.merino },
                  "&.Mui-disabled": { opacity: 1, color: C.venice, borderColor: C.line, ...state },
                }}
              >
                <Box
                  component="span"
                  aria-hidden
                  sx={{
                    ...numSx,
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    width: 28,
                    height: 28,
                    borderRadius: "8px",
                    border: `1.5px solid currentColor`,
                    fontSize: 14,
                    fontWeight: 600,
                    opacity: state ? 1 : 0.6,
                  }}
                >
                  {state === ANSWER.right ? "✓" : state === ANSWER.wrong ? "✕" : n + 1}
                </Box>
                {o}
              </Button>
            )
          })}
        </Box>
      ) : (
        <Box
          component="form"
          sx={{ display: "flex", gap: 1.25, mt: 2.5 }}
          onSubmit={(e) => {
            e.preventDefault()
            if (typed.trim()) answer(typed)
          }}
        >
          <TextField
            fullWidth
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type what you hear"
            autoFocus
            autoComplete="off"
            disabled={given !== null}
            slotProps={{ htmlInput: { "aria-label": "Your answer", autoCapitalize: "off", spellCheck: false, lang } }}
          />
          <Button type="submit" disabled={given !== null || !typed.trim()}>
            Check
          </Button>
        </Box>
      )}

      {result && (
        // Stays at the bottom of the viewport when the question is taller than the screen.
        <Box
          role="status"
          sx={{
            position: "sticky",
            bottom: 0,
            zIndex: Z.sticky,
            mx: -3,
            mb: -3,
            mt: 3,
            px: 3,
            pt: 2,
            pb: "calc(16px + env(safe-area-inset-bottom))",
            borderRadius: `0 0 ${RADIUS}px ${RADIUS}px`,
            bgcolor: result === "wrong" ? C.dangerSoft : C.greenSoft,
            color: result === "wrong" ? C.danger : C.green,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.75 }}>
            <SpeakButton text={q.reveal.text} audio={q.reveal.audio} size="sm" />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ ...displayFontSx, fontSize: 24, lineHeight: 1.2 }}>
                {result === "wrong" ? (entry.retry ? "Not this time" : "Not quite") : "Nice!"}
              </Box>
              <Box sx={{ fontSize: 16, mt: 0.25 }}>
                {result === "accent" && (
                  <>
                    Mind the accent: <b lang={lang}>{q.answer}</b>
                  </>
                )}
                {result === "wrong" && (
                  <>
                    Correct answer: <b lang={answerLang}>{q.answer}</b>
                    {!entry.retry && " · it'll come back once more"}
                  </>
                )}
                {result !== "wrong" && combo >= 3 && <>🔥 {combo} in a row</>}
              </Box>
            </Box>
          </Box>
          <Button
            fullWidth
            onClick={next}
            autoFocus
            sx={
              result === "wrong"
                ? { bgcolor: C.danger, color: C.merino, "&:hover": { bgcolor: C.danger } }
                : { bgcolor: C.green, color: C.merino, "&:hover": { bgcolor: C.green } }
            }
          >
            {last ? "Continue" : "Next"}
          </Button>
        </Box>
      )}
    </Paper>
  )
}
