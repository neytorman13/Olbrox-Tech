"use client"

import { motion, useInView } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react"
import { createClient } from "@/lib/db-client"
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import { useLanguage, type Language } from "@/lib/i18n"
import Image from "next/image"

type LocalizedItem<T> = Partial<Record<Language, T>>
type LocalizedTags = LocalizedItem<string[]>
type LocalizedText = LocalizedItem<string>

type Project = {
  title: string
  description: LocalizedText
  url: string
  image: string
  tags: LocalizedTags
  gradient: string
}

type ProjectRecord = {
  title: string
  description_es: string | null
  description_en: string | null
  description_pt: string | null
  project_url: string | null
  image_url: string | null
  tags: string[] | null
  gradient: string | null
  is_published: boolean | null
  display_order: number | null
}

const defaultProjects: Project[] = [
  {
    title: "Hack Evans",
    description: {
      es: "Plataforma educativa #1 para docentes en Ecuador. Simuladores actualizados, evaluaciones personalizadas y seguimiento en tiempo real del progreso.",
      en: "Educational platform #1 for teachers in Ecuador. Updated simulators, personalized evaluations and real-time progress tracking.",
      pt: "Plataforma educacional #1 para professores no Equador. Simuladores atualizados, avaliacoes personalizadas e acompanhamento em tempo real.",
    },
    url: "https://hack-evans.netlify.app/",
    image: "/images/projects/hack-evans.jpg",
    tags: {
      es: ["Next.js", "Panel", "Educacion", "IA"],
      en: ["Next.js", "Dashboard", "Education", "AI"],
      pt: ["Next.js", "Painel", "Educacao", "IA"],
    },
    gradient: "from-red-500 to-orange-500",
  },
  {
    title: "ManaCacao - ASO PROCANAM",
    description: {
      es: "Sistema web para la Asociacion de Produccion Agricola de Cacao Nacional La Mana. Gestion completa de socios, productos y comercializacion.",
      en: "Web system for the Agricultural Production Association of National Cacao La Mana. Complete management of partners, products and marketing.",
      pt: "Sistema web para a Associacao de Producao Agricola de Cacau Nacional La Mana. Gestao completa de socios, produtos e comercializacao.",
    },
    url: "https://aso-procanam.vercel.app/",
    image: "/images/projects/mana-cacao.png",
    tags: {
      es: ["Next.js", "Vercel", "Agricultura", "Gestion"],
      en: ["Next.js", "Vercel", "Agriculture", "Management"],
      pt: ["Next.js", "Vercel", "Agricultura", "Gestao"],
    },
    gradient: "from-green-500 to-emerald-500",
  },
  {
    title: "S.P.A. Talleres",
    description: {
      es: "Plataforma web profesional para taller automotriz. Planchado y pintura al horno en Arequipa con acabado garantizado y resultados duraderos.",
      en: "Professional web platform for automotive workshop. Professional bodywork and paint in Arequipa with guaranteed finish and lasting results.",
      pt: "Plataforma web profissional para oficina automotiva. Funilaria e pintura profissional em Arequipa com acabamento garantido e resultados duradouros.",
    },
    url: "https://spatalleres.netlify.app/",
    image: "/images/projects/spa-talleres.png",
    tags: {
      es: ["React", "Sitio Web", "Automotriz", "UI/UX"],
      en: ["React", "Landing Page", "Automotive", "UI/UX"],
      pt: ["React", "Landing Page", "Automotivo", "UI/UX"],
    },
    gradient: "from-lime-400 to-green-500",
  },
]

function getSlidesPerView(width: number) {
  if (width >= 1280) return 3
  if (width >= 768) return 2
  return 1
}

export function Projects() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [activeProject, setActiveProject] = useState(0)
  const [slidesPerView, setSlidesPerView] = useState(1)
  const [projects, setProjects] = useState<Project[]>(defaultProjects)
  const { language, t } = useLanguage()
  const db = useMemo(() => createClient(), [])

  useEffect(() => {
    setSlidesPerView(getSlidesPerView(window.innerWidth))

    function handleResize() {
      setSlidesPerView(getSlidesPerView(window.innerWidth))
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    async function loadProjects() {
      try {
        const { data, error } = await db
          .from("projects")
          .select("*")
          .eq("is_published", true)
          .order("display_order", { ascending: true })

        if (error) {
          console.error("Error loading projects:", error)
          return
        }

        if (data && data.length > 0) {
          setProjects(
            data.map((project: ProjectRecord) => ({
              title: project.title || "",
              description: {
                es: project.description_es || "",
                en: project.description_en || "",
                pt: project.description_pt || "",
              },
              url: project.project_url || "#",
              image: project.image_url || "/images/projects/placeholder.png",
              tags: {
                es: project.tags || [],
                en: project.tags || [],
                pt: project.tags || [],
              },
              gradient: project.gradient || "from-blue-500 to-cyan-500",
            })),
          )
        }
      } catch (error) {
        console.error("Exception loading projects:", error)
      }
    }

    void loadProjects()
  }, [db])

  const maxIndex = Math.max(projects.length - slidesPerView, 0)

  useEffect(() => {
    setActiveProject((current) => Math.min(current, maxIndex))
  }, [maxIndex])

  function nextProject() {
    setActiveProject((prev) => (prev >= maxIndex ? 0 : prev + 1))
  }

  function prevProject() {
    setActiveProject((prev) => (prev <= 0 ? maxIndex : prev - 1))
  }

  return (
    <section id="proyectos" className="relative overflow-hidden py-24" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-card/50 to-background" />
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute inset-0 grid-pattern opacity-50" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <motion.span
            className="mb-6 inline-block rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-primary"
            initial={{ scale: 0.9 }}
            animate={isInView ? { scale: 1 } : {}}
          >
            {t("projects.badge")}
          </motion.span>
          <h2 className="mb-6 text-3xl font-bold md:text-5xl">
            {t("projects.title").split(" ")[0]}{" "}
            <span className="gradient-text">{t("projects.title").split(" ").slice(1).join(" ")}</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{t("projects.subtitle")}</p>
        </motion.div>

        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {projects.map((project, index) => (
              <button
                key={`${project.title}-${index}`}
                onClick={() => setActiveProject(Math.min(index, maxIndex))}
                className={`h-2.5 rounded-full transition-all ${
                  index >= activeProject && index < activeProject + slidesPerView
                    ? "w-8 bg-primary"
                    : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Ver proyecto ${project.title}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={prevProject}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/80 text-foreground transition-colors hover:border-primary/50 hover:text-primary"
              aria-label="Proyecto anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextProject}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/80 text-foreground transition-colors hover:border-primary/50 hover:text-primary"
              aria-label="Proyecto siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <motion.div
            className="flex"
            animate={{ x: `-${activeProject * (100 / slidesPerView)}%` }}
            transition={{ type: "spring", stiffness: 180, damping: 24 }}
          >
            {projects.map((project, index) => {
              const description = project.description[language] ?? project.description.en ?? ""
              const tags = project.tags[language] ?? project.tags.en ?? []

              return (
                <div
                  key={`${project.title}-${index}`}
                  className="shrink-0 px-3"
                  style={{ width: `${100 / slidesPerView}%` }}
                >
                  <motion.a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    className="group block h-full"
                  >
                    <div className="flex h-full min-h-[34rem] flex-col overflow-hidden rounded-3xl border border-border/50 bg-card/80 shadow-lg backdrop-blur-sm transition-all duration-500 group-hover:-translate-y-2 group-hover:border-primary/50 group-hover:shadow-2xl group-hover:shadow-primary/10">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <Image
                          src={project.image}
                          alt={project.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t ${project.gradient} opacity-20 transition-opacity duration-500 group-hover:opacity-35`} />
                        <div className="absolute right-4 top-4 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                          {t("projects.live")}
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-6">
                        <h3 className="mb-3 line-clamp-2 text-2xl font-bold transition-colors group-hover:text-primary">
                          {project.title}
                        </h3>
                        <p className="mb-5 line-clamp-4 min-h-[7rem] text-base leading-relaxed text-muted-foreground">
                          {description}
                        </p>
                        <div className="mb-6 flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary transition-colors group-hover:bg-primary/20"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-auto inline-flex items-center gap-2 font-semibold text-primary">
                          {t("projects.view")}
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </motion.a>
                </div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
