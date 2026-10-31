"use client"

import AppBar from "@mui/material/AppBar"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Toolbar from "@mui/material/Toolbar"
import NextLink from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { switchLanguagePath } from "@/lib/languages"
import { C, columnSx, displayFontSx, Z } from "@/theme"

// Small phones (iPhone SE, 320px): logo, three links and the language flag only just fit.
const TINY = "@media (max-width: 359.95px)"
import { LanguageSelect } from "./language-select"

interface HeaderProps {
  lang: string
}

export function Header({ lang }: HeaderProps) {
  const router = useRouter()
  const path = usePathname().replace(/\/?$/, "/")
  const links = [
    { href: `/${lang}/`, label: "Today", active: path === `/${lang}/` || path.startsWith(`/${lang}/session`) },
    { href: `/${lang}/words/`, label: "Words", active: path.startsWith(`/${lang}/words`) },
    { href: `/${lang}/progress/`, label: "Progress", active: path.startsWith(`/${lang}/progress`) },
  ]
  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="inherit"
      sx={{ zIndex: Z.header, bgcolor: C.merino, borderBottom: `1px solid ${C.line}`, pt: "env(safe-area-inset-top)" }}
    >
      <Toolbar disableGutters sx={{ ...columnSx, width: "100%", minHeight: 60, gap: { xs: 0.75, sm: 2.5 } }}>
        <Box
          component={NextLink}
          href="/"
          sx={{
            ...displayFontSx,
            fontSize: 26,
            color: C.venice,
            textDecoration: "none",
            lineHeight: 1,
            [TINY]: { fontSize: 22 },
          }}
        >
          wordly
        </Box>
        <Box
          component="nav"
          aria-label="Main"
          sx={{ display: "flex", gap: { xs: 0.25, sm: 0.5 }, flex: 1, minWidth: 0 }}
        >
          {links.map((l) => (
            <Button
              key={l.href}
              component={NextLink}
              href={l.href}
              variant="text"
              aria-current={l.active ? "page" : undefined}
              sx={{
                minHeight: 0,
                minWidth: 0,
                flexShrink: 0,
                px: { xs: 0.75, sm: 1.25 },
                py: 1,
                fontSize: { xs: 15, sm: 17 },
                [TINY]: { fontSize: 14, px: 0.5 },
                fontWeight: 500,
                "&[aria-current=page]": {
                  color: C.venice,
                  fontWeight: 600,
                  bgcolor: C.tintSoft,
                  boxShadow: `inset 0 -3px 0 ${C.rock}`,
                },
              }}
            >
              {l.label}
            </Button>
          ))}
        </Box>
        {/* Switching keeps you on the same page (Words, Progress…) in the other language. */}
        <LanguageSelect size="small" value={lang} onChange={(to) => router.push(switchLanguagePath(path, to))} />
      </Toolbar>
    </AppBar>
  )
}
