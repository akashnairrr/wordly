"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import LinearProgress from "@mui/material/LinearProgress"
import List from "@mui/material/List"
import ListItemButton from "@mui/material/ListItemButton"
import Skeleton from "@mui/material/Skeleton"
import Typography from "@mui/material/Typography"
import NextLink from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Confetti } from "@/components/confetti"
import { EmptyState } from "@/components/empty-state"
import { ButtonLink } from "@/components/links"
import { MatchRound, matchPairs } from "@/components/match-round"
import { Quiz } from "@/components/quiz"
import { useSpeech } from "@/components/speech-provider"
import { StatLine } from "@/components/stat-line"
import { ToneChip } from "@/components/tone-chip"
import { WordCard } from "@/components/word-card"
import { fetchWord } from "@/lib/data"
import { getLanguage } from "@/lib/languages"
import { currentLevel, type Level, levelLabel, levelProgress } from "@/lib/levels"
import { recordSession, skipWord } from "@/lib/progress"
import { buildQuiz, type QuizQuestion, type QuizResult, type QuizSummary, summarize } from "@/lib/quiz"
import { playSfx } from "@/lib/sfx"
import { pickNewWords, planLesson, reviewQueue } from "@/lib/session"
import type { Word } from "@/lib/types"
import { wordHref } from "@/lib/words"
import { useIndex } from "@/hooks/use-index"
import { useProgress } from "@/hooks/use-progress"
import { C, displayFontSx, numSx, RADIUS, Z } from "@/theme"

interface Item {
  word: Word
  /** Already studied: shown again for revision. */
  review: boolean
}

interface TopProps {
  title: string
  sub?: string
  right?: string
}

/** Page title row: title on the left, optional detail on the right. */
function Top({ title, sub, right }: TopProps) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 1.5, mt: 3.5, mb: 1.5 }}>
      <div>
        <Typography variant="h1" sx={{ fontSize: 34 }}>
          {title}
        </Typography>
        {sub && <Typography variant="body2">{sub}</Typography>}
      </div>
      {right && (
        <Typography variant="body2" component="span" sx={numSx}>
          {right}
        </Typography>
      )}
    </Box>
  )
}

interface Outcome {
  summary: QuizSummary
  streak: number
  streakUp: boolean
  level: Level
  /** Level words studied before and after this session, out of `total`. */
  before: number
  after: number
  total: number
}

type Phase =
  | { name: "learn"; card: number }
  | { name: "quiz"; questions: QuizQuestion[] }
  | { name: "match"; attempts: QuizResult[]; pairs: ReturnType<typeof matchPairs> }
  | { name: "results"; outcome: Outcome }

/** Counts up from 0 to `to` over a second. */
function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let frame = 0
    const start = performance.now()
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 1000)
      setN(Math.round(to * (1 - (1 - k) ** 3)))
      if (k < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [to])
  return <>{n}</>
}

/** Level bar that starts at `from` and fills to `to`. */
function LevelFill({ from, to, total }: { from: number; to: number; total: number }) {
  const [value, setValue] = useState(from)
  useEffect(() => {
    const t = setTimeout(() => setValue(to), 400)
    return () => clearTimeout(t)
  }, [to])
  return (
    <LinearProgress
      value={(value / total) * 100}
      aria-label="Level progress"
      sx={{ height: 10, "& .MuiLinearProgress-bar": { transitionDuration: "1s" } }}
    />
  )
}

interface SessionViewProps {
  lang: string
}

/** Remounts a fresh session whenever the URL (lesson vs review) changes or the learner starts another round. */
export function SessionView({ lang }: SessionViewProps) {
  const params = useSearchParams()
  const [round, setRound] = useState(0)
  return (
    <Session
      key={`${params.toString()}#${round}`}
      lang={lang}
      mode={params.get("mode") === "review" ? "review" : "lesson"}
      onlyPractice={params.get("filter") === "practice"}
      onRestart={() => setRound((r) => r + 1)}
    />
  )
}

interface SessionProps {
  lang: string
  mode: "lesson" | "review"
  onlyPractice: boolean
  onRestart: () => void
}

function Session({ lang, mode, onlyPractice, onRestart }: SessionProps) {
  const language = getLanguage(lang)
  const [progress, update] = useProgress(lang)
  const { index, error: indexError } = useIndex(lang)
  const { available } = useSpeech()
  const [items, setItems] = useState<Item[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>({ name: "learn", card: 0 })
  const [notice, setNotice] = useState<string | null>(null)
  const started = useRef(false)

  // Pick the words once; recording results updates progress and must not reshuffle them.
  useEffect(() => {
    if (!progress || !index || started.current) return
    started.current = true
    const size = progress.settings.sessionSize
    let picks: { id: string; review: boolean }[]
    if (mode === "review") {
      picks = reviewQueue(index, progress, onlyPractice)
        .slice(0, size)
        .map((w) => ({ id: w.id, review: true }))
    } else {
      const plan = planLesson(index, progress, size)
      picks = [
        ...plan.fresh.map((w) => ({ id: w.id, review: false })),
        ...plan.review.map((w) => ({ id: w.id, review: true })),
      ]
    }
    Promise.all(picks.map(async (p) => ({ word: await fetchWord(lang, p.id), review: p.review }))).then(
      setItems,
      (e: Error) => setError(e.message)
    )
  }, [progress, index, lang, mode, onlyPractice])

  if (error || indexError) return <EmptyState text={`Could not load words: ${error ?? indexError}`} />
  if (!items || !progress || !index) return <Skeleton sx={{ mt: 3, minHeight: 420 }} />

  if (!items.length)
    return (
      <EmptyState
        title={
          <Typography variant="h1" sx={{ fontSize: 32, mb: 1.5 }}>
            {mode === "review" ? "Nothing to review yet" : "You've covered every word"}
          </Typography>
        }
        text={
          mode === "review"
            ? "Finish a lesson first; studied words show up here."
            : "Revisit what you've learned instead."
        }
      >
        <ButtonLink href={mode === "review" ? `/${lang}/session/` : `/${lang}/session/?mode=review`}>
          {mode === "review" ? "Start a lesson" : "Review studied words"}
        </ButtonLink>
      </EmptyState>
    )

  const title = mode === "review" ? (onlyPractice ? "Practice weak words" : "Review") : "Lesson"

  if (phase.name === "learn") {
    const card = Math.min(phase.card, items.length - 1)
    const item = items[card]
    if (!item) return null
    const last = card === items.length - 1
    const counts =
      mode === "lesson"
        ? `${items.filter((i) => !i.review).length} new · ${items.filter((i) => i.review).length} review`
        : `${items.length} words`

    const skip = async () => {
      const skipped = item.word
      let replacement: Item | undefined
      if (!item.review) {
        // Skipped new words never come back as new; pull in the next word so the lesson keeps its size.
        update((p) => skipWord(p, skipped.id))
        const next = pickNewWords(index!, skipWord(progress!, skipped.id), 1, new Set(items!.map((i) => i.word.id)))[0]
        // Replacement failed to load: carry on one word shorter rather than leave the skipped word on screen.
        const word = next && (await fetchWord(lang, next.id).catch(() => undefined))
        if (word) replacement = { word, review: false }
      }
      const rest = items!.filter((i) => i !== item)
      const nextItems = replacement ? [...rest, replacement] : rest
      setItems(nextItems)
      // The following word slides into this position.
      setPhase({ name: "learn", card: Math.max(0, Math.min(card, nextItems.length - 1)) })
      setNotice(
        item.review
          ? `Skipped “${skipped.lemma}” for this session.`
          : `Skipped “${skipped.lemma}”. It won't appear in lessons; bring it back from Words.`
      )
    }

    return (
      <>
        <Top title={title} sub={counts} right={`${card + 1} / ${items.length}`} />
        <LinearProgress value={((card + 1) / items.length) * 100} aria-label="Lesson progress" sx={{ mb: 2.25 }} />
        {notice && (
          <Alert role="status" sx={{ mb: 1.75 }}>
            {notice}
          </Alert>
        )}
        <WordCard
          key={item.word.id}
          word={item.word}
          lang={lang}
          autoSpeak
          badge={item.review ? "Review" : undefined}
        />
        {/* Stays at the bottom of the viewport on long cards. */}
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            zIndex: Z.sticky,
            display: "flex",
            gap: 1.25,
            pt: 1.5,
            pb: "calc(12px + env(safe-area-inset-bottom))",
            mt: 2,
            bgcolor: C.merino,
            borderTop: `1px solid ${C.line}`,
          }}
        >
          <Button
            variant="outlined"
            disabled={card === 0}
            onClick={() => setPhase({ name: "learn", card: card - 1 })}
            aria-label="Previous word"
          >
            ←
          </Button>
          <Button variant="text" onClick={() => void skip()}>
            Skip word
          </Button>
          <Button
            sx={{ flex: 1 }}
            onClick={() => {
              setNotice(null)
              if (last)
                setPhase({
                  name: "quiz",
                  questions: buildQuiz(
                    items.map((i) => i.word),
                    index,
                    language,
                    { speech: available === true }
                  ),
                })
              else setPhase({ name: "learn", card: card + 1 })
            }}
          >
            {last ? "Start quiz" : "Next word"}
          </Button>
        </Box>
      </>
    )
  }

  const sound = progress.settings.sound
  const toggleSound = () => update((p) => ({ ...p, settings: { ...p.settings, sound: !p.settings.sound } }))

  const finish = (attempts: QuizResult[], matchMistakes?: number) => {
    // Earlier sessions with each word: reviews earn less XP than first study.
    const summary = summarize(
      attempts,
      matchMistakes,
      (id) => progress.history.filter((h) => h.words.includes(id)).length
    )
    const now = new Date()
    const record = (p: typeof progress) => recordSession(p, summary.progress, mode, now, summary.xp)
    const after = record(progress)
    const level = currentLevel(index, progress)
    const { done: before, total } = levelProgress(index, progress, level)
    update(record)
    if (sound) playSfx("done")
    setPhase({
      name: "results",
      outcome: {
        summary,
        streak: after.streak,
        streakUp: after.streak > progress.streak,
        level,
        before,
        after: levelProgress(index, after, level).done,
        total,
      },
    })
  }

  if (phase.name === "quiz") {
    return (
      <>
        <Top title="Quiz" />
        <Quiz
          questions={phase.questions}
          lang={lang}
          sound={sound}
          onToggleSound={toggleSound}
          onDone={(attempts) => {
            const pairs = matchPairs(items.map((i) => i.word))
            // Too few distinct words left (skips) for a match round: straight to results.
            if (pairs.length < 3) finish(attempts)
            else setPhase({ name: "match", attempts, pairs })
          }}
        />
      </>
    )
  }

  if (phase.name === "match") {
    const { attempts } = phase
    return (
      <>
        <Top title="Quiz" />
        <MatchRound pairs={phase.pairs} lang={lang} sound={sound} onDone={(mistakes) => finish(attempts, mistakes)} />
      </>
    )
  }

  const { summary, streak, streakUp, level, before, after, total } = phase.outcome
  const missed = items.filter((i) => summary.missed.includes(i.word.id))
  const perfect = summary.score === summary.total
  return (
    <>
      <Box
        component="section"
        sx={{
          position: "relative",
          overflow: "hidden",
          mt: 3.5,
          p: 3,
          textAlign: "center",
          bgcolor: C.tintSoft,
          boxShadow: `inset 0 0 0 2px ${C.rock}`,
          borderRadius: `${RADIUS}px`,
        }}
      >
        <Confetti />
        <Box component="span" sx={{ fontSize: 14, fontWeight: 600 }}>
          {title} complete
        </Box>
        <Box sx={{ ...displayFontSx, ...numSx, fontSize: 72, lineHeight: 1, my: 1 }}>
          +<CountUp to={summary.xp} /> XP
        </Box>
        {summary.share < 1 && (
          <Box sx={{ fontSize: 14, color: C.muted, mb: 1 }}>Words you&apos;ve reviewed before earn less XP.</Box>
        )}
        <Box component="p" sx={{ m: 0 }}>
          {perfect
            ? "Flawless. Every answer right the first time."
            : missed.length === 0
              ? "You fixed every miss on the second try."
              : `${missed.length} word${missed.length > 1 ? "s" : ""} to practise again.`}
        </Box>
      </Box>
      <StatLine
        stats={[
          {
            label: "Accuracy",
            value: `${summary.total ? Math.round((summary.score / summary.total) * 100) : 0}%`,
          },
          { label: "Best combo", value: `🔥 ${summary.bestCombo}` },
          {
            label: "Day streak",
            value: (
              <>
                {streak}
                {streakUp && (
                  <Box component="span" sx={{ fontSize: 16, color: C.green, ml: 0.75, verticalAlign: "middle" }}>
                    +1
                  </Box>
                )}
              </>
            ),
          },
        ]}
      />
      {total > 0 && (
        <Box sx={{ mt: 2.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, fontSize: 14 }}>
            <Box component="span" sx={{ fontWeight: 600 }}>
              {levelLabel(level)}
            </Box>
            <Box component="span" sx={{ ...numSx, color: C.muted }}>
              {after} / {total}
              {after > before && ` (+${after - before})`}
            </Box>
          </Box>
          <LevelFill from={before} to={after} total={total} />
        </Box>
      )}
      <List disablePadding sx={{ mt: 2.5, borderTop: `1px solid ${C.line}` }}>
        {items.map(({ word, review }) => {
          const wrong = summary.progress.filter((r) => r.wordId === word.id && !r.correct).length
          return (
            <li key={word.id}>
              <ListItemButton
                component={NextLink}
                href={wordHref(lang, word.id)}
                sx={{
                  justifyContent: "space-between",
                  gap: 1.5,
                  py: 1.75,
                  px: 0.25,
                  borderBottom: `1px solid ${C.line}`,
                  "&:hover b": { color: C.venice },
                }}
              >
                <span>
                  <b lang={lang}>{word.lemma}</b>{" "}
                  <Box component="span" sx={{ color: C.muted }}>
                    {word.glosses[0]}
                  </Box>
                </span>
                <Box component="span" sx={{ display: "flex", gap: 1.25 }}>
                  {review && <ToneChip label="review" />}
                  <ToneChip tone={wrong ? "practice" : "studied"} label={wrong ? `${wrong} missed` : "✓"} />
                </Box>
              </ListItemButton>
            </li>
          )
        })}
      </List>
      {/* Equal widths, wrapping on phones; the filled button carries on with the same kind of session. */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, mt: 2.5, "& > *": { flex: "1 1 160px" } }}>
        <ButtonLink href={`/${lang}/`} variant="contained">
          Home
        </ButtonLink>
        {missed.length > 0 && (
          <ButtonLink href={`/${lang}/session/?mode=review&filter=practice`} variant="outlined" onClick={onRestart}>
            Practise missed words
          </ButtonLink>
        )}
        <ButtonLink href={`/${lang}/session/?mode=review`} variant="outlined" onClick={onRestart}>
          {mode === "review" ? "Review more" : "Review"}
        </ButtonLink>
        <ButtonLink
          href={`/${lang}/session/`}
          variant={mode === "lesson" ? "contained" : "outlined"}
          onClick={onRestart}
        >
          Next lesson
        </ButtonLink>
      </Box>
    </>
  )
}
