import type { Metadata } from "next"
import Box from "@mui/material/Box"
import { WordsBackLink } from "@/components/links"
import { WordCard } from "@/components/word-card"
import { WordStatusBar } from "@/components/word-status-bar"
import { readIndex, readWord } from "@/lib/server-data"

export const dynamicParams = false

export function generateStaticParams({ params }: { params: { lang: string } }) {
  return readIndex(params.lang).map((w) => ({ id: w.id }))
}

export async function generateMetadata({ params }: PageProps<"/[lang]/words/[id]">): Promise<Metadata> {
  const { lang, id } = await params
  const w = readWord(lang, id)
  return { title: `${w.lemma} — ${w.glosses[0]} · Wordly` }
}

export default async function WordPage({ params }: PageProps<"/[lang]/words/[id]">) {
  const { lang, id } = await params
  const word = readWord(lang, id)
  return (
    <>
      <Box component="p" sx={{ mt: 2.5, mb: 1.5 }}>
        <WordsBackLink lang={lang} />
      </Box>
      <WordStatusBar lang={lang} id={id} />
      <WordCard word={word} lang={lang} />
    </>
  )
}
