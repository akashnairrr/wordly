import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Flag } from "@/components/Flag";
import { TextLink } from "@/components/links";
import { LANGUAGES } from "@/lib/languages";
import { C, column, displayFont, RADIUS, RADIUS_SM } from "@/theme";

export default function LanguagePicker() {
  return (
    <Box component="main" sx={{ ...column, pb: 6 }}>
      <Box component="section" sx={{ pt: "calc(40px + env(safe-area-inset-top))", pb: 4 }}>
        <Box component="p" sx={{ ...displayFont, fontSize: 28, color: C.venice, m: "0 0 40px" }}>
          wordly
        </Box>
        <Typography variant="h1" sx={{ fontSize: "clamp(44px, 10vw, 80px)", maxWidth: "12ch" }}>
          Learn the words people actually say.
        </Typography>
        <Box component="p" sx={{ fontSize: 19, maxWidth: "50ch", mt: 2.5, mb: 0, color: C.muted }}>
          The most common spoken words of a language, one small lesson at a time: what they mean, how native speakers say them, how they change, and
          how they&apos;re used in real sentences.
        </Box>
      </Box>

      <Box component="section" sx={{ bgcolor: C.tintSoft, boxShadow: `inset 0 0 0 2px ${C.rock}`, borderRadius: `${RADIUS}px`, p: 3 }}>
        <Typography variant="h2" sx={{ fontSize: 22 }}>
          Choose a language
        </Typography>
        <Box component="ul" sx={{ listStyle: "none", p: 0, m: "14px 0 18px" }}>
          {Object.values(LANGUAGES).map((l) => (
            <li key={l.code}>
              <TextLink
                href={`/${l.code}/`}
                underline="none"
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1.5,
                  bgcolor: C.surface,
                  borderRadius: `${RADIUS_SM}px`,
                  px: 2.5,
                  py: 2.25,
                }}
              >
                <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1.75 }}>
                  <Flag country={l.country} height={28} />
                  <Box component="span" lang={l.code} sx={{ ...displayFont, fontSize: 30 }}>
                    {l.nativeName}
                  </Box>
                </Box>
                <Box component="span" sx={{ color: C.muted }}>
                  {l.name}
                </Box>
              </TextLink>
            </li>
          ))}
        </Box>
        <Typography variant="body2" sx={{ color: C.venice }}>
          More languages are on the way. <TextLink href="/about/">Data sources & credits</TextLink>
        </Typography>
      </Box>
    </Box>
  );
}
