"use client"

import AppBar from "@mui/material/AppBar"
import Box from "@mui/material/Box"
import Drawer from "@mui/material/Drawer"
import IconButton from "@mui/material/IconButton"
import SvgIcon from "@mui/material/SvgIcon"
import Toolbar from "@mui/material/Toolbar"
import NextLink from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getLanguage } from "@/lib/languages"
import { saveLastLanguage } from "@/lib/last-language"
import { C, columnSx, displayFontSx, NAV_WIDTH, shellSx, Z } from "@/theme"
import { ConfirmModal } from "./confirm-dialog"
import { DarkModeToggle } from "./dark-mode-toggle"
import { LanguageSelect } from "./language-select"

// The bar: 60px toolbar plus its 1px border, under the notch.
const BAR_HEIGHT = "calc(61px + env(safe-area-inset-top))"

interface HeaderProps {
  lang: string
}

export function Header({ lang }: HeaderProps) {
  const router = useRouter()
  const path = usePathname()
  // Language picked in the switcher, waiting for confirmation.
  const [switchTo, setSwitchTo] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const inLesson = path.startsWith(`/${lang}/session`)

  // Every language page remembers its language for the next visit to the landing page.
  useEffect(() => saveLastLanguage(lang), [lang])
  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="inherit"
      sx={{ zIndex: Z.header, bgcolor: C.merino, borderBottom: `1px solid ${C.line}`, pt: "env(safe-area-inset-top)" }}
    >
      <Toolbar disableGutters sx={{ ...columnSx, ...shellSx, width: "100%", minHeight: 60, gap: 1 }}>
        <IconButton
          onClick={() => setMenuOpen(true)}
          aria-label="Menu"
          aria-expanded={menuOpen}
          sx={{ display: { md: "none" }, ml: -1, color: C.venice }}
        >
          <MenuIcon />
        </IconButton>
        <Box
          component={NextLink}
          href="/"
          sx={{ ...displayFontSx, fontSize: 26, color: C.venice, textDecoration: "none", lineHeight: 1, mr: "auto" }}
        >
          wordly
        </Box>
        <LanguageSelect size="small" value={lang} onChange={(to) => to !== lang && setSwitchTo(to)} />
        <DarkModeToggle />
        <Drawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          sx={{ display: { md: "none" } }}
          slotProps={{ paper: { sx: { width: 260, bgcolor: C.merino, pt: "env(safe-area-inset-top)" } } }}
        >
          <Box sx={{ ...displayFontSx, fontSize: 26, color: C.venice, px: 2.5, py: 2.25 }}>wordly</Box>
          <NavLinks lang={lang} onNavigate={() => setMenuOpen(false)} />
        </Drawer>
        {switchTo && (
          <ConfirmModal
            open
            onClose={() => setSwitchTo(null)}
            title={`Switch to ${getLanguage(switchTo).name}?`}
            body={
              <>
                You&apos;ll go to the {getLanguage(switchTo).name} home page. Your {getLanguage(lang).name} progress
                stays saved{inLesson ? ", but the lesson you're in now won't be" : ""}.
              </>
            }
            confirmLabel={`Switch to ${getLanguage(switchTo).nativeName}`}
            onConfirm={() => router.push(`/${switchTo}/`)}
          />
        )}
      </Toolbar>
    </AppBar>
  )
}

/** The page links down the left on desktop; below md they live in the header's drawer instead. */
export function SideNav({ lang }: HeaderProps) {
  return (
    <Box
      sx={{
        display: { xs: "none", md: "block" },
        width: NAV_WIDTH,
        flexShrink: 0,
        position: "sticky",
        top: BAR_HEIGHT,
        alignSelf: "flex-start",
        pt: 3,
        pl: "max(8px, env(safe-area-inset-left))",
      }}
    >
      <NavLinks lang={lang} />
    </Box>
  )
}

interface NavLinksProps {
  lang: string
  onNavigate?: () => void
}

function NavLinks({ lang, onNavigate }: NavLinksProps) {
  const path = usePathname().replace(/\/?$/, "/")
  const links = [
    { href: `/${lang}/`, label: "Today", active: path === `/${lang}/` || path.startsWith(`/${lang}/session`) },
    { href: `/${lang}/words/`, label: "Words", active: path.startsWith(`/${lang}/word`) },
    { href: `/${lang}/basics/`, label: "Basics", active: path.startsWith(`/${lang}/basics`) },
    { href: `/${lang}/translate/`, label: "Translate", active: path.startsWith(`/${lang}/translate`) },
    { href: `/${lang}/progress/`, label: "Progress", active: path.startsWith(`/${lang}/progress`) },
  ]
  return (
    <Box component="nav" aria-label="Main">
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 0.5 }}>
        {links.map((l) => (
          <li key={l.href}>
            <Box
              component={NextLink}
              href={l.href}
              onClick={onNavigate}
              aria-current={l.active ? "page" : undefined}
              sx={{
                display: "block",
                px: 2,
                py: 1.25,
                mr: { xs: 1.5, md: 2 },
                borderRadius: "0 999px 999px 0",
                fontSize: 17,
                fontWeight: 500,
                color: C.muted,
                textDecoration: "none",
                "&:hover": { color: C.venice, bgcolor: C.tintSoft },
                "&[aria-current=page]": {
                  color: C.venice,
                  fontWeight: 600,
                  bgcolor: C.tintSoft,
                  boxShadow: `inset 3px 0 0 ${C.rock}`,
                },
              }}
            >
              {l.label}
            </Box>
          </li>
        ))}
      </Box>
    </Box>
  )
}

function MenuIcon() {
  return (
    <SvgIcon sx={{ fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" }}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </SvgIcon>
  )
}
