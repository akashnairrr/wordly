import Box from "@mui/material/Box";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { SpeechProvider } from "@/components/SpeechProvider";
import { getLanguage, LANGUAGES } from "@/lib/languages";
import { column } from "@/theme";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(LANGUAGES).map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  return { title: `Wordly · ${getLanguage(lang).name}` };
}

export default async function LanguageLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  return (
    <SpeechProvider lang={lang}>
      <Header lang={lang} languageName={getLanguage(lang).nativeName} />
      <Box component="main" sx={{ ...column, pb: "calc(48px + env(safe-area-inset-bottom))" }}>
        {children}
      </Box>
    </SpeechProvider>
  );
}
