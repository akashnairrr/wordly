"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { ButtonLink } from "@/components/links";
import { Quiz, type QuizResult } from "@/components/Quiz";
import { useSpeech } from "@/components/SpeechProvider";
import { ToneChip } from "@/components/ToneChip";
import { WordCard } from "@/components/WordCard";
import { fetchWord, fetchWords } from "@/lib/data";
import { getLanguage } from "@/lib/languages";
import { recordSession, skipWord } from "@/lib/progress";
import { buildQuiz, type QuizQuestion } from "@/lib/quiz";
import { pickNewWords, planLesson, reviewQueue } from "@/lib/session";
import type { Word } from "@/lib/types";
import { useIndex } from "@/lib/useIndex";
import { useProgress } from "@/lib/useProgress";
import { C, displayFont, num, RADIUS, Z } from "@/theme";

interface Item {
  word: Word;
  /** Already studied: shown again for revision. */
  review: boolean;
}

/** Page title row: title on the left, optional detail on the right. */
function Top({ title, sub, right }: { title: string; sub?: string; right?: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 1.5, mt: 3.5, mb: 1.5 }}>
      <div>
        <Typography variant="h1" sx={{ fontSize: 34 }}>
          {title}
        </Typography>
        {sub && <Typography variant="body2">{sub}</Typography>}
      </div>
      {right && (
        <Typography variant="body2" component="span" sx={num}>
          {right}
        </Typography>
      )}
    </Box>
  );
}

type Phase = { name: "learn"; card: number } | { name: "quiz"; questions: QuizQuestion[] } | { name: "results"; results: QuizResult[] };

/** Remounts a fresh session whenever the URL (lesson vs review) changes or the learner starts another round. */
export function SessionView({ lang }: { lang: string }) {
  const params = useSearchParams();
  const [round, setRound] = useState(0);
  return (
    <Session
      key={`${params.toString()}#${round}`}
      lang={lang}
      mode={params.get("mode") === "review" ? "review" : "lesson"}
      onlyPractice={params.get("filter") === "practice"}
      onRestart={() => setRound((r) => r + 1)}
    />
  );
}

function Session({ lang, mode, onlyPractice, onRestart }: { lang: string; mode: "lesson" | "review"; onlyPractice: boolean; onRestart: () => void }) {
  const language = getLanguage(lang);
  const [progress, update] = useProgress(lang);
  const { index, error: indexError } = useIndex(lang);
  const { available } = useSpeech();
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ name: "learn", card: 0 });
  const [notice, setNotice] = useState<string | null>(null);
  const started = useRef(false);

  // Pick the words once; recording results updates progress and must not reshuffle them.
  useEffect(() => {
    if (!progress || !index || started.current) return;
    started.current = true;
    const size = progress.settings.sessionSize;
    const picks =
      mode === "review"
        ? reviewQueue(index, progress, onlyPractice)
            .slice(0, size)
            .map((w) => ({ id: w.id, review: true }))
        : (() => {
            const plan = planLesson(index, progress, size);
            return [...plan.fresh.map((w) => ({ id: w.id, review: false })), ...plan.review.map((w) => ({ id: w.id, review: true }))];
          })();
    fetchWords(
      lang,
      picks.map((p) => p.id),
    ).then(
      (words) => setItems(words.map((word, i) => ({ word, review: picks[i].review }))),
      (e: Error) => setError(e.message),
    );
  }, [progress, index, lang, mode, onlyPractice]);

  if (error || indexError) return <EmptyState text={`Could not load words: ${error ?? indexError}`} />;
  if (!items || !progress || !index) return <Skeleton sx={{ mt: 3, minHeight: 420 }} />;

  if (!items.length)
    return (
      <EmptyState
        title={
          <Typography variant="h1" sx={{ fontSize: 32, mb: 1.5 }}>
            {mode === "review" ? "Nothing to review yet" : "You've covered every word"}
          </Typography>
        }
        text={mode === "review" ? "Finish a lesson first; studied words show up here." : "Revisit what you've learned instead."}
      >
        <ButtonLink href={mode === "review" ? `/${lang}/session/` : `/${lang}/session/?mode=review`}>
          {mode === "review" ? "Start a lesson" : "Review studied words"}
        </ButtonLink>
      </EmptyState>
    );

  const title = mode === "review" ? (onlyPractice ? "Practice weak words" : "Review") : "Lesson";

  if (phase.name === "learn") {
    const card = Math.min(phase.card, items.length - 1);
    const item = items[card];
    const last = card === items.length - 1;
    const counts =
      mode === "lesson" ? `${items.filter((i) => !i.review).length} new · ${items.filter((i) => i.review).length} review` : `${items.length} words`;

    async function skip() {
      const skipped = item.word;
      let replacement: Item | undefined;
      if (!item.review) {
        // Skipped new words never come back as new; pull in the next word so the lesson keeps its size.
        update((p) => skipWord(p, skipped.id));
        const next = pickNewWords(index!, skipWord(progress!, skipped.id), 1, new Set(items!.map((i) => i.word.id)))[0];
        if (next) replacement = { word: await fetchWord(lang, next.id), review: false };
      }
      const rest = items!.filter((i) => i !== item);
      const nextItems = replacement ? [...rest, replacement] : rest;
      setItems(nextItems);
      // The following word slides into this position.
      setPhase({ name: "learn", card: Math.max(0, Math.min(card, nextItems.length - 1)) });
      setNotice(
        item.review
          ? `Skipped “${skipped.lemma}” for this session.`
          : `Skipped “${skipped.lemma}”. It won't appear in lessons; bring it back from Words.`,
      );
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
        <WordCard key={item.word.id} word={item.word} lang={lang} autoSpeak badge={item.review ? "Review" : undefined} />
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
          <Button variant="outlined" disabled={card === 0} onClick={() => setPhase({ name: "learn", card: card - 1 })} aria-label="Previous word">
            ←
          </Button>
          <Button variant="text" onClick={skip}>
            Skip word
          </Button>
          <Button
            sx={{ flex: 1 }}
            onClick={() => {
              setNotice(null);
              if (last)
                setPhase({
                  name: "quiz",
                  questions: buildQuiz(
                    items.map((i) => i.word),
                    index,
                    language,
                    { speech: available === true },
                  ),
                });
              else setPhase({ name: "learn", card: card + 1 });
            }}
          >
            {last ? "Start quiz" : "Next word"}
          </Button>
        </Box>
      </>
    );
  }

  if (phase.name === "quiz") {
    return (
      <>
        <Top title="Quiz" />
        <Quiz
          questions={phase.questions}
          lang={lang}
          onDone={(results) => {
            update((p) =>
              recordSession(
                p,
                results.map((r) => ({ wordId: r.question.wordId, correct: r.grade !== "wrong" })),
                mode,
              ),
            );
            setPhase({ name: "results", results });
          }}
        />
      </>
    );
  }

  const { results } = phase;
  const score = results.filter((r) => r.grade !== "wrong").length;
  const missed = items.filter((i) => results.some((r) => r.question.wordId === i.word.id && r.grade === "wrong"));
  return (
    <>
      <Box
        component="section"
        sx={{ mt: 3.5, p: 3, textAlign: "center", bgcolor: C.tintSoft, boxShadow: `inset 0 0 0 2px ${C.rock}`, borderRadius: `${RADIUS}px` }}
      >
        <Box component="span" sx={{ fontSize: 14, fontWeight: 600 }}>
          {title} complete
        </Box>
        <Box sx={{ ...displayFont, ...num, fontSize: 72, lineHeight: 1, my: 1 }}>
          {score}/{results.length}
        </Box>
        <Box component="p" sx={{ m: 0 }}>
          {missed.length === 0 ? "Every answer right." : `${missed.length} word${missed.length > 1 ? "s" : ""} to practise again.`}
        </Box>
      </Box>
      <List disablePadding sx={{ mt: 2.5, borderTop: `1px solid ${C.line}` }}>
        {items.map(({ word, review }) => {
          const wrong = results.filter((r) => r.question.wordId === word.id && r.grade === "wrong").length;
          return (
            <li key={word.id}>
              <ListItemButton
                component={NextLink}
                href={`/${lang}/words/${word.id}/`}
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
          );
        })}
      </List>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, mt: 2.5 }}>
        {missed.length > 0 && (
          <ButtonLink href={`/${lang}/session/?mode=review&filter=practice`} variant="outlined" onClick={onRestart}>
            Practise missed words
          </ButtonLink>
        )}
        <Button sx={{ flex: 1 }} onClick={onRestart}>
          {mode === "review" ? "Review more" : "Next lesson"}
        </Button>
      </Box>
    </>
  );
}
