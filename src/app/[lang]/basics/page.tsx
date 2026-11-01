import Box from "@mui/material/Box"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import { SpeakButton } from "@/components/speak-button"
import { ALPHABETS, BASICS } from "@/lib/basics"
import { getLanguage } from "@/lib/languages"
import { C } from "@/theme"

export async function generateMetadata({ params }: PageProps<"/[lang]/basics">): Promise<Metadata> {
  const { lang } = await params
  return { title: `Wordly · ${getLanguage(lang).name} basics` }
}

export default async function BasicsPage({ params }: PageProps<"/[lang]/basics">) {
  const { lang } = await params
  const language = getLanguage(lang)
  const alphabet = ALPHABETS[lang]
  return (
    <>
      <Typography variant="h1" sx={{ mt: 3.5, mb: 1 }}>
        {language.name} basics
      </Typography>
      <Box component="p" sx={{ mt: 0, color: C.muted, maxWidth: "52ch" }}>
        Letters, sounds and rules that English doesn&apos;t have. Tap the speaker to hear each example.
      </Box>
      {alphabet && (
        <Box component="section" sx={{ mt: 5 }}>
          <Typography variant="h2" sx={{ mb: 1.75 }}>
            The alphabet
          </Typography>
          <Box
            component="ul"
            sx={{
              listStyle: "none",
              p: 0,
              m: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 1.5,
            }}
          >
            {alphabet.map((l) => (
              <Paper component="li" key={l.letter} variant="outlined" sx={{ p: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                  <Box component="span" lang={lang} sx={{ fontSize: 26, fontWeight: 700, color: C.venice }}>
                    {l.letter}
                  </Box>
                  <SpeakButton text={l.example} size="sm" />
                </Box>
                <Box component="p" sx={{ my: 0.5, fontSize: 14 }}>
                  {l.sound}
                </Box>
                <Box component="p" sx={{ m: 0, fontSize: 15 }}>
                  <Box component="b" lang={lang} sx={{ color: C.venice }}>
                    {l.example}
                  </Box>{" "}
                  <Box component="span" sx={{ color: C.muted }}>
                    {l.en}
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      )}
      {(BASICS[lang] ?? []).map((group) => (
        <Box component="section" key={group.title} sx={{ mt: 5 }}>
          <Typography variant="h2" sx={{ mb: 1.75 }}>
            {group.title}
          </Typography>
          <Box sx={{ display: "grid", gap: 2 }}>
            {group.entries.map((entry) => (
              <Paper key={entry.title} variant="outlined" sx={{ p: 2.5 }}>
                <Typography variant="h3">{entry.title}</Typography>
                <Box component="p" sx={{ mt: 0.75, mb: entry.examples ? 1.5 : 0, maxWidth: "62ch" }}>
                  {entry.body}
                </Box>
                {entry.examples && (
                  <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gap: 1 }}>
                    {entry.examples.map((ex) => (
                      <Box component="li" key={ex.text} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                        <SpeakButton text={ex.text} size="sm" />
                        <Box component="span">
                          <Box component="b" lang={lang} sx={{ color: C.venice, fontSize: 17 }}>
                            {ex.text}
                          </Box>{" "}
                          <Box component="span" sx={{ color: C.muted, fontSize: 15 }}>
                            {ex.en}
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        </Box>
      ))}
    </>
  )
}
