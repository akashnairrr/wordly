import Box from "@mui/material/Box"
import Chip from "@mui/material/Chip"
import LinearProgress from "@mui/material/LinearProgress"
import NextLink from "next/link"
import type { IndexEntry, Progress } from "@/lib/types"
import { courseUnits, lessonsOf } from "@/lib/units"
import { wordHref } from "@/lib/words"
import { C, numSx } from "@/theme"

/** A word as a link: lemma in the language, short meaning beside it. */
export function WordChip({ word, lang, studied = false }: { word: IndexEntry; lang: string; studied?: boolean }) {
  return (
    <Chip
      component={NextLink}
      href={wordHref(lang, word.id)}
      clickable
      variant="outlined"
      sx={{
        borderWidth: 1.5,
        minHeight: 44,
        bgcolor: studied ? C.tintSoft : undefined,
        "&:hover": { borderColor: C.venice },
        "& .MuiChip-label": { px: 2 },
      }}
      label={
        <Box component="span" sx={{ display: "inline-flex", alignItems: "baseline", gap: 1 }}>
          <Box component="b" lang={lang} sx={{ color: C.venice, fontSize: 17 }}>
            {word.lemma}
          </Box>
          <Box
            component="span"
            sx={{ fontSize: 14, maxWidth: "22ch", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {word.gloss}
          </Box>
        </Box>
      }
    />
  )
}

interface CoursePathProps {
  index: IndexEntry[]
  progress: Progress
  lang: string
}

/** Every unit of the course, in order: done, current (open) and upcoming, each expanding to its words. */
export function CoursePath({ index, progress, lang }: CoursePathProps) {
  const units = courseUnits(index, progress)
  const current = units.find((u) => u.done < u.words.length)?.unit.n
  return (
    <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0 }}>
      {units.map(({ unit, words, done }) => {
        const complete = done === words.length
        const isCurrent = unit.n === current
        const { lesson, lessons } = lessonsOf(words.length, done, progress.settings.sessionSize)
        return (
          <Box component="li" key={unit.n} sx={{ borderBottom: `1px solid ${C.line}` }}>
            <Box
              component="details"
              open={isCurrent}
              sx={{ "&[open] > summary .chev": { transform: "rotate(90deg)" } }}
            >
              <Box
                component="summary"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.75,
                  py: 1.5,
                  cursor: "pointer",
                  listStyle: "none",
                  "&::-webkit-details-marker": { display: "none" },
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    ...numSx,
                    flexShrink: 0,
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: 15,
                    bgcolor: complete ? C.primary : "transparent",
                    color: complete ? C.onPrimary : isCurrent ? C.primary : C.muted,
                    boxShadow: complete ? undefined : `inset 0 0 0 2px ${isCurrent ? C.primary : C.line}`,
                  }}
                >
                  {complete ? "✓" : unit.n}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                    <Box
                      component="span"
                      sx={{ fontWeight: isCurrent ? 700 : 600, color: isCurrent ? C.venice : undefined }}
                    >
                      <Box
                        component="span"
                        sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}
                      >
                        Unit {unit.n}:{" "}
                      </Box>
                      {unit.title}
                      {isCurrent && (
                        <Box component="span" sx={{ ml: 1, fontSize: 13, fontWeight: 600, color: C.muted }}>
                          · current
                        </Box>
                      )}
                    </Box>
                    <Box component="span" sx={{ ...numSx, fontSize: 14, color: C.muted, flexShrink: 0 }}>
                      {complete
                        ? "Done"
                        : isCurrent
                          ? `Lesson ${lesson} of ${lessons}`
                          : `${lessons} lesson${lessons > 1 ? "s" : ""}`}
                    </Box>
                  </Box>
                  {isCurrent && lesson > 1 && (
                    <LinearProgress
                      value={((lesson - 1) / lessons) * 100}
                      aria-label={`${unit.title} progress`}
                      sx={{ mt: 0.75, bgcolor: C.surface }}
                    />
                  )}
                </Box>
                <Box
                  component="span"
                  aria-hidden
                  className="chev"
                  sx={{ color: C.muted, transition: "transform .15s" }}
                >
                  ›
                </Box>
              </Box>
              <Box
                component="ul"
                sx={{
                  listStyle: "none",
                  p: 0,
                  m: 0,
                  pb: 2,
                  pl: { sm: "52px" },
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                {words.map((w) => (
                  <li key={w.id}>
                    <WordChip word={w} lang={lang} studied={!!progress.learned[w.id]} />
                  </li>
                ))}
              </Box>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
