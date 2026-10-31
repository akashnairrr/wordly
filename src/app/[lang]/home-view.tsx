"use client"

import Box from "@mui/material/Box"
import Chip from "@mui/material/Chip"
import Paper from "@mui/material/Paper"
import Skeleton from "@mui/material/Skeleton"
import Typography from "@mui/material/Typography"
import NextLink from "next/link"
import { ButtonLink, TextLink } from "@/components/links"
import { SessionSizePicker } from "@/components/session-size-picker"
import { StatLine } from "@/components/stat-line"
import { getLanguage } from "@/lib/languages"
import { planLesson, reviewQueue } from "@/lib/session"
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
  const size = progress.settings.sessionSize
  const { fresh, review } = planLesson(index, progress, size)
  const studied = reviewQueue(index, progress)
  const weak = reviewQueue(index, progress, true)
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
        <Box component="p" lang={lang} sx={{ ...displayFontSx, fontSize: 22, m: "0 0 8px" }}>
          {language.greeting}
        </Box>
        {fresh.length ? (
          <>
            <Typography variant="h1" sx={heroTitle}>
              {fresh.length} new {language.name} words are waiting.
            </Typography>
            <Box component="p" sx={{ mt: 1.75, mb: 3, maxWidth: "46ch", opacity: 0.9 }}>
              See each one in real sentences, hear a native speaker, then take a short quiz.
              {review.length > 0 &&
                ` ${review.length} word${review.length > 1 ? "s" : ""} you've studied will come back too.`}
            </Box>
            <ButtonLink href={`/${lang}/session/`}>Start lesson</ButtonLink>
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
          {
            label: "Words studied",
            value: (
              <>
                {learned.length}
                <Box component="span" sx={{ fontSize: "0.45em", color: C.muted, fontWeight: 500 }}>
                  /{index.length}
                </Box>
              </>
            ),
          },
          { label: "Day streak", value: progress.streak },
          { label: "Quiz accuracy", value: answers ? `${Math.round((correct / answers) * 100)}%` : "–" },
        ]}
      />

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 2, mt: 3 }}>
        <Paper component="section" variant="outlined" sx={{ p: 2.5 }}>
          <SessionSizePicker
            value={size}
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
              Words you study come back here for revision, weakest first.
            </Box>
          )}
        </Paper>
      </Box>

      {fresh.length > 0 && (
        <Box component="section" sx={{ mt: 5 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1.5, mb: 1.75 }}>
            <Typography variant="h2">Next up</Typography>
            <TextLink href={`/${lang}/words/`} sx={{ fontSize: 14, color: C.muted }}>
              All {index.length} words
            </TextLink>
          </Box>
          <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, display: "flex", flexWrap: "wrap", gap: 1.25 }}>
            {fresh.map((w) => (
              <li key={w.id}>
                <Chip
                  component={NextLink}
                  href={`/${lang}/words/${w.id}/`}
                  clickable
                  variant="outlined"
                  sx={{
                    borderWidth: 1.5,
                    minHeight: 44,
                    "&:hover": { borderColor: C.venice },
                    "& .MuiChip-label": { px: 2 },
                  }}
                  label={
                    <Box component="span" sx={{ display: "inline-flex", alignItems: "baseline", gap: 1 }}>
                      <Box component="b" lang={lang} sx={{ color: C.venice, fontSize: 17 }}>
                        {w.lemma}
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          fontSize: 14,
                          maxWidth: "22ch",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {w.gloss}
                      </Box>
                    </Box>
                  }
                />
              </li>
            ))}
          </Box>
        </Box>
      )}
    </>
  )
}
