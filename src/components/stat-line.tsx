import Box from "@mui/material/Box"
import { C, displayFontSx, numSx } from "@/theme"

interface StatLineProps {
  stats: { label: string; value: React.ReactNode }[]
}

/** Row of big numbers with labels, divided by rules. */
export function StatLine({ stats }: StatLineProps) {
  return (
    <Box
      component="dl"
      sx={{
        display: "grid",
        // Four don't fit a phone side by side: 2 × 2 there.
        gridTemplateColumns: {
          xs: `repeat(${stats.length > 3 ? 2 : stats.length}, 1fr)`,
          sm: `repeat(${stats.length}, 1fr)`,
        },
        mt: 3,
        mb: 0,
        borderBlock: `1px solid ${C.line}`,
      }}
    >
      {stats.map((s, i) => (
        <Box
          key={s.label}
          sx={{
            py: 2,
            px: 1.5,
            borderLeft: {
              xs: (stats.length > 3 ? i % 2 : i) ? `1px solid ${C.line}` : 0,
              sm: i ? `1px solid ${C.line}` : 0,
            },
            borderTop: { xs: stats.length > 3 && i > 1 ? `1px solid ${C.line}` : 0, sm: 0 },
          }}
        >
          <Box component="dt" sx={{ fontSize: 14, color: C.muted }}>
            {s.label}
          </Box>
          <Box
            component="dd"
            sx={{
              ...displayFontSx,
              ...numSx,
              m: "4px 0 0",
              fontSize: "clamp(28px, 6vw, 40px)",
              lineHeight: 1,
              color: C.venice,
            }}
          >
            {s.value}
          </Box>
        </Box>
      ))}
    </Box>
  )
}
