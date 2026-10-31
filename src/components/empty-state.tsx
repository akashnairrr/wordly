import Box from "@mui/material/Box"
import { C } from "@/theme"

interface EmptyStateProps {
  title?: React.ReactNode
  text: React.ReactNode
  children?: React.ReactNode
}

/** Centred message with its next step. */
export function EmptyState({ title, text, children }: EmptyStateProps) {
  return (
    <Box sx={{ textAlign: "center", py: 5, px: 2 }}>
      {title}
      <Box component="p" sx={{ m: "0 0 16px", color: C.muted }}>
        {text}
      </Box>
      {children}
    </Box>
  )
}
