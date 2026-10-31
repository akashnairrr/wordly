import type { Metadata, Viewport } from "next";
import { Fraunces, Jost } from "next/font/google";
import "./globals.css";

const display = Fraunces({ subsets: ["latin", "latin-ext"], axes: ["SOFT", "WONK", "opsz"], variable: "--font-display" });
const body = Jost({ subsets: ["latin", "latin-ext"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Wordly",
  description: "Learn the most common words of a language in context: meanings, native pronunciation, conjugations, gendered forms and real sentences.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F5EEDD",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
