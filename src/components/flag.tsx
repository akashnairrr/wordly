// Inline SVG flags: emoji flags render as plain letters on Windows. Add a country here when adding a language.
const FLAGS: Record<string, React.ReactNode> = {
  // Germany: black–red–gold, three equal bands.
  DE: (
    <>
      <rect width="3" height="2" fill="#000000" />
      <rect y="0.6667" width="3" height="0.6667" fill="#DD0000" />
      <rect y="1.3333" width="3" height="0.6667" fill="#FFCE00" />
    </>
  ),
  // Russia: white–blue–red, three equal bands.
  RU: (
    <>
      <rect width="3" height="2" fill="#FFFFFF" />
      <rect y="0.6667" width="3" height="0.6667" fill="#0039A6" />
      <rect y="1.3333" width="3" height="0.6667" fill="#D52B1E" />
    </>
  ),
  // Spain, civil flag (red–yellow–red, 1:2:1), without the coat of arms so it stays crisp at small sizes.
  ES: (
    <>
      <rect width="3" height="2" fill="#AA151B" />
      <rect y="0.5" width="3" height="1" fill="#F1BF00" />
    </>
  ),
}

interface FlagProps {
  country: string
  height?: number
}

/** Decorative: always shown next to the language name, so hidden from screen readers. */
export function Flag({ country, height = 24 }: FlagProps) {
  const flag = FLAGS[country]
  if (!flag) return null
  return (
    <svg
      viewBox="0 0 3 2"
      width={height * 1.5}
      height={height}
      aria-hidden
      style={{ borderRadius: 4, flexShrink: 0, boxShadow: "0 0 0 1px var(--c-flagRing)" }}
    >
      {flag}
    </svg>
  )
}
