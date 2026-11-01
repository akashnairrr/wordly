import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { DarkModeToggle } from "@/components/dark-mode-toggle"
import { Flag } from "@/components/flag"
import { ButtonLink, TextLink } from "@/components/links"
import { LANGUAGE_LIST } from "@/lib/languages"
import { C, columnSx, displayFontSx } from "@/theme"

export const metadata = { title: "Page not found · Wordly" }

/** Any URL the app doesn't have. The static export writes it to 404.html, which the host serves for broken links. */
export default function NotFound() {
  return (
    <Box component="main" sx={{ ...columnSx, pb: 6 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pt: "calc(40px + env(safe-area-inset-top))",
          mb: 5,
        }}
      >
        <TextLink href="/" underline="none" sx={{ ...displayFontSx, fontSize: 28, color: C.venice }}>
          wordly
        </TextLink>
        <DarkModeToggle />
      </Box>
      <Box aria-hidden sx={{ ...displayFontSx, fontSize: "clamp(96px, 26vw, 180px)", lineHeight: 0.9, color: C.rock }}>
        404
      </Box>
      <Typography variant="h1" sx={{ fontSize: "clamp(36px, 8vw, 56px)", mt: 2 }}>
        Lost in translation.
      </Typography>
      <Box component="p" sx={{ fontSize: 19, maxWidth: "46ch", mt: 2, mb: 3.5, color: C.muted }}>
        There&apos;s no page at this address. The link may be broken, or the page has moved.
      </Box>
      <ButtonLink href="/" sx={{ minHeight: 56, px: 4 }}>
        Back to Wordly
      </ButtonLink>
      <Box sx={{ mt: 5, pt: 3, borderTop: `1px solid ${C.line}` }}>
        <Box component="p" sx={{ m: "0 0 12px", color: C.muted }}>
          Or pick up where you left off:
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          {LANGUAGE_LIST.map((l) => (
            <ButtonLink key={l.code} href={`/${l.code}/`} variant="outlined" lang={l.code}>
              <Flag country={l.country} height={18} />
              {l.nativeName}
            </ButtonLink>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
