import Box from "@mui/material/Box";
import { C, displayFont, num } from "@/theme";

/** Row of three big numbers with labels, divided by rules. */
export function StatLine({ stats }: { stats: { label: string; value: React.ReactNode }[] }) {
  return (
    <Box
      component="dl"
      sx={{ display: "grid", gridTemplateColumns: `repeat(${stats.length}, 1fr)`, mt: 3, mb: 0, borderBlock: `1px solid ${C.line}` }}
    >
      {stats.map((s, i) => (
        <Box key={s.label} sx={{ py: 2, px: 1.5, borderLeft: i ? `1px solid ${C.line}` : 0 }}>
          <Box component="dt" sx={{ fontSize: 14, color: C.muted }}>
            {s.label}
          </Box>
          <Box component="dd" sx={{ ...displayFont, ...num, m: "4px 0 0", fontSize: "clamp(28px, 6vw, 40px)", lineHeight: 1, color: C.venice }}>
            {s.value}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
