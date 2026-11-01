"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import LinearProgress from "@mui/material/LinearProgress"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import Paper from "@mui/material/Paper"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import Typography from "@mui/material/Typography"
import { useState } from "react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { ButtonLink, TextLink } from "@/components/links"
import { useSpeech } from "@/components/speech-provider"
import { StatLine } from "@/components/stat-line"
import { ToneChip } from "@/components/tone-chip"
import { getLanguage, POS_LABELS } from "@/lib/languages"
import { LEVELS, levelProgress } from "@/lib/levels"
import { emptyProgress, parseBackup } from "@/lib/progress"
import { isNaturalVoice, RATES } from "@/lib/speech"
import type { Pos } from "@/lib/types"
import { useIndex } from "@/hooks/use-index"
import { useProgress } from "@/hooks/use-progress"
import { C, numSx } from "@/theme"

const SPEEDS = [
  { rate: 0.8, label: "Slower" },
  { rate: RATES.normal, label: "Natural" },
  { rate: 1.1, label: "Faster" },
]

interface SectionProps {
  title: string
  children: React.ReactNode
}

function Section({ title, children }: SectionProps) {
  return (
    <Box component="section" sx={{ mt: 5 }}>
      <Typography variant="h2" sx={{ mb: 1.75 }}>
        {title}
      </Typography>
      {children}
    </Box>
  )
}

interface ProgressViewProps {
  lang: string
}

export function ProgressView({ lang }: ProgressViewProps) {
  const language = getLanguage(lang)
  const [progress, update] = useProgress(lang)
  const { index } = useIndex(lang)
  const { voices, voice, available, say } = useSpeech()
  const [message, setMessage] = useState<{ text: string; bad?: boolean } | null>(null)

  if (!progress) return <Skeleton sx={{ mt: 3, minHeight: 480 }} />

  const learnedIds = Object.keys(progress.learned)
  const posOf = new Map(index?.map((w) => [w.id, w.pos]))
  const byPos = learnedIds.reduce<Partial<Record<Pos, number>>>((acc, id) => {
    const pos = posOf.get(id)
    if (pos) acc[pos] = (acc[pos] ?? 0) + 1
    return acc
  }, {})
  const total = index?.length ?? 0
  const hasNatural = voices.some(isNaturalVoice)

  function exportBackup() {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: "application/json" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `wordly-${lang}-backup.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function importBackup(file: File) {
    file.text().then(
      (text) => {
        try {
          const p = parseBackup(text)
          update(() => p)
          setMessage({ text: "Backup imported." })
        } catch {
          setMessage({ text: "That file isn't a Wordly backup.", bad: true })
        }
      },
      () => setMessage({ text: "Could not read that file.", bad: true })
    )
  }

  return (
    <>
      <Typography variant="h1" sx={{ mt: 3.5 }}>
        Progress
      </Typography>

      <StatLine
        stats={[
          { label: "Words studied", value: learnedIds.length },
          { label: "Sessions", value: progress.history.length },
          { label: "Day streak", value: progress.streak },
        ]}
      />
      {total > 0 && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress value={(learnedIds.length / total) * 100} aria-label="Words studied" />
          <Typography variant="body2" sx={{ ...numSx, my: 1.5 }}>
            {learnedIds.length} studied · {Object.keys(progress.skipped).length} skipped
          </Typography>
        </Box>
      )}
      {Object.keys(byPos).length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
          {Object.entries(byPos).map(([pos, n]) => (
            <ToneChip key={pos} label={`${POS_LABELS[pos as Pos]} ${n}`} />
          ))}
        </Box>
      )}

      {index && (
        <Section title="Levels">
          <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gap: 1.75 }}>
            {LEVELS.map((l) => {
              const { done, total: inLevel } = levelProgress(index, progress, l)
              return (
                <li key={l.n}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, fontSize: 15 }}>
                    <span>
                      <b>Level {l.n}</b> · {l.name}
                    </span>
                    {/* Studied only: level sizes would add up to the list's size. The bar shows how far along. */}
                    <Box component="span" sx={{ ...numSx, color: C.muted }}>
                      {done} studied
                    </Box>
                  </Box>
                  <LinearProgress
                    value={(done / Math.max(1, inLevel)) * 100}
                    aria-label={`Level ${l.n} progress`}
                    sx={{ mt: 0.75 }}
                  />
                </li>
              )
            })}
          </Box>
        </Section>
      )}

      <Section title="History">
        {progress.history.length === 0 ? (
          <Paper variant="outlined">
            <EmptyState text="Finished lessons and reviews appear here.">
              <ButtonLink href={`/${lang}/session/`}>Start a lesson</ButtonLink>
            </EmptyState>
          </Paper>
        ) : (
          <List disablePadding sx={{ borderTop: `1px solid ${C.line}` }}>
            {progress.history.slice(0, 30).map((h) => (
              <ListItem
                key={h.date}
                sx={{
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  py: 1.5,
                  px: 0.25,
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                <span>
                  <b>{h.kind === "review" ? "Review" : "Lesson"}</b>{" "}
                  <Typography variant="body2" component="span">
                    {new Date(h.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })} ·{" "}
                    {h.words.length} words
                  </Typography>
                </span>
                <Box component="span" sx={numSx}>
                  {h.score}/{h.total}
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Section>

      <Section title="Pronunciation">
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
            <Box component="p" sx={{ m: 0 }}>
              Most words and sentences play <b>recordings of native speakers</b>. A synthetic voice is used only where
              no recording exists.
            </Box>
            {available === false ? (
              <Typography variant="body2">
                This browser has no {language.name} voice installed, so those few will be silent. Add one in your system
                speech settings, then reload.
              </Typography>
            ) : (
              <>
                <Box sx={{ width: "100%" }}>
                  <TextField
                    select
                    fullWidth
                    label="Fallback voice"
                    value={voice?.voiceURI ?? ""}
                    onChange={(e) => update((p) => ({ ...p, settings: { ...p.settings, voiceURI: e.target.value } }))}
                    slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
                  >
                    {voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang}){isNaturalVoice(v) ? " · natural" : ""}
                      </option>
                    ))}
                  </TextField>
                  {!hasNatural && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Only basic voices are available. For a more human sound: macOS → System Settings → Accessibility →
                      Spoken Content → System voice → Manage Voices → {language.name}, download an “Enhanced” or
                      “Premium” voice. Microsoft Edge and Chrome also include natural online voices.
                    </Typography>
                  )}
                </Box>
                <div>
                  <Box component="span" id="speed-label" sx={{ fontSize: 14, fontWeight: 600, color: C.muted }}>
                    Speed
                  </Box>
                  <ToggleButtonGroup
                    exclusive
                    value={progress.settings.rate}
                    onChange={(_, rate: number | null) =>
                      rate !== null && update((p) => ({ ...p, settings: { ...p.settings, rate } }))
                    }
                    aria-labelledby="speed-label"
                    sx={{ display: "flex" }}
                  >
                    {SPEEDS.map((s) => (
                      <ToggleButton key={s.rate} value={s.rate}>
                        {s.label}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </div>
                <Button variant="outlined" onClick={() => say(language.sample)}>
                  Test fallback voice
                </Button>
              </>
            )}
          </Stack>
        </Paper>
      </Section>

      <Section title="Backup">
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <Box component="p" sx={{ m: 0, color: C.muted }}>
              Progress lives only in this browser. Clearing site data erases it, so export a backup now and then.
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25 }}>
              <Button onClick={exportBackup}>Export backup</Button>
              <Button variant="outlined" component="label">
                Import backup
                <input
                  type="file"
                  accept="application/json"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) importBackup(f)
                    e.target.value = ""
                  }}
                />
              </Button>
              <ConfirmDialog
                trigger="Reset progress"
                title={`Reset ${language.name} progress?`}
                body="This deletes every studied word, skip and session on this device. It can't be undone unless you've exported a backup."
                confirmLabel="Delete progress"
                onConfirm={() => {
                  update(() => emptyProgress())
                  setMessage({ text: "Progress reset." })
                }}
              />
            </Box>
            {message && (
              <Alert role="status" sx={message.bad ? { bgcolor: C.dangerSoft, color: C.danger } : undefined}>
                {message.text}
              </Alert>
            )}
          </Stack>
        </Paper>
      </Section>

      <Typography variant="body2" sx={{ mt: 4 }}>
        <TextLink href="/about/">Data sources & credits</TextLink>
      </Typography>
    </>
  )
}
