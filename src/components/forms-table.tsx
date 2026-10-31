import Box from "@mui/material/Box"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableRow from "@mui/material/TableRow"
import type { Word, WordForms } from "@/lib/types"
import { C } from "@/theme"
import { SpeakButton } from "./speak-button"

const LABELS: [keyof WordForms, string][] = [
  ["masculine", "Masculine"],
  ["feminine", "Feminine"],
  ["plural", "Plural"],
  ["masculinePlural", "Masculine plural"],
  ["femininePlural", "Feminine plural"],
  ["genitive", "Genitive"],
  ["comparative", "Comparative"],
  ["superlative", "Superlative"],
]

interface FormRow {
  label: string
  form: string
  /** What to say aloud, when it differs from the form (e.g. with its pronoun). */
  spoken?: string
  audio?: string
}

interface FormRowsProps {
  rows: FormRow[]
  lang: string
}

/** Label / form rows, each form with its own listen buttons. */
export function FormRows({ rows, lang }: FormRowsProps) {
  return (
    <Table size="small" sx={{ "& tr:last-child > *": { borderBottom: 0 } }}>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.label}>
            <TableCell component="th" scope="row" sx={{ color: C.muted, width: "42%", pr: 1.5 }}>
              {r.label}
            </TableCell>
            <TableCell>
              <Box
                component="span"
                sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}
              >
                <Box component="span" lang={lang} sx={{ fontWeight: 600 }}>
                  {r.form}
                </Box>
                <SpeakButton text={r.spoken ?? r.form} audio={r.audio} size="sm" />
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

interface FormsTableProps {
  word: Word
  lang: string
}

export function FormsTable({ word, lang }: FormsTableProps) {
  const forms = word.forms ?? {}
  // The headword is the base form: masculine (or feminine) singular when the word has gendered forms, plain singular
  // for nouns, and just the base form for words that only compare (German gut → besser).
  const gendered = !!(forms.feminine || forms.masculine)
  const base = gendered
    ? word.gender === "f" || forms.masculine
      ? "Feminine"
      : "Masculine"
    : forms.plural || forms.genitive || word.pos === "noun"
      ? "Singular"
      : "Base form"
  const rows: [string, string][] = [
    [base, word.lemma],
    ...LABELS.filter(([k]) => forms[k]).map(([k, l]) => [l, forms[k]!] as [string, string]),
  ]
  const audioFor = (form: string) => (form === word.lemma ? word.audio : word.formAudio?.[form])
  return <FormRows lang={lang} rows={rows.map(([label, form]) => ({ label, form, audio: audioFor(form) }))} />
}
