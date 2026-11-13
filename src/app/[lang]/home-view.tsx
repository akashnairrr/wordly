"use client"

import Box from "@mui/material/Box"
import LinearProgress from "@mui/material/LinearProgress"
import Paper from "@mui/material/Paper"
import Skeleton from "@mui/material/Skeleton"
import Typography from "@mui/material/Typography"
import { CoursePath, WordChip } from "@/components/course-path"
import { ButtonLink, TextLink } from "@/components/links"
import { SessionSizePicker } from "@/components/session-size-picker"
import { StatLine } from "@/components/stat-line"
import { getLanguage } from "@/lib/languages"
import { clampSize, planLesson, reviewQueue, sizeRange } from "@/lib/session"
import { courseUnits, currentStage, lessonsOf, stageDone } from "@/lib/units"
import { useIndex } from "@/hooks/use-index"
import { useProgress } from "@/hooks/use-progress"
import { C, displayFontSx, numSx, RADIUS } from "@/theme"

interface HomeViewProps {
  lang: string
}

export function HomeView({ lang }: HomeViewProps) {
  const language = getLanguage(lang)
  const [progress, update] = useProgress(lang)
  const { index, error } = useIndex(lang)

  if (error) return <Box sx={{ textAlign: "center", py: 5 }}>Could not load words: {error}</Box>
  if (!progress || !index)
    return (
      <Box aria-busy sx={{ display: "grid", gap: 2, mt: 3 }}>
        <Skeleton sx={{ minHeight: 260 }} />
        <Skeleton sx={{ minHeight: 120 }} />
      </Box>
    )

  const learned = Object.values(progress.learned)
  const answers = learned.reduce((n, w) => n + w.correct + w.wrong, 0)
  const correct = learned.reduce((n, w) => n + w.correct, 0)
  // The lesson-size slider follows the current unit's size; the stored choice is kept and clamped to it.
  const range = sizeRange(index, progress)
  const size = clampSize(progress.settings.sessionSize, range)
  const { fresh, review } = planLesson(index, progress, size)
  const studied = reviewQueue(index, progress)
  const weak = reviewQueue(index, progress, true)
  const stage = currentStage(index, progress)
  const stageWords = { done: stageDone(stage, progress), total: stage.words.length }
  // Lessons take `size` words at a time, so a unit is a handful of lessons.
  const { lesson, lessons } = lessonsOf(stageWords.total, stageWords.done, size)
  const units = courseUnits(index, progress)
  const unitsDone = units.filter((u) => u.done === u.words.length).length
  // Languages with a themed course show units and lessons; the rest still count words by frequency level.
  const course = units.length > 0
  const heroTitle = { fontSize: "clamp(34px, 7vw, 54px)", fontWeight: 800, maxWidth: "14ch" } as const

  return (
    <>
      <Box
        component="section"
        sx={{
          mt: 3,
          p: "clamp(24px, 6vw, 44px)",
          bgcolor: C.tintSoft,
          boxShadow: `inset 0 0 0 2px ${C.rock}`,
          borderRadius: `${RADIUS}px`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            mb: 1,
          }}
        >
          <Box component="p" lang={lang} sx={{ ...displayFontSx, fontSize: 22, m: 0 }}>
            {language.greeting}
          </Box>
          <Box sx={{ minWidth: 200, flex: "0 1 260px" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, fontSize: 14 }}>
              <Box component="span" sx={{ fontWeight: 600 }}>
                {course ? `Lesson ${lesson} of ${lessons}` : stage.label}
              </Box>
              {!course && (
                <Box component="span" sx={{ ...numSx, color: C.muted }}>
                  {stageWords.done} studied
                </Box>
              )}
            </Box>
            <LinearProgress
              value={course ? ((lesson - 1) / lessons) * 100 : (stageWords.done / Math.max(1, stageWords.total)) * 100}
              aria-label={`${stage.label} progress`}
              sx={{ mt: 0.75, bgcolor: C.surface }}
            />
          </Box>
        </Box>
        {fresh.length ? (
          <>
            {course ? (
              <>
                <Box component="p" sx={{ m: "8px 0 4px", fontWeight: 700, color: C.venice }}>
                  {stage.kicker}
                </Box>
                <Typography variant="h1" sx={heroTitle}>
                  {stage.title}
                </Typography>
              </>
            ) : (
              <Typography variant="h1" sx={heroTitle}>
                {fresh.length} new {language.name} words are waiting.
              </Typography>
            )}
            <Box component="p" sx={{ mt: 1.75, mb: 3, maxWidth: "46ch", opacity: 0.9 }}>
              Learn {fresh.length} new words in real sentences, hear a native speaker, then take a short quiz.
              {review.length > 0 &&
                ` ${review.length} word${review.length > 1 ? "s" : ""} you've studied will come back too.`}
            </Box>
            <ButtonLink href={`/${lang}/session/`}>
              {course ? `${lesson > 1 ? "Continue" : "Start"} lesson ${lesson}` : "Start lesson"}
            </ButtonLink>
          </>
        ) : (
          <>
            <Typography variant="h1" sx={{ ...heroTitle, mb: 3 }}>
              You&apos;ve studied every word on the list.
            </Typography>
            <ButtonLink href={`/${lang}/session/?mode=review`}>Review studied words</ButtonLink>
          </>
        )}
      </Box>

      <StatLine
        stats={[
          course
            ? { label: "Units completed", value: `${unitsDone}/${units.length}` }
            : { label: "Words studied", value: learned.length },
          { label: "Day streak", value: progress.streak },
          { label: "XP", value: progress.xp },
          { label: "Quiz accuracy", value: answers ? `${Math.round((correct / answers) * 100)}%` : "–" },
        ]}
      />

      {learned.length === 0 && (
        <Paper component="section" variant="outlined" sx={{ p: 2.5, mt: 3 }}>
          <Box component="p" sx={{ m: 0 }}>
            New to {language.name}? Checkout{" "}
            <TextLink href={`/${lang}/basics/`} sx={{ fontWeight: 600 }}>
              {language.name} basics:
            </TextLink>{" "}
            the letters, sounds and rules English doesn&apos;t have.
          </Box>
        </Paper>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 2, mt: 3 }}>
        <Paper component="section" variant="outlined" sx={{ p: 2.5 }}>
          <SessionSizePicker
            value={size}
            range={range}
            onChange={(n) => update((p) => ({ ...p, settings: { ...p.settings, sessionSize: n } }))}
          />
        </Paper>

        <Paper
          component="section"
          variant="outlined"
          sx={{ p: 3, display: "flex", flexDirection: "column", borderTop: `6px solid ${C.rock}` }}
        >
          <Typography variant="h2" sx={{ fontSize: 30 }}>
            Review
          </Typography>
          {studied.length ? (
            <>
              <Box component="p" sx={{ mt: 1, mb: 2.25 }}>
                <Box component="b" sx={numSx}>
                  {studied.length}
                </Box>{" "}
                studied ·{" "}
                <Box component="b" sx={numSx}>
                  {weak.length}
                </Box>{" "}
                need practice
              </Box>
              <Box sx={{ mt: "auto", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.75 }}>
                <ButtonLink href={`/${lang}/session/?mode=review`}>Review studied words</ButtonLink>
                {weak.length > 0 && (
                  <TextLink href={`/${lang}/session/?mode=review&filter=practice`} sx={{ fontWeight: 600 }}>
                    Practise weak words only
                  </TextLink>
                )}
              </Box>
            </>
          ) : (
            <Box component="p" sx={{ mt: 1, mb: 2.25 }}>
              Words you study come back here for revision.
            </Box>
          )}
        </Paper>
      </Box>

      {course && (
        <Box component="section" sx={{ mt: 5 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1.5, mb: 1 }}>
            <Typography variant="h2">Course</Typography>
            <TextLink href={`/${lang}/words/`} sx={{ fontSize: 14, color: C.muted }}>
              All words
            </TextLink>
          </Box>
          <CoursePath index={index} progress={progress} lang={lang} />
        </Box>
      )}

      {/* The course list shows the current unit's words instead. */}
      {fresh.length > 0 && !course && (
        <Box component="section" sx={{ mt: 5 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1.5, mb: 1.75 }}>
            <Typography variant="h2">Next up</Typography>
            <TextLink href={`/${lang}/words/`} sx={{ fontSize: 14, color: C.muted }}>
              All words
            </TextLink>
          </Box>
          <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, display: "flex", flexWrap: "wrap", gap: 1.25 }}>
            {fresh.map((w) => (
              <li key={w.id}>
                <WordChip word={w} lang={lang} />
              </li>
            ))}
          </Box>
        </Box>
      )}
    </>
  )
}
