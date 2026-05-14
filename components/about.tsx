"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Target, Eye, Heart, Lightbulb, Users, Award, Clock } from "lucide-react"
import { useLanguage } from "@/lib/i18n"
import Image from "next/image"

const techStack = [
  "React", "Next.js", "Node.js", "TypeScript", "Python", "Flutter",
  "PostgreSQL", "MongoDB", "AWS", "Docker", "Firebase", "TailwindCSS"
]

interface AboutContent {
  title?: string
  description?: string
}

interface AboutProps {
  content?: AboutContent | null
}

export function About({ content }: AboutProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { t } = useLanguage()
  const aboutTitle = content?.title
  const aboutDescription = content?.description || t("about.description")

  const values = [
    { icon: Lightbulb, title: "Innovación", desc: "Tecnologías de vanguardia" },
    { icon: Users, title: "Colaboración", desc: "Trabajo en equipo" },
    { icon: Award, title: "Calidad", desc: "Código de excelencia" },
    { icon: Clock, title: "Compromiso", desc: "Entrega puntual" },
  ]

  return (
    <section id="nosotros" className="py-24 relative overflow-hidden" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-card/30" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      {/* Floating elements */}
      <motion.div 
        className="absolute top-20 right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
              {t("nav.about")}
            </span>
            {aboutTitle ? (
              <h2 className="text-3xl md:text-5xl font-bold mb-6">{aboutTitle}</h2>
            ) : (
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                {t("about.title").split(" ")[0]}{" "}
                <span className="gradient-text">{t("about.title").split(" ").slice(1).join(" ")}</span>
              </h2>
            )}
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              {aboutDescription}
            </p>

            {/* Mission, Vision, Values */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: Target, key: "mission" },
                { icon: Eye, key: "vision" },
                { icon: Heart, key: "values" },
              ].map((item, index) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="p-5 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-bold mb-1">{t(`about.${item.key}.title`)}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {t(`about.${item.key}.desc`)}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Logo & Values */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* Central Logo */}
            <motion.div
              className="relative w-48 h-48 mx-auto mb-12"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/images/olbrox-logo.png"
                alt="Olbrox Tech"
                fill
                className="object-contain"
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/20 blur-3xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.div>

            {/* Values Grid */}
            <div className="grid grid-cols-2 gap-4">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="p-5 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <value.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-bold mb-1">{value.title}</h3>
                  <p className="text-muted-foreground text-xs">{value.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Technologies Marquee */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 relative"
        >
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
          
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-8 py-4"
              animate={{ x: [0, -1000] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              {[...techStack, ...techStack, ...techStack].map((tech, index) => (
                <div
                  key={`${tech}-${index}`}
                  className="flex-shrink-0 px-6 py-3 rounded-full bg-card/50 border border-border/50 text-muted-foreground font-medium hover:text-primary hover:border-primary/30 transition-colors cursor-default"
                >
                  {tech}
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

