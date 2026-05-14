"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"

// Deterministic positions to avoid hydration mismatch
const dotPositions = [
  { left: 5, top: 12, duration: 3.2, delay: 0.5 },
  { left: 15, top: 85, duration: 4.1, delay: 1.2 },
  { left: 25, top: 35, duration: 3.8, delay: 2.8 },
  { left: 35, top: 68, duration: 4.5, delay: 0.3 },
  { left: 45, top: 22, duration: 3.3, delay: 3.5 },
  { left: 55, top: 92, duration: 4.2, delay: 1.8 },
  { left: 65, top: 48, duration: 3.6, delay: 4.2 },
  { left: 75, top: 15, duration: 4.8, delay: 0.8 },
  { left: 85, top: 72, duration: 3.9, delay: 2.1 },
  { left: 92, top: 38, duration: 4.4, delay: 3.9 },
  { left: 8, top: 55, duration: 3.5, delay: 1.5 },
  { left: 28, top: 8, duration: 4.0, delay: 4.5 },
  { left: 48, top: 78, duration: 3.7, delay: 0.1 },
  { left: 68, top: 28, duration: 4.3, delay: 2.5 },
  { left: 88, top: 58, duration: 3.4, delay: 3.2 },
  { left: 12, top: 42, duration: 4.6, delay: 1.0 },
  { left: 38, top: 95, duration: 3.1, delay: 4.0 },
  { left: 58, top: 5, duration: 4.7, delay: 0.7 },
  { left: 78, top: 62, duration: 3.0, delay: 2.3 },
  { left: 95, top: 18, duration: 4.9, delay: 3.7 },
]

export function GridPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a2e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Floating grid dots */}
      <div className="absolute inset-0">
        {dotPositions.map((dot, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/40 rounded-full"
            style={{
              left: `${dot.left}%`,
              top: `${dot.top}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: dot.duration,
              repeat: Infinity,
              delay: dot.delay,
            }}
          />
        ))}
      </div>
      
      {/* Scan line effect */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        animate={{
          top: ["-10%", "110%"],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  )
}

