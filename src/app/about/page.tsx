import Box from "@mui/material/Box"
import Link from "@mui/material/Link"
import Typography from "@mui/material/Typography"
import { TextLink } from "@/components/links"
import { C, columnSx } from "@/theme"

export const metadata = { title: "Data sources & credits · Wordly" }

const SOURCES = [
  {
    title: "Word frequency",
    body: (
      <>
        <Link href="https://github.com/hermitdave/FrequencyWords">FrequencyWords</Link> by Hermit Dave, built from{" "}
        <Link href="https://opus.nlpl.eu/OpenSubtitles.php">OpenSubtitles 2018</Link>. CC BY-SA 4.0.
      </>
    ),
  },
  {
    title: "Meanings, forms and conjugations",
    body: (
      <>
        <Link href="https://en.wiktionary.org/">Wiktionary</Link> contributors, via the{" "}
        <Link href="https://kaikki.org/">kaikki.org</Link> extract (Tatu Ylonen, Wiktextract). CC BY-SA 4.0 and GFDL.
      </>
    ),
  },
  {
    title: "Word recordings",
    body: (
      <>
        Native speakers on <Link href="https://lingualibre.org/">Lingua Libre</Link> and Wiktionary, hosted on{" "}
        <Link href="https://commons.wikimedia.org/">Wikimedia Commons</Link>. CC BY-SA (per recording).
      </>
    ),
  },
  {
    title: "Example sentences and their recordings",
    body: (
      <>
        <Link href="https://tatoeba.org/">Tatoeba</Link> contributors, via{" "}
        <Link href="https://www.manythings.org/anki/">manythings.org</Link>. Sentences CC BY 2.0 FR; recordings under
        each contributor&apos;s licence.
      </>
    ),
  },
]

export default function About() {
  return (
    <Box component="main" sx={{ ...columnSx, pb: 6 }}>
      <Box component="p" sx={{ mt: 3.5, mb: 0 }}>
        <TextLink href="/">← Wordly</TextLink>
      </Box>
      <Typography variant="h1" sx={{ mt: 2, mb: 1 }}>
        Data sources & credits
      </Typography>
      <Box component="p" sx={{ color: C.muted }}>
        Wordly is built entirely on open data. Thank you to everyone who contributed to these projects.
      </Box>
      <Box component="ul" sx={{ listStyle: "none", p: 0, my: 3, borderTop: `1px solid ${C.line}` }}>
        {SOURCES.map((s) => (
          <Box component="li" key={s.title} sx={{ py: 2, borderBottom: `1px solid ${C.line}` }}>
            <Typography variant="h3" sx={{ mb: 0.75 }}>
              {s.title}
            </Typography>
            <Box component="p" sx={{ m: 0 }}>
              {s.body}
            </Box>
          </Box>
        ))}
      </Box>
      <Typography variant="body2">
        The generated word data is a derivative of these sources and is shared under CC BY-SA 4.0. Where no recording
        exists, pronunciation uses your browser&apos;s built-in text-to-speech.
      </Typography>
    </Box>
  )
}
