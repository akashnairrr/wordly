"use client"

import Chip, { type ChipProps } from "@mui/material/Chip"
import NextLink from "next/link"
import { CURRENT_VERSION } from "@/lib/changelog"

interface VersionChipProps {
  sx?: ChipProps["sx"]
}

/** The current version; links to the changelog. */
export function VersionChip({ sx }: VersionChipProps) {
  return (
    <Chip
      component={NextLink}
      href="/changelog/"
      clickable
      variant="outlined"
      label={`v${CURRENT_VERSION}`}
      aria-label={`Version ${CURRENT_VERSION}: what's new`}
      title="What's new"
      sx={[{ fontSize: 12, minHeight: 22, flexShrink: 0 }, ...(Array.isArray(sx) ? sx : [sx ?? {}])]}
    />
  )
}
