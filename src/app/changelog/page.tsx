import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { TextLink } from "@/components/links"
import { CHANGELOG } from "@/lib/changelog"
import { C, columnSx } from "@/theme"

export const metadata = { title: "What's new · Wordly" }

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })

export default function Changelog() {
  return (
    <Box component="main" sx={{ ...columnSx, pb: 6 }}>
      <Box component="p" sx={{ mt: 3.5, mb: 0 }}>
        <TextLink href="/">← Wordly</TextLink>
      </Box>
      <Typography variant="h1" sx={{ mt: 2, mb: 1 }}>
        What&apos;s new
      </Typography>
      <Box component="p" sx={{ color: C.muted }}>
        Everything that&apos;s changed in Wordly, newest first.
      </Box>
      {CHANGELOG.map((r, i) => (
        <Box component="section" key={r.version} sx={{ mt: 5 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", columnGap: 1.5 }}>
            <Typography variant="h2">v{r.version}</Typography>
            <Box component="span" sx={{ fontSize: 15, color: C.muted }}>
              <time dateTime={r.date}>{formatDate(r.date)}</time>
              {i === 0 && " · current version"}
            </Box>
          </Box>
          <Typography variant="h3" component="p" sx={{ mt: 0.75, mb: 1.5 }}>
            {r.title}
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5, display: "grid", gap: 0.75, maxWidth: "62ch" }}>
            {r.changes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  )
}
