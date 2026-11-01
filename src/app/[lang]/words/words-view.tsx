"use client"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import ButtonBase from "@mui/material/ButtonBase"
import IconButton from "@mui/material/IconButton"
import List from "@mui/material/List"
import ListItemButton from "@mui/material/ListItemButton"
import Pagination from "@mui/material/Pagination"
import PaginationItem from "@mui/material/PaginationItem"
import Skeleton from "@mui/material/Skeleton"
import SvgIcon from "@mui/material/SvgIcon"
import TextField from "@mui/material/TextField"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import NextLink from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { EmptyState } from "@/components/empty-state"
import { TextLink, wordsSearchKey } from "@/components/links"
import { useSpeech } from "@/components/speech-provider"
import { ToneChip } from "@/components/tone-chip"
import { POS_LABELS } from "@/lib/languages"
import { LEVELS, levelOf, levelProgress } from "@/lib/levels"
import { strength, wordStatus, type WordStatus } from "@/lib/session"
import type { Pos, Progress } from "@/lib/types"
import { useIndex } from "@/hooks/use-index"
import { useProgress } from "@/hooks/use-progress"
import { stripAccents, wordHref } from "@/lib/words"
import { C, displayFontSx, numSx, RADIUS_SM } from "@/theme"

const PAGE_SIZES = [25, 50, 75, 100]
// Pill-shaped native selects.
const PILL = { "& .MuiOutlinedInput-root": { minHeight: 36, borderRadius: 999 } } as const

type StatusFilter = "all" | WordStatus
// "new" has no tile (its count would give away the list's size) but old ?filter=new links still work.
const STATUS_FILTERS: StatusFilter[] = ["all", "studied", "practice", "new", "skipped"]
const POS_FILTERS: Pos[] = ["noun", "verb", "adj", "adv", "pron", "prep", "conj", "det", "intj"]

type Sort = "rank" | "weak" | "recent"
const SORTS: { id: Sort; label: string }[] = [
  { id: "rank", label: "Most common" },
  { id: "weak", label: "Weakest first" },
  { id: "recent", label: "Recently studied" },
]

const TILES: { id: WordStatus; label: string; tone: { bgcolor: string; color: string } }[] = [
  { id: "studied", label: "Studied", tone: { bgcolor: C.tintSoft, color: C.venice } },
  { id: "practice", label: "Needs practice", tone: { bgcolor: C.dangerSoft, color: C.danger } },
  { id: "skipped", label: "Skipped", tone: { bgcolor: C.surface, color: C.muted } },
]

/** Mirrors the filters and page into the URL (?q=&filter=&level=&pos=&sort=&page=) so going back restores them. */
function syncUrl(next: {
  q?: string
  filter?: StatusFilter
  level?: string
  pos?: Pos | "all"
  sort?: Sort
  page?: string
}) {
  const params = new URLSearchParams(window.location.search)
  for (const [key, value] of Object.entries(next)) {
    if (value && value !== "all" && value !== "rank") params.set(key, value)
    else params.delete(key)
  }
  const qs = params.toString()
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname)
}

const fold = (s: string) => stripAccents(s.toLowerCase())

const STRENGTH = [
  { color: C.line, label: "Not studied yet" },
  { color: C.strength1, label: "Needs practice" },
  { color: C.strength2, label: "Getting there" },
  { color: C.strength3, label: "Not bad" },
  { color: C.strength4, label: "Strong" },
] as const

/** Four rising bars coloured by strength (red → green), all grey for words not studied yet; hover explains them. */
function StrengthBars({ value }: { value: number }) {
  const { color, label } = STRENGTH[value]!
  const title = value ? `Strength ${value}/4 · ${label}.` : "Not studied yet."
  return (
    <Tooltip title={title} arrow>
      <Box
        component="span"
        role="img"
        sx={{ display: "inline-flex", alignItems: "flex-end", gap: "3px", height: 18, flexShrink: 0 }}
      >
        {[1, 2, 3, 4].map((n) => (
          <Box
            key={n}
            component="span"
            sx={{
              width: 5,
              height: 6 + n * 3,
              borderRadius: 1,
              bgcolor: n <= value ? color : C.line,
            }}
          />
        ))}
      </Box>
    </Tooltip>
  )
}

const seenAt = (id: string, p: Progress) => p.learned[id]?.reviewedAt ?? p.learned[id]?.learnedAt ?? ""

interface WordsViewProps {
  lang: string
}

export function WordsView({ lang }: WordsViewProps) {
  const [progress, update] = useProgress(lang)
  const { index, error } = useIndex(lang)
  const { available, say } = useSpeech()
  const params = useSearchParams()
  const [status, setStatus] = useState<StatusFilter>(STATUS_FILTERS.find((f) => f === params.get("filter")) ?? "all")
  const [pos, setPos] = useState<Pos | "all">(POS_FILTERS.find((p) => p === params.get("pos")) ?? "all")
  const [level, setLevel] = useState(
    LEVELS.find((l) => String(l.n) === params.get("level")) ? params.get("level")! : "all"
  )
  const [sort, setSort] = useState<Sort>(SORTS.find((s) => s.id === params.get("sort"))?.id ?? "rank")
  const [query, setQuery] = useState(params.get("q") ?? "")
  const [page, setPage] = useState(Math.max(1, Number(params.get("page")) || 1))

  // The word page's "← All words" link returns to this exact list.
  useEffect(() => {
    try {
      sessionStorage.setItem(wordsSearchKey(lang), window.location.search)
    } catch {
      // Storage blocked: the back link shows the plain list.
    }
  }, [lang, query, status, level, pos, sort, page])

  if (error) return <EmptyState text={`Could not load words: ${error}`} />
  if (!index || !progress) return <Skeleton sx={{ mt: 3, minHeight: 480 }} />

  const statuses = new Map(index.map((w) => [w.id, wordStatus(w.id, progress)]))
  const count = (s: WordStatus) => index.filter((w) => statuses.get(w.id) === s).length
  const q = fold(query.trim())
  const list = index.filter(
    (w) =>
      (status === "all" || statuses.get(w.id) === status) &&
      (level === "all" || String(levelOf(w.rank).n) === level) &&
      (pos === "all" || w.pos === pos) &&
      (!q || fold(w.lemma).includes(q) || fold(w.gloss).includes(q))
  )
  // Words not studied have strength 0 and no date: "weakest" puts them after the studied ones, like "recent".
  if (sort === "weak")
    list.sort((a, b) => (strength(a.id, progress) || 9) - (strength(b.id, progress) || 9) || a.rank - b.rank)
  if (sort === "recent")
    list.sort((a, b) => seenAt(b.id, progress).localeCompare(seenAt(a.id, progress)) || a.rank - b.rank)

  // A size from an old or hand-edited backup falls back to the largest.
  const size = PAGE_SIZES.includes(progress.settings.pageSize) ? progress.settings.pageSize : 100
  const pages = Math.max(1, Math.ceil(list.length / size))
  // Filter changes go back to page 1; a page left over from a longer list falls back to the last one.
  const current = Math.min(page, pages)

  const filtered = !!query || status !== "all" || level !== "all" || pos !== "all" || sort !== "rank"
  // Back to the full list in its default order.
  const clearFilters = () => {
    setQuery("")
    setStatus("all")
    setPos("all")
    setLevel("all")
    setSort("rank")
    setPage(1)
    syncUrl({ q: "", filter: "all", level: "all", pos: "all", sort: "rank", page: "" })
  }

  const filter = (next: { filter?: StatusFilter; level?: string }) => {
    if (next.filter) setStatus(next.filter)
    if (next.level) setLevel(next.level)
    syncUrl({ ...next, page: "" })
    setPage(1)
  }

  return (
    <>
      <Box
        component="header"
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.5, mt: 3.5 }}
      >
        <Typography variant="h1">Common words</Typography>
        {/* Only once something is set; shorter than the title, so the row doesn't jump. */}
        {filtered && (
          <Button
            variant="text"
            size="small"
            onClick={clearFilters}
            sx={{ minHeight: 32, fontSize: 14, flexShrink: 0 }}
          >
            Clear filters
          </Button>
        )}
      </Box>

      {/* Status tiles: counts of the learner's own words, each a filter; tap the active one again for all words. */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.25, mt: 2.5 }}>
        {TILES.map((t) => {
          const n = count(t.id)
          const active = status === t.id
          const action =
            t.id === "studied"
              ? n > 0
                ? { href: `/${lang}/session/?mode=review`, label: "Review" }
                : { href: `/${lang}/session/`, label: "Start a lesson" }
              : t.id === "practice" && n > 0
                ? { href: `/${lang}/session/?mode=review&filter=practice`, label: "Practise" }
                : null
          return (
            <Box
              key={t.id}
              sx={{
                ...t.tone,
                borderRadius: `${RADIUS_SM}px`,
                border: `2px solid ${active ? "currentColor" : "transparent"}`,
                ...(t.id === "skipped" && !active && { borderColor: C.line, borderStyle: "dashed" }),
                overflow: "hidden",
              }}
            >
              <ButtonBase
                onClick={() => filter({ filter: active ? "all" : t.id })}
                aria-pressed={active}
                sx={{
                  display: "block",
                  width: "100%",
                  font: "inherit",
                  textAlign: "left",
                  px: 1.75,
                  pt: 1.5,
                  pb: action ? 0.5 : 1.75,
                }}
              >
                <Box sx={{ ...displayFontSx, ...numSx, fontSize: "clamp(26px, 6vw, 36px)", lineHeight: 1 }}>{n}</Box>
                <Box sx={{ fontSize: 14, fontWeight: 600, mt: 0.5 }}>{t.label}</Box>
              </ButtonBase>
              {action && (
                <Box sx={{ px: 1.75, pb: 1.5, fontSize: 14 }}>
                  <TextLink href={action.href} sx={{ color: "inherit", fontWeight: 600 }}>
                    {action.label} →
                  </TextLink>
                </Box>
              )}
            </Box>
          )
        })}
      </Box>

      {/* Level strip: how far into each band, as a fill (no totals). One row on wide screens, wraps on narrow ones. */}
      <Box
        role="group"
        aria-label="Level"
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))",
          gap: 1,
          mt: 2,
        }}
      >
        {[null, ...LEVELS].map((l) => {
          const value = l ? String(l.n) : "all"
          const active = level === value
          const { done, total } = l ? levelProgress(index, progress, l) : { done: 0, total: 0 }
          return (
            <ButtonBase
              key={value}
              onClick={() => filter({ level: active && l ? "all" : value })}
              aria-pressed={active}
              sx={{
                font: "inherit",
                flexDirection: "column",
                alignItems: "stretch",
                justifyContent: l ? "flex-start" : "center",
                gap: 0.5,
                minWidth: 0,
                px: 1.25,
                py: 1.25,
                textAlign: "left",
                borderRadius: `${RADIUS_SM}px`,
                border: `2px solid ${active ? C.venice : C.line}`,
                bgcolor: active ? C.tintSoft : C.surface,
                color: C.venice,
              }}
            >
              {l && (
                <Box component="span" sx={{ fontSize: 12, color: C.muted }}>
                  Level {l.n}
                </Box>
              )}
              {/* Long names ("Upper-intermediate") break at the hyphen rather than overflow. */}
              <Box component="span" sx={{ fontSize: 15, fontWeight: 600, lineHeight: 1.25, overflowWrap: "anywhere" }}>
                {l ? l.name : "All levels"}
              </Box>
              {l && (
                // Pinned to the bottom so bars line up when a name wraps.
                <Box
                  component="span"
                  sx={{ height: 4, mt: "auto", borderRadius: 999, bgcolor: C.line, overflow: "hidden" }}
                >
                  <Box
                    component="span"
                    sx={{ display: "block", height: "100%", width: `${(done / total) * 100}%`, bgcolor: C.rock }}
                  />
                </Box>
              )}
            </ButtonBase>
          )
        })}
      </Box>

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
        sx={{ mt: 2 }}
      />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.25, mb: 0.5 }}>
        <TextField
          select
          size="small"
          value={pos}
          onChange={(e) => {
            setPos(e.target.value as Pos | "all")
            syncUrl({ pos: e.target.value as Pos | "all", page: "" })
            setPage(1)
          }}
          slotProps={{ select: { native: true }, htmlInput: { "aria-label": "Part of speech" } }}
          sx={PILL}
        >
          <option value="all">Any part of speech</option>
          {POS_FILTERS.map((p) => (
            <option key={p} value={p}>
              {POS_LABELS[p]}
            </option>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as Sort)
            syncUrl({ sort: e.target.value as Sort, page: "" })
            setPage(1)
          }}
          slotProps={{ select: { native: true }, htmlInput: { "aria-label": "Sort" } }}
          sx={PILL}
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </TextField>
      </Box>

      {list.length === 0 ? (
        <EmptyState text="No words match.">
          <Button variant="outlined" onClick={clearFilters}>
            Clear filters
          </Button>
        </EmptyState>
      ) : (
        <List component="ol" id="word-list" disablePadding sx={{ mt: 1, scrollMarginTop: 80 }}>
          {list.slice((current - 1) * size, current * size).map((w) => {
            const s = statuses.get(w.id)!
            return (
              <Box
                component="li"
                key={w.id}
                sx={{ display: "flex", alignItems: "center", gap: 0.5, borderBottom: `1px solid ${C.line}` }}
              >
                <Box
                  component="span"
                  sx={{ ...numSx, width: "4ch", textAlign: "right", color: C.muted, fontSize: 13, flexShrink: 0 }}
                >
                  {w.rank}
                </Box>
                {available && (
                  <IconButton
                    size="small"
                    onClick={() => say(w.lemma)}
                    aria-label={`Hear “${w.lemma}”`}
                    sx={{ color: C.muted, "&:hover": { color: C.venice } }}
                  >
                    <SvgIcon sx={{ fontSize: 18 }}>
                      <path d="M8 5v14l11-7z" />
                    </SvgIcon>
                  </IconButton>
                )}
                <ListItemButton
                  component={NextLink}
                  href={wordHref(lang, w.id)}
                  sx={{ gap: 1.5, py: 1.5, px: 0.75, minWidth: 0, "&:hover b": { color: C.venice } }}
                >
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
                  {s === "skipped" ? (
                    <ToneChip tone="skipped" label="Skipped" />
                  ) : (
                    <StrengthBars value={strength(w.id, progress)} />
                  )}
                </ListItemButton>
              </Box>
            )
          })}
        </List>
      )}

      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 2, mt: 2.5 }}>
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
          />
        )}
        {list.length > PAGE_SIZES[0]! && (
          <TextField
            select
            size="small"
            value={size}
            onChange={(e) => {
              const next = Number(e.target.value)
              // Stay on the page that holds the first word currently shown.
              const p = Math.floor(((current - 1) * size) / next) + 1
              update((s) => ({ ...s, settings: { ...s.settings, pageSize: next } }))
              setPage(p)
              syncUrl({ page: p > 1 ? String(p) : "" })
            }}
            slotProps={{ select: { native: true }, htmlInput: { "aria-label": "Words per page" } }}
            sx={PILL}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n} per page
              </option>
            ))}
          </TextField>
        )}
      </Box>
    </>
  )
}
