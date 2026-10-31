"use client";

import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useState } from "react";
import { getLanguage } from "@/lib/languages";
import type { Person, Word } from "@/lib/types";
import { FormRows } from "./FormsTable";

const PERSONS: Person[] = ["1s", "2s", "3s", "1p", "2p", "3p"];

export function ConjugationTable({ word, lang }: { word: Word; lang: string }) {
  const language = getLanguage(lang);
  const tenses = language.tenses.filter(({ mood, tense }) => Object.keys(word.conjugation?.[mood]?.[tense] ?? {}).length);
  const [active, setActive] = useState(0);
  const current = tenses[active];
  const row = current ? word.conjugation?.[current.mood]?.[current.tense] : undefined;

  const nonFinite = [
    ["Gerund (-ing)", word.nonFinite?.gerund],
    ["Past participle", word.nonFinite?.participle],
  ].filter((r): r is [string, string] => !!r[1]);

  return (
    <div>
      {tenses.length > 0 && (
        <ToggleButtonGroup
          exclusive
          value={active}
          onChange={(_, i: number | null) => i !== null && setActive(i)}
          aria-label="Tense"
          sx={{ mb: 0.75 }}
        >
          {tenses.map((t, i) => (
            <ToggleButton key={t.label} value={i}>
              {t.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}
      {row && (
        <FormRows
          lang={lang}
          rows={PERSONS.filter((p) => row[p]).map((p) => {
            const form = row[p]!;
            const recording = word.formAudio?.[form];
            // A recording is of the bare form; synthetic speech says it with its pronoun for context.
            // Imperatives are commands, so no pronoun.
            const spoken = recording || current.mood === "imperative" ? form : `${language.personLabels[p].split(" / ")[0]} ${form}`;
            return { label: language.personLabels[p], form, spoken, audio: recording };
          })}
        />
      )}
      {nonFinite.length > 0 && (
        <Box sx={{ mt: 1.5 }}>
          <FormRows lang={lang} rows={nonFinite.map(([label, form]) => ({ label, form, audio: word.formAudio?.[form] }))} />
        </Box>
      )}
    </div>
  );
}
