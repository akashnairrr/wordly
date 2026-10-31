import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { TextLink } from "@/components/links"
import { C, columnSx, displayFontSx, RADIUS } from "@/theme"
import { LanguageStart } from "./language-start"

export default function LanguagePicker() {
  return (
    <Box component="main" sx={{ ...columnSx, pb: 6 }}>
      <Box component="section" sx={{ pt: "calc(40px + env(safe-area-inset-top))", pb: 4 }}>
        <Box component="p" sx={{ ...displayFontSx, fontSize: 28, color: C.venice, m: "0 0 40px" }}>
          wordly
        </Box>
        <Typography variant="h1" sx={{ fontSize: "clamp(44px, 10vw, 80px)", maxWidth: "12ch" }}>
          Learn the words people actually say.
        </Typography>
        <Box component="p" sx={{ fontSize: 19, maxWidth: "50ch", mt: 2.5, mb: 0, color: C.muted }}>
          The most common spoken words of a language, one small lesson at a time: what they mean, how native speakers
          say them, how they change, and how they&apos;re used in real sentences.
        </Box>
      </Box>

      <Box
        component="section"
        sx={{ bgcolor: C.tintSoft, boxShadow: `inset 0 0 0 2px ${C.rock}`, borderRadius: `${RADIUS}px`, p: 3 }}
      >
        <Typography variant="h2" sx={{ fontSize: 22 }}>
          Choose a language
        </Typography>
        <LanguageStart />
        <Typography variant="body2" sx={{ color: C.venice }}>
          More languages are on the way. <TextLink href="/about/">Data sources & credits</TextLink>
        </Typography>
      </Box>
    </Box>
  )
}
