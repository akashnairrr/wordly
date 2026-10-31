import type { ReactNode } from "react";
import type { Example, Word } from "@/lib/types";
import { allForms } from "@/lib/words";
import { SpeakButton } from "./SpeakButton";
import styles from "./WordCard.module.css";

const COLORS = 5;

/** One word or phrase with its meaning (and dictionary form, if inflected) underneath, in a matching colour. */
function Unit({ es, en, lemma, color, lang }: { es: string; en?: string; lemma?: string; color?: number; lang: string }) {
  return (
    <span className={`${styles.unit} ${color === undefined ? "" : styles[`c${color % COLORS}`]}`}>
      <span className={styles.es} lang={lang}>
        {es}
      </span>
      {en && (
        <span className={styles.en}>
          {lemma && (
            <span className={styles.dictForm} lang={lang}>
              {lemma}
            </span>
          )}
          {/* Keep "to come" and "the /" together when the meaning wraps under a short word. */}
          {en.replace(/^to /, "to\u00a0").replaceAll(" / ", "\u00a0/ ")}
        </span>
      )}
    </span>
  );
}

/**
 * The sentence split into its words, each with its meaning below (phrases like "por favor" as one unit).
 * The word being taught keeps its own highlight instead of a gloss.
 */
function GlossedSentence({ ex, forms, lang }: { ex: Example; forms: Set<string>; lang: string }) {
  // Odd entries are letter runs, aligned with ex.words; even entries are spaces and punctuation.
  const parts = ex.text.split(/(\p{L}+)/u);
  const items: ReactNode[] = [];
  let color = 0;
  for (let k = 0; k < parts.length; k++) {
    if (k % 2 === 0) {
      const punct = parts[k].trim();
      if (punct) items.push(<span key={k} className={styles.punct}>{punct}</span>);
      continue;
    }
    const token = (k - 1) / 2;
    const phrase = ex.phrases?.find(([start]) => start === token);
    if (phrase) {
      const last = k + 2 * (phrase[1] - phrase[0] - 1);
      items.push(<Unit key={k} es={parts.slice(k, last + 1).join("")} en={phrase[2]} color={color++} lang={lang} />);
      k = last;
      continue;
    }
    const word = parts[k];
    if (forms.has(word.toLowerCase())) {
      items.push(
        <span key={k} className={styles.unit}>
          <mark lang={lang}>{word}</mark>
        </span>,
      );
      continue;
    }
    const gloss = ex.words?.[token];
    items.push(
      gloss ? (
        <Unit key={k} es={word} en={gloss.g} lemma={gloss.l} color={color++} lang={lang} />
      ) : (
        <Unit key={k} es={word} lang={lang} />
      ),
    );
  }
  return <div className={styles.sentence}>{items}</div>;
}

export function ExampleList({ word, lang }: { word: Word; lang: string }) {
  if (!word.examples.length) return <p className="small">No example sentences found for this word yet.</p>;
  const forms = new Set(allForms(word).map((f) => f.toLowerCase()));
  return (
    <ul className={styles.examples}>
      {word.examples.map((ex) => (
        <li key={ex.text} className={styles.example}>
          <div className={styles.exampleHead}>
            <GlossedSentence ex={ex} forms={forms} lang={lang} />
            <SpeakButton text={ex.text} audio={ex.audio} size="sm" />
          </div>
          <div className={styles.translation}>{ex.en}</div>
        </li>
      ))}
    </ul>
  );
}
