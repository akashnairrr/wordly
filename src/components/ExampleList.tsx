import { Fragment } from "react";
import type { Word } from "@/lib/types";
import { allForms } from "@/lib/words";
import { SpeakButton } from "./SpeakButton";
import styles from "./WordCard.module.css";

/** Highlights whichever form of the word appears in the sentence. */
function highlight(text: string, forms: Set<string>) {
  return text.split(/(\p{L}+)/u).map((part, i) =>
    forms.has(part.toLowerCase()) ? <mark key={i}>{part}</mark> : <Fragment key={i}>{part}</Fragment>,
  );
}

export function ExampleList({ word, lang }: { word: Word; lang: string }) {
  if (!word.examples.length) return <p className="small">No example sentences found for this word yet.</p>;
  const forms = new Set(allForms(word).map((f) => f.toLowerCase()));
  return (
    <ul className={styles.examples}>
      {word.examples.map((ex) => (
        <li key={ex.text} className={styles.example}>
          <div className="spread">
            <div className={styles.exampleText} lang={lang}>
              {highlight(ex.text, forms)}
            </div>
            <SpeakButton text={ex.text} audio={ex.audio} size="sm" />
          </div>
          <div className="small">{ex.en}</div>
        </li>
      ))}
    </ul>
  );
}
