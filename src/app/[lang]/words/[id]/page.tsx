import type { Metadata } from "next";
import Link from "next/link";
import { WordCard } from "@/components/WordCard";
import { WordStatusBar } from "@/components/WordStatusBar";
import { readIndex, readWord } from "@/lib/server-data";

export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { lang: string } }) {
  return readIndex(params.lang).map((w) => ({ id: w.id }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/words/[id]">): Promise<Metadata> {
  const { lang, id } = await params;
  const w = readWord(lang, id);
  return { title: `${w.lemma} — ${w.glosses[0]} · Wordly` };
}

export default async function WordPage({ params }: PageProps<"/[lang]/words/[id]">) {
  const { lang, id } = await params;
  const word = readWord(lang, id);
  return (
    <>
      <p style={{ margin: "20px 0 12px" }}>
        <Link href={`/${lang}/words/`}>← All words</Link>
      </p>
      <WordStatusBar lang={lang} id={id} />
      <WordCard word={word} lang={lang} />
    </>
  );
}
