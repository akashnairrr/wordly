import type { Metadata, Viewport } from "next"
import { Fraunces, Jost } from "next/font/google"
import { ThemeRegistry } from "@/components/theme-registry"
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
  themeColor: "#F5EEDD",
  // Light only, on every device: "only" also opts out of browsers that darken pages themselves (Chrome's auto dark
  // mode on Android, Samsung Internet's dark mode).
  colorScheme: "only light",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  )
}
