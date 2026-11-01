"use client"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import LinearProgress from "@mui/material/LinearProgress"
import List from "@mui/material/List"
import ListItemButton from "@mui/material/ListItemButton"
import Pagination from "@mui/material/Pagination"
import PaginationItem from "@mui/material/PaginationItem"
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

const PAGE_SIZES = [25, 50, 75, 100]
// A filter's label and its select wrap to the next line together.
const FIELD = { display: "flex", alignItems: "center", gap: 1.25 } as const

type StatusFilter = "all" | WordStatus
const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "studied", label: "Studied" },
  { id: "practice", label: "Needs practice" },
  { id: "new", label: "Not started" },
  { id: "skipped", label: "Skipped" },
]
const POS_FILTERS: Pos[] = ["noun", "verb", "adj", "adv", "pron", "prep", "conj", "det", "intj"]

/** Mirrors the filters and page into the URL (?q=&filter=&level=&pos=&page=) so going back to this page restores them. */
function syncUrl(next: { q?: string; filter?: StatusFilter; level?: string; pos?: Pos | "all"; page?: string }) {
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
  const [progress, update] = useProgress(lang)
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
  const [page, setPage] = useState(Math.max(1, Number(params.get("page")) || 1))

  // The word page's "← All words" link returns to this exact list.
  useEffect(() => {
    try {
      sessionStorage.setItem(wordsSearchKey(lang), window.location.search)
    } catch {
      // Storage blocked: the back link shows the plain list.
    }
  }, [lang, query, status, level, pos, page])

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
  // A size from an old or hand-edited backup falls back to the largest.
  const size = PAGE_SIZES.includes(progress.settings.pageSize) ? progress.settings.pageSize : 100
  const pages = Math.max(1, Math.ceil(list.length / size))
  // Filter changes go back to page 1; a page left over from a longer list falls back to the last one.
  const current = Math.min(page, pages)

  return (
    <>
      <Box component="header" sx={{ mt: 3.5 }}>
        <Typography variant="h1">Common words</Typography>
        <Box component="p" sx={{ color: C.muted, mt: 0.75, mb: 0 }}>
          The most spoken words, most frequent first.
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
            studied
          </Box>
          {/* The bar shows how far along the list you are without saying how long it is. */}
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
          syncUrl({ q: e.target.value, page: "" })
          setPage(1)
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
          syncUrl({ filter: f, page: "" })
          setPage(1)
        }}
        aria-label="Status"
        sx={{ mt: 1, display: "flex" }}
      >
        {STATUS_FILTERS.map((f) => (
          <ToggleButton key={f.id} value={f.id} sx={{ gap: 0.5 }}>
            {f.label}
            {/* Only counts of the learner's own words: "All" and "Not started" would give away the list's size. */}
            {f.id !== "all" && f.id !== "new" && (
              <Box component="span" sx={{ ...numSx, color: C.muted, fontWeight: 400 }}>
                {count(f.id)}
              </Box>
            )}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25, mt: 1.5, mb: 0.5 }}>
        <Box sx={FIELD}>
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
              syncUrl({ level: e.target.value, page: "" })
              setPage(1)
            }}
            slotProps={{ select: { native: true } }}
            sx={{ "& .MuiOutlinedInput-root": { minHeight: 36, borderRadius: 999 } }}
          >
            <option value="all">All levels</option>
            {LEVELS.map((l) => {
              const { done } = levelProgress(index, progress, l)
              return (
                <option key={l.n} value={String(l.n)}>
                  {levelLabel(l)}
                  {done > 0 && ` (${done} studied)`}
                </option>
              )
            })}
          </TextField>
        </Box>
        <Box sx={FIELD}>
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
              syncUrl({ pos: e.target.value as Pos | "all", page: "" })
              setPage(1)
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
        </Box>
        <Box sx={FIELD}>
          <Box component="label" htmlFor="page-size" sx={{ fontSize: 14, color: C.muted }}>
            Per page
          </Box>
          <TextField
            select
            size="small"
            id="page-size"
            value={size}
            onChange={(e) => {
              const next = Number(e.target.value)
              // Stay on the page that holds the first word currently shown.
              const p = Math.floor(((current - 1) * size) / next) + 1
              update((s) => ({ ...s, settings: { ...s.settings, pageSize: next } }))
              setPage(p)
              syncUrl({ page: p > 1 ? String(p) : "" })
            }}
            slotProps={{ select: { native: true } }}
            sx={{ "& .MuiOutlinedInput-root": { minHeight: 36, borderRadius: 999 } }}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </TextField>
        </Box>
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
              setPage(1)
              syncUrl({ q: "", filter: "all", level: "all", pos: "all", page: "" })
            }}
          >
            Clear filters
          </Button>
        </EmptyState>
      ) : (
        <List component="ol" id="word-list" disablePadding sx={{ mt: 1, scrollMarginTop: 80 }}>
          {list.slice((current - 1) * size, current * size).map((w) => {
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
      {pages > 1 && (
        <Pagination
          page={current}
          count={pages}
          onChange={(_, p) => {
            setPage(p)
            syncUrl({ page: p > 1 ? String(p) : "" })
            document.getElementById("word-list")?.scrollIntoView()
          }}
          // The last page is only reached by stepping through with Next: its number would give away the list's size.
          renderItem={(item) =>
            item.type === "page" && item.page === pages && !item.selected ? null : <PaginationItem {...item} />
          }
          sx={{ mt: 2.5, "& ul": { justifyContent: "center" } }}
        />
      )}
    </>
  )
}
