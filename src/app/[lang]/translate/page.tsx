import type { Metadata } from "next"
import { getLanguage } from "@/lib/languages"
import { TranslateView } from "./translate-view"

export async function generateMetadata({ params }: PageProps<"/[lang]/translate">): Promise<Metadata> {
  const { lang } = await params
  return { title: `Wordly · Translate to ${getLanguage(lang).name}` }
}

export default async function TranslatePage({ params }: PageProps<"/[lang]/translate">) {
  const { lang } = await params
  return <TranslateView lang={lang} />
}
