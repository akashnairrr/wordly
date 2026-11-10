"use client"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import Paper from "@mui/material/Paper"
import SvgIcon from "@mui/material/SvgIcon"
import TextField from "@mui/material/TextField"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import { useRef, useState, useSyncExternalStore, useTransition } from "react"
import { COLORS } from "@/components/example-list"
import { noSubscribe } from "@/components/links"
import { SpeakButton } from "@/components/speak-button"
import { getLanguage } from "@/lib/languages"
import { C } from "@/theme"
import { translate, type TranslateResult } from "./actions"

// Same cap as the server action.
const MAX_CHARS = 1000

// Web Speech API recognition: Chrome, Edge and Safari (prefixed); not in TypeScript's DOM types, and not in Firefox.
interface Recognition {
  lang: string
  interimResults: boolean
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void
  onerror: (e: { error: string }) => void
  onend: () => void
  start: () => void
  stop: () => void
}
type RecognitionCtor = new () => Recognition
const getRecognition = (): RecognitionCtor | undefined => {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

interface TranslateViewProps {
  lang: string
}

export function TranslateView({ lang }: TranslateViewProps) {
  const language = getLanguage(lang)
  const [text, setText] = useState("")
  const [result, setResult] = useState<TranslateResult | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [listening, setListening] = useState(false)
  const recognition = useRef<Recognition | null>(null)
  // Only the browser knows whether speech recognition exists; the static HTML leaves the mic out.
  const SpeechRec = useSyncExternalStore(noSubscribe, getRecognition, () => undefined)

  const run = (input: string) => {
    if (!input.trim()) return
    startTransition(async () => setResult(await translate(input, lang)))
  }

  const toggleMic = () => {
    if (listening) return recognition.current?.stop()
    if (!SpeechRec) return
    const rec = new SpeechRec()
    rec.lang = "en-US"
    rec.interimResults = true
    let heard = ""
    rec.onresult = (e) => {
      heard = Array.from(e.results, (r) => r[0]?.transcript ?? "").join("")
      setText(heard.slice(0, MAX_CHARS))
    }
    rec.onerror = (e) =>
      setMicError(e.error === "not-allowed" ? "Microphone access is blocked for this site." : "Didn't catch that.")
    rec.onend = () => {
      setListening(false)
      run(heard.slice(0, MAX_CHARS))
    }
    recognition.current = rec
    setMicError(null)
    setListening(true)
    rec.start()
  }

  return (
    <>
      <Typography variant="h1" sx={{ mt: 3.5, mb: 1 }}>
        Translate to {language.name}
      </Typography>
      <Box component="p" sx={{ mt: 0, color: C.muted, maxWidth: "52ch" }}>
        Write or say something in English. Hover or tap a word of the translation to see what it means.
      </Box>
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault()
          run(text)
        }}
        sx={{ mt: 3 }}
      >
        <TextField
          label="English"
          multiline
          minRows={3}
          fullWidth
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              run(text)
            }
          }}
          slotProps={{ htmlInput: { maxLength: MAX_CHARS, lang: "en" } }}
          helperText={`${text.length} / ${MAX_CHARS}`}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1.5 }}>
          <Button type="submit" disabled={pending || !text.trim()}>
            {pending ? "Translating…" : "Translate"}
          </Button>
          {SpeechRec && (
            <IconButton
              onClick={toggleMic}
              aria-pressed={listening}
              aria-label={listening ? "Stop listening" : "Speak in English"}
              title={listening ? "Stop listening" : "Speak in English"}
              sx={{
                width: 48,
                height: 48,
                border: `1px solid ${C.lineStrong}`,
                color: listening ? C.onPrimary : C.venice,
                bgcolor: listening ? C.primary : undefined,
                "&:hover": { bgcolor: listening ? C.primary : C.tintSoft },
              }}
            >
              <MicIcon />
            </IconButton>
          )}
          {listening && (
            <Box component="span" sx={{ fontSize: 14, color: C.muted }}>
              Listening…
            </Box>
          )}
        </Box>
        {micError && (
          <Box component="p" role="alert" sx={{ color: C.danger, fontSize: 15 }}>
            {micError}
          </Box>
        )}
      </Box>
      {result && "error" in result && (
        <Box component="p" role="alert" sx={{ mt: 3, color: C.danger }}>
          {result.error}
        </Box>
      )}
      {result && "text" in result && (
        <Paper variant="outlined" sx={{ mt: 3, p: 2.5, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <GlossedText text={result.text} words={result.words} lang={lang} />
          <SpeakButton text={result.text} />
        </Paper>
      )}
    </>
  )
}

interface GlossedTextProps {
  text: string
  words: Record<string, string>
  lang: string
}

/** The translation with each word's meaning in a tooltip; a word lights up only while hovered or focused. */
function GlossedText({ text, words, lang }: GlossedTextProps) {
  // Odd entries are letter runs (the tokens the server glossed); even entries are spaces and punctuation.
  const parts = text.split(/(\p{L}+)/u)
  let color = 0
  return (
    <Box component="p" lang={lang} aria-live="polite" sx={{ m: 0, flex: 1, fontSize: 22, lineHeight: 1.8 }}>
      {parts.map((part, k) => {
        const meaning = k % 2 ? words[part.toLowerCase()] : undefined
        if (!meaning) return part
        const c = COLORS[color++ % COLORS.length]!
        return (
          <Tooltip key={k} title={meaning} arrow enterTouchDelay={0} leaveTouchDelay={4000}>
            <Box
              component="span"
              tabIndex={0}
              sx={{
                px: "3px",
                mx: "-3px",
                borderRadius: "6px",
                cursor: "pointer",
                boxDecorationBreak: "clone",
                transition: "background-color 120ms",
                "&:hover, &:focus-visible": { bgcolor: c.bg, color: c.fg, outline: "none" },
              }}
            >
              {part}
            </Box>
          </Tooltip>
        )
      })}
    </Box>
  )
}

function MicIcon() {
  return (
    <SvgIcon
      sx={{ fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </SvgIcon>
  )
}
