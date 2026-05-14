"use client"

import { motion } from "framer-motion"

export function AuroraBackground({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          {/* Aurora effect layers */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0.3, 0.5, 0.3],
              scale: [0.8, 1.2, 0.8],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full bg-primary/30 blur-[120px]"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.3, 1],
              x: [0, 100, 0],
              y: [0, -50, 0]
            }}
            transition={{ 
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/2 right-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/20 blur-[100px]"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.15, 0.35, 0.15],
              scale: [1.2, 0.9, 1.2],
            }}
            transition={{ 
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute bottom-0 left-1/3 w-[700px] h-[700px] rounded-full bg-cyan-500/20 blur-[130px]"
          />
        </div>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}

