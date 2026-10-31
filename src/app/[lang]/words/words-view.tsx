"use client"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import LinearProgress from "@mui/material/LinearProgress"
import List from "@mui/material/List"
import ListItemButton from "@mui/material/ListItemButton"
import Paper from "@mui/material/Paper"
import Skeleton from "@mui/material/Skeleton"
import TextField from "@mui/material/TextField"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import Typography from "@mui/material/Typography"
import NextLink from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { EmptyState } from "@/components/empty-state"
import { ButtonLink, wordsSearchKey } from "@/components/links"
import { ToneChip } from "@/components/tone-chip"
import { STATUS_LABEL, STATUS_TONE } from "@/components/word-status-bar"
import { POS_LABELS } from "@/lib/languages"
import { LEVELS, levelLabel, levelOf, levelProgress } from "@/lib/levels"
import { wordStatus, type WordStatus } from "@/lib/session"
import type { Pos } from "@/lib/types"
import { useIndex } from "@/hooks/use-index"
import { useProgress } from "@/hooks/use-progress"
import { stripAccents, wordHref } from "@/lib/words"
import { C, displayFontSx, numSx } from "@/theme"

const PAGE = 100

type StatusFilter = "all" | WordStatus
const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "studied", label: "Studied" },
  { id: "practice", label: "Needs practice" },
  { id: "new", label: "Not started" },
  { id: "skipped", label: "Skipped" },
]
const POS_FILTERS: Pos[] = ["noun", "verb", "adj", "adv", "pron", "prep", "conj", "det", "intj"]

/** Mirrors the filters into the URL (?q=&filter=&level=&pos=) so going back to this page restores them. */
function syncUrl(next: { q?: string; filter?: StatusFilter; level?: string; pos?: Pos | "all" }) {
  const params = new URLSearchParams(window.location.search)
  for (const [key, value] of Object.entries(next)) {
    if (value && value !== "all") params.set(key, value)
    else params.delete(key)
  }
  const qs = params.toString()
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname)
}

const fold = (s: string) => stripAccents(s.toLowerCase())

interface WordsViewProps {
  lang: string
}

export function WordsView({ lang }: WordsViewProps) {
  const [progress] = useProgress(lang)
  const { index, error } = useIndex(lang)
  const params = useSearchParams()
  const [status, setStatus] = useState<StatusFilter>(
    STATUS_FILTERS.find((f) => f.id === params.get("filter"))?.id ?? "all"
  )
  const [pos, setPos] = useState<Pos | "all">(POS_FILTERS.find((p) => p === params.get("pos")) ?? "all")
  const [level, setLevel] = useState(
    LEVELS.find((l) => String(l.n) === params.get("level")) ? params.get("level")! : "all"
  )
  const [query, setQuery] = useState(params.get("q") ?? "")
  const [shown, setShown] = useState(PAGE)

  // The word page's "← All words" link returns to this exact list.
  useEffect(() => {
    try {
      sessionStorage.setItem(wordsSearchKey(lang), window.location.search)
    } catch {
      // Storage blocked: the back link shows the plain list.
    }
  }, [lang, query, status, level, pos])

  if (error) return <EmptyState text={`Could not load words: ${error}`} />
  if (!index || !progress) return <Skeleton sx={{ mt: 3, minHeight: 480 }} />

  const statuses = new Map(index.map((w) => [w.id, wordStatus(w.id, progress)]))
  const count = (s: WordStatus) => index.filter((w) => statuses.get(w.id) === s).length
  const studiedCount = count("studied") + count("practice")
  const q = fold(query.trim())
  const list = index.filter(
    (w) =>
      (status === "all" || statuses.get(w.id) === status) &&
      (level === "all" || String(levelOf(w.rank).n) === level) &&
      (pos === "all" || w.pos === pos) &&
      (!q || fold(w.lemma).includes(q) || fold(w.gloss).includes(q))
  )

  return (
    <>
      <Box component="header" sx={{ mt: 3.5 }}>
        <Typography variant="h1">Common words</Typography>
        <Box component="p" sx={{ color: C.muted, mt: 0.75, mb: 0 }}>
          The {index.length} most spoken words, most frequent first.
        </Box>
      </Box>

      <Paper
        component="section"
        variant="outlined"
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 2,
          mt: 2.5,
          p: 2.5,
        }}
      >
        <Box sx={{ flex: "1 1 220px" }}>
          <Box component="span" sx={{ ...displayFontSx, ...numSx, fontSize: 34, color: C.venice }}>
            {studiedCount}
          </Box>{" "}
          <Box component="span" sx={{ color: C.muted }}>
            of {index.length} studied
          </Box>
          <LinearProgress value={(studiedCount / index.length) * 100} aria-label="Words studied" sx={{ mt: 1.25 }} />
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25 }}>
          {studiedCount > 0 ? (
            <>
              <ButtonLink href={`/${lang}/session/?mode=review`}>Review studied</ButtonLink>
              {count("practice") > 0 && (
                <ButtonLink href={`/${lang}/session/?mode=review&filter=practice`} variant="outlined">
                  Practise {count("practice")} weak
                </ButtonLink>
              )}
            </>
          ) : (
            <ButtonLink href={`/${lang}/session/`}>Start your first lesson</ButtonLink>
          )}
        </Box>
      </Paper>

      <TextField
        fullWidth
        type="search"
        placeholder="Search in either language"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          syncUrl({ q: e.target.value })
          setShown(PAGE)
        }}
        slotProps={{ htmlInput: { "aria-label": "Search words" } }}
        sx={{ mt: 2.5 }}
      />
      <ToggleButtonGroup
        exclusive
        value={status}
        onChange={(_, f: StatusFilter | null) => {
          if (!f) return
          setStatus(f)
          syncUrl({ filter: f })
          setShown(PAGE)
        }}
        aria-label="Status"
        sx={{ mt: 1, display: "flex" }}
      >
        {STATUS_FILTERS.map((f) => (
          <ToggleButton key={f.id} value={f.id} sx={{ gap: 0.5 }}>
            {f.label}{" "}
            <Box component="span" sx={{ ...numSx, color: C.muted, fontWeight: 400 }}>
              {f.id === "all" ? index.length : count(f.id)}
            </Box>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25, mt: 1.5, mb: 0.5 }}>
        <Box component="label" htmlFor="level" sx={{ fontSize: 14, color: C.muted }}>
          Level
        </Box>
        <TextField
          select
          size="small"
          id="level"
          value={level}
          onChange={(e) => {
            setLevel(e.target.value)
            syncUrl({ level: e.target.value })
            setShown(PAGE)
          }}
          slotProps={{ select: { native: true } }}
          sx={{ "& .MuiOutlinedInput-root": { minHeight: 36, borderRadius: 999 } }}
        >
          <option value="all">All levels</option>
          {LEVELS.map((l) => {
            const { done, total } = levelProgress(index, progress, l)
            return (
              <option key={l.n} value={String(l.n)}>
                {levelLabel(l)} ({done}/{total})
              </option>
            )
          })}
        </TextField>
        <Box component="label" htmlFor="pos" sx={{ fontSize: 14, color: C.muted }}>
          Part of speech
        </Box>
        <TextField
          select
          size="small"
          id="pos"
          value={pos}
          onChange={(e) => {
            setPos(e.target.value as Pos | "all")
            syncUrl({ pos: e.target.value as Pos | "all" })
          }}
          slotProps={{ select: { native: true } }}
          sx={{ "& .MuiOutlinedInput-root": { minHeight: 36, borderRadius: 999 } }}
        >
          <option value="all">Any</option>
          {POS_FILTERS.map((p) => (
            <option key={p} value={p}>
              {POS_LABELS[p]}
            </option>
          ))}
        </TextField>
        <Typography variant="body2" component="span" sx={{ ...numSx, ml: "auto" }}>
          {list.length} shown
        </Typography>
      </Box>

      {list.length === 0 ? (
        <EmptyState text="No words match.">
          <Button
            variant="outlined"
            onClick={() => {
              setQuery("")
              setStatus("all")
              setPos("all")
              setLevel("all")
              syncUrl({ q: "", filter: "all", level: "all", pos: "all" })
            }}
          >
            Clear filters
          </Button>
        </EmptyState>
      ) : (
        <List component="ol" disablePadding sx={{ mt: 1 }}>
          {list.slice(0, shown).map((w) => {
            const s = statuses.get(w.id)!
            return (
              <li key={w.id}>
                <ListItemButton
                  component={NextLink}
                  href={wordHref(lang, w.id)}
                  sx={{
                    gap: 1.5,
                    py: 1.5,
                    px: 0.5,
                    borderBottom: `1px solid ${C.line}`,
                    "&:hover b": { color: C.venice },
                  }}
                >
                  <Box
                    component="span"
                    sx={{ ...numSx, width: "3ch", textAlign: "right", color: C.muted, fontSize: 13, flexShrink: 0 }}
                  >
                    {w.rank}
                  </Box>
                  <Box
                    component="span"
                    sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", gap: 1.25 }}
                  >
                    <Box component="b" lang={lang} sx={{ fontSize: 18, flexShrink: 0 }}>
                      {w.lemma}
                    </Box>
                    <Box
                      component="span"
                      sx={{ color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {w.gloss}
                    </Box>
                  </Box>
                  <Box
                    component="span"
                    sx={{ fontSize: 13, color: C.muted, flexShrink: 0, display: { xs: "none", sm: "inline" } }}
                  >
                    {POS_LABELS[w.pos]}
                  </Box>
                  {s !== "new" && <ToneChip tone={STATUS_TONE[s]} label={STATUS_LABEL[s]} />}
                </ListItemButton>
              </li>
            )
          })}
        </List>
      )}
      {shown < list.length && (
        <Button variant="outlined" fullWidth sx={{ mt: 2 }} onClick={() => setShown(shown + PAGE)}>
          Show more{" "}
          <Box component="span" sx={numSx}>
            ({list.length - shown} left)
          </Box>
        </Button>
      )}
    </>
  )
}
