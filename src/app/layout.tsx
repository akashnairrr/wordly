import type { Metadata, Viewport } from "next"
import { Fraunces, Jost } from "next/font/google"
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript"
import { ThemeRegistry } from "@/components/theme-registry"
import { DARK, LIGHT } from "@/theme"
import "./globals.css"

const display = Fraunces({
  subsets: ["latin", "latin-ext"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-display",
})
const body = Jost({ subsets: ["latin", "latin-ext"], variable: "--font-body" })

export const metadata: Metadata = {
  title: "Wordly",
  description:
    "Learn the most common words of a language in context: meanings, native pronunciation, conjugations, gendered forms and real sentences.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Follows the system scheme; a choice made with the header toggle only changes the page, not the browser bar.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: LIGHT.merino },
    { media: "(prefers-color-scheme: dark)", color: DARK.merino },
  ],
  colorScheme: "light dark",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The init script sets the light / dark class before React hydrates.
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" />
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  )
}
