// Inline SVG flags: emoji flags render as plain letters on Windows. Add a country here when adding a language.
const FLAGS: Record<string, React.ReactNode> = {
  // Spain, civil flag (red–yellow–red, 1:2:1), without the coat of arms so it stays crisp at small sizes.
  ES: (
    <>
      <rect width="3" height="2" fill="#AA151B" />
      <rect y="0.5" width="3" height="1" fill="#F1BF00" />
    </>
  ),
};

/** Decorative: always shown next to the language name, so hidden from screen readers. */
export function Flag({ country, height = 24 }: { country: string; height?: number }) {
  const flag = FLAGS[country];
  if (!flag) return null;
  return (
    <svg
      viewBox="0 0 3 2"
      width={height * 1.5}
      height={height}
      aria-hidden
      style={{ borderRadius: 4, flexShrink: 0, boxShadow: "0 0 0 1px rgb(22 88 123 / 0.15)" }}
    >
      {flag}
    </svg>
  );
}
