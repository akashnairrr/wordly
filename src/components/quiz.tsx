"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import Paper from "@mui/material/Paper"
import SvgIcon from "@mui/material/SvgIcon"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useEffect, useState } from "react"
import { grade, QUESTION_TITLES, type Grade, type QuizQuestion } from "@/lib/quiz"
import { C, displayFontSx, numSx, RADIUS_SM } from "@/theme"
import { SpeakButton } from "./speak-button"
import { useSpeech } from "./speech-provider"

export interface QuizResult {
  question: QuizQuestion
  given: string
  grade: Grade
}

// Prompts written in the language being learned (the rest are English).
const TARGET_PROMPT = new Set<QuizQuestion["kind"]>(["meaning", "cloze", "conjugation", "gender", "gendered-form"])

const OPTION = {
  right: { borderColor: C.rock, bgcolor: C.tintSoft, color: C.venice, fontWeight: 600 },
  wrong: { borderColor: C.danger, bgcolor: C.dangerSoft, color: C.danger },
  dim: { opacity: 0.5 },
} as const

interface QuizProps {
  questions: QuizQuestion[]
  lang: string
  onDone: (results: QuizResult[]) => void
}

/** Runs the questions in order. There's deliberately no skip: every question must be answered. */
export function Quiz({ questions, lang, onDone }: QuizProps) {
  const { say } = useSpeech()
  const [i, setI] = useState(0)
  const [given, setGiven] = useState<string | null>(null)
  const [typed, setTyped] = useState("")
  const [results, setResults] = useState<QuizResult[]>([])
  const q = questions[i]

  // Listening questions play as soon as they appear.
  useEffect(() => {
    if (q?.audio) say(q.audio, { audio: q.audioUrl })
  }, [q, say])

  if (!q) return null
  const result = given === null ? null : grade(q, given)
  const play = (slow = false) => q.audio && say(q.audio, { audio: q.audioUrl, slow })

  const answer = (value: string) => {
    if (given !== null) return
    // Hear the right answer straight away, whether or not it was chosen, as extra listening practice.
    say(q.reveal.text, { audio: q.reveal.audio })
    setGiven(value)
    setResults((r) => [...r, { question: q, given: value, grade: grade(q, value) }])
  }

  function next() {
    if (i + 1 >= questions.length) return onDone(results)
    setI(i + 1)
    setGiven(null)
    setTyped("")
  }

  return (
    <Paper component="section" variant="outlined" aria-label="Quiz" sx={{ p: 3 }}>
      <Box aria-hidden sx={{ display: "flex", gap: 0.5, mb: 2.25 }}>
        {questions.map((_, n) => (
          <Box
            key={n}
            sx={{
              flex: 1,
              height: 6,
              borderRadius: 999,
              bgcolor: n < i || (n === i && given !== null) ? C.venice : n === i ? C.rock : C.line,
            }}
          />
        ))}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.5 }}>
        <Box component="span" sx={{ fontSize: 14, fontWeight: 600, color: C.muted }}>
          {QUESTION_TITLES[q.kind]}
        </Box>
        <Typography variant="body2" component="span" sx={numSx}>
          {i + 1} of {questions.length}
        </Typography>
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
          {q.prompt}
        </Box>
      )}
      {q.hint && (q.kind !== "listen-type" || given !== null) && <Box sx={{ color: C.muted, mt: 0.75 }}>{q.hint}</Box>}

      {q.audio && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 2.5, mb: 0.5 }}>
          <IconButton
            onClick={() => play()}
            aria-label="Play the word again"
            sx={{ width: 64, height: 64, bgcolor: C.venice, color: C.merino, "&:hover": { bgcolor: C.venice } }}
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
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 1.25, mt: 2.5 }}>
          {q.options.map((o) => {
            const state =
              given === null ? undefined : o === q.answer ? OPTION.right : o === given ? OPTION.wrong : OPTION.dim
            return (
              <Button
                key={o}
                variant="outlined"
                onClick={() => answer(o)}
                disabled={given !== null}
                sx={{
                  justifyContent: "flex-start",
                  textAlign: "left",
                  minHeight: 56,
                  px: 2,
                  py: 1.5,
                  bgcolor: C.merino,
                  color: C.venice,
                  borderColor: C.line,
                  borderRadius: `${RADIUS_SM}px`,
                  fontWeight: 400,
                  "&:hover": { borderColor: C.venice, bgcolor: C.merino },
                  "&.Mui-disabled": { opacity: 1, color: C.venice, borderColor: C.line, ...state },
                }}
              >
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
        <Alert
          role="status"
          sx={{
            mt: 2.5,
            alignItems: "center",
            ...(result === "wrong" && { bgcolor: C.dangerSoft, color: C.danger }),
            "& .MuiAlert-message": { flex: 1 },
          }}
          action={
            <Button onClick={next} autoFocus>
              {i + 1 >= questions.length ? "See results" : "Next"}
            </Button>
          }
        >
          <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1.25, fontSize: 17 }}>
            <SpeakButton text={q.reveal.text} audio={q.reveal.audio} size="sm" />
            <span>
              {result === "correct" && "Correct!"}
              {result === "accent" && (
                <>
                  Correct. Mind the accent: <b lang={lang}>{q.answer}</b>
                </>
              )}
              {result === "wrong" && (
                <>
                  The answer is <b lang={lang}>{q.answer}</b>
                </>
              )}
            </span>
          </Box>
        </Alert>
      )}
    </Paper>
  )
}
