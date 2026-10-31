import Box from "@mui/material/Box"
import type { Metadata } from "next"
import { Header } from "@/components/header"
import { SpeechProvider } from "@/components/speech-provider"
import { getLanguage, LANGUAGES } from "@/lib/languages"
import { columnSx } from "@/theme"

export const dynamicParams = false

export function generateStaticParams() {
  return Object.keys(LANGUAGES).map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params
  return { title: `Wordly · ${getLanguage(lang).name}` }
}

export default async function LanguageLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params
  return (
    <SpeechProvider lang={lang}>
      <Header lang={lang} />
      <Box component="main" sx={{ ...columnSx, pb: "calc(48px + env(safe-area-inset-bottom))" }}>
        {children}
      </Box>
    </SpeechProvider>
  )
}
