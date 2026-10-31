import type { Word, WordForms } from "@/lib/types";
import { SpeakButton } from "./SpeakButton";
import styles from "./WordCard.module.css";

const LABELS: [keyof WordForms, string][] = [
  ["masculine", "Masculine"],
  ["feminine", "Feminine"],
  ["plural", "Plural"],
  ["masculinePlural", "Masculine plural"],
  ["femininePlural", "Feminine plural"],
];

export function FormsTable({ word, lang }: { word: Word; lang: string }) {
  const forms = word.forms ?? {};
  // The headword is the base form (masculine singular for adjectives); show it as the first row.
  const gendered = !!(forms.feminine || forms.masculine) || word.pos === "adj";
  const base = !gendered ? "Singular" : word.gender === "f" || forms.masculine ? "Feminine" : "Masculine";
  const rows: [string, string][] = [[base, word.lemma], ...LABELS.filter(([k]) => forms[k]).map(([k, l]) => [l, forms[k]!] as [string, string])];
  const audioFor = (form: string) => (form === word.lemma ? word.audio : word.formAudio?.[form]);
  return (
    <table className={styles.table}>
      <tbody>
        {rows.map(([label, form]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>
              <span className={styles.formCell}>
                <span className={styles.form} lang={lang}>
                  {form}
                </span>
                <SpeakButton text={form} audio={audioFor(form)} size="sm" />
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
