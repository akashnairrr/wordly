"use client"

import Box from "@mui/material/Box"
import { keyframes } from "@mui/material/styles"
import { useState } from "react"
import { C } from "@/theme"

const fall = keyframes`
  from { transform: translateY(-20px) rotate(0); opacity: 1 }
  to { transform: translateY(420px) rotate(720deg); opacity: 0 }
`
const COLORS = [C.rock, C.venice, C.green, C.orange, C.purple, C.warning]

/** One burst of CSS confetti over the parent (which must be position: relative). Decorative only. */
export function Confetti() {
  // Random once per mount, not per render.
  const [bits] = useState(() =>
    Array.from({ length: 40 }, (_, n) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.6 + Math.random() * 1.2,
      size: 6 + Math.random() * 6,
      color: COLORS[n % COLORS.length],
      round: n % 3 === 0,
    }))
  )
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        "@media (prefers-reduced-motion: reduce)": { display: "none" },
      }}
    >
      {bits.map((b, n) => (
        <Box
          key={n}
          component="span"
          sx={{
            position: "absolute",
            top: 0,
            left: `${b.left}%`,
            width: b.size,
            height: b.round ? b.size : b.size * 0.45,
            borderRadius: b.round ? "50%" : "2px",
            bgcolor: b.color,
            opacity: 0,
            animation: `${fall} ${b.duration}s ${b.delay}s ease-in forwards`,
          }}
        />
      ))}
    </Box>
  )
}
