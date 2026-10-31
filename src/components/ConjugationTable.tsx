"use client";

import { useState } from "react";
import { getLanguage } from "@/lib/languages";
import type { Person, Word } from "@/lib/types";
import { SpeakButton } from "./SpeakButton";
import styles from "./WordCard.module.css";

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
        <div className="segments" role="group" aria-label="Tense" style={{ marginBottom: 6 }}>
          {tenses.map((t, i) => (
            <button key={t.label} type="button" className="segment" aria-pressed={i === active} onClick={() => setActive(i)}>
              {t.label}
            </button>
          ))}
        </div>
      )}
      {row && (
        <table className={styles.table}>
          <tbody>
            {PERSONS.filter((p) => row[p]).map((p) => {
              const form = row[p]!;
              const recording = word.formAudio?.[form];
              // A recording is of the bare form; synthetic speech says it with its pronoun for context.
              // Imperatives are commands, so no pronoun.
              const spoken = recording || current.mood === "imperative" ? form : `${language.personLabels[p].split(" / ")[0]} ${form}`;
              return (
                <tr key={p}>
                  <th scope="row">{language.personLabels[p]}</th>
                  <td>
                    <span className={styles.formCell}>
                      <span className={styles.form} lang={lang}>
                        {form}
                      </span>
                      <SpeakButton text={spoken} audio={recording} size="sm" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {nonFinite.length > 0 && (
        <table className={styles.table} style={{ marginTop: 12 }}>
          <tbody>
            {nonFinite.map(([label, form]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>
                  <span className={styles.formCell}>
                    <span className={styles.form} lang={lang}>
                      {form}
                    </span>
                    <SpeakButton text={form} audio={word.formAudio?.[form]} size="sm" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
