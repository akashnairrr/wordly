"use client"

import AppBar from "@mui/material/AppBar"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Toolbar from "@mui/material/Toolbar"
import NextLink from "next/link"
import { usePathname } from "next/navigation"
import { C, columnSx, displayFontSx, Z } from "@/theme"

interface HeaderProps {
  lang: string
  languageName: string
}

export function Header({ lang, languageName }: HeaderProps) {
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
      <Toolbar disableGutters sx={{ ...columnSx, width: "100%", minHeight: 60, gap: { xs: 1.25, sm: 2.5 } }}>
        <Box
          component={NextLink}
          href="/"
          sx={{ ...displayFontSx, fontSize: 26, color: C.venice, textDecoration: "none", lineHeight: 1 }}
        >
          wordly
        </Box>
        <Box component="nav" aria-label="Main" sx={{ display: "flex", gap: 0.5, flex: 1 }}>
          {links.map((l) => (
            <Button
              key={l.href}
              component={NextLink}
              href={l.href}
              variant="text"
              aria-current={l.active ? "page" : undefined}
              sx={{
                minHeight: 0,
                px: { xs: 1, sm: 1.25 },
                py: 1,
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
        <Box component="span" sx={{ fontSize: 14, color: C.muted, display: { xs: "none", sm: "inline" } }}>
          {languageName}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
