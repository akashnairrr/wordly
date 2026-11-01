"use client"

import IconButton, { type IconButtonProps } from "@mui/material/IconButton"
import { useColorScheme } from "@mui/material/styles"
import SvgIcon from "@mui/material/SvgIcon"
import { useSyncExternalStore } from "react"
import { C } from "@/theme"
import { noSubscribe } from "./links"

interface DarkModeToggleProps {
  sx?: IconButtonProps["sx"]
}

/** Light / dark switch. The icon follows the class on <html>, so the static HTML shows the right one before hydrating. */
export function DarkModeToggle({ sx }: DarkModeToggleProps) {
  const { colorScheme, setMode } = useColorScheme()
  // The scheme is only known in the browser; leave aria-pressed off the static HTML.
  const hydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false
  )
  const dark = colorScheme === "dark"
  return (
    <IconButton
      onClick={() => setMode(dark ? "light" : "dark")}
      aria-label="Dark mode"
      aria-pressed={hydrated ? dark : undefined}
      sx={[{ flexShrink: 0, width: 36, height: 36, color: C.venice }, ...(Array.isArray(sx) ? sx : [sx ?? {}])]}
    >
      {/* Moon in light mode, sun in dark. */}
      <SvgIcon sx={{ fontSize: 22, ".dark &": { display: "none" } }}>
        <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-4.4 2.26 5.4 5.4 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
      </SvgIcon>
      <SvgIcon sx={{ fontSize: 22, display: "none", ".dark &": { display: "block" } }}>
        <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM11 1h2v3h-2zm0 19h2v3h-2zM1 11h3v2H1zm19 0h3v2h-3z" />
        <path d="M4.22 5.64l1.42-1.42 2.12 2.12-1.42 1.42zm12.02 12.02 1.42-1.42 2.12 2.12-1.42 1.42z" />
        <path d="M4.22 18.36l2.12-2.12 1.42 1.42-2.12 2.12zM16.24 6.34l2.12-2.12 1.42 1.42-2.12 2.12z" />
      </SvgIcon>
    </IconButton>
  )
}
