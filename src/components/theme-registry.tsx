"use client"

import CssBaseline from "@mui/material/CssBaseline"
import { ThemeProvider } from "@mui/material/styles"
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter"
import { theme } from "@/mui-theme"

interface ThemeRegistryProps {
  children: React.ReactNode
}

/** MUI theme plus Emotion's cache, so styles are rendered into the static HTML instead of injected after load. */
export function ThemeRegistry({ children }: ThemeRegistryProps) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        {/* Sets color-scheme, so form controls and scrollbars match the page. */}
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  )
}
