"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/db-client"
import { useLanguage } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  GripVertical,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Star,
} from "lucide-react"

interface Project {
  id: string
  title: string
  description_es: string | null
  description_en: string | null
  description_pt: string | null
  image_url: string | null
  project_url: string | null
  tags: string[] | null
  gradient: string | null
  is_featured: boolean
  is_published: boolean
  display_order: number
  created_at: string
}

const defaultProject: Omit<Project, "id" | "created_at"> = {
  title: "",
  description_es: "",
  description_en: "",
  description_pt: "",
  image_url: "",
  project_url: "",
  tags: [],
  gradient: "from-blue-500 to-purple-500",
  is_featured: false,
  is_published: true,
  display_order: 0,
}

const gradientOptions = [
  { value: "from-blue-500 to-purple-500", label: "Azul a Púrpura" },
  { value: "from-green-500 to-emerald-500", label: "Verde a Esmeralda" },
  { value: "from-red-500 to-orange-500", label: "Rojo a Naranja" },
  { value: "from-lime-400 to-green-500", label: "Lima a Verde" },
  { value: "from-pink-500 to-rose-500", label: "Rosa a Rose" },
  { value: "from-cyan-500 to-blue-500", label: "Cyan a Azul" },
  { value: "from-yellow-500 to-orange-500", label: "Amarillo a Naranja" },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null)
  const [tagsInput, setTagsInput] = useState("")
  const db = createClient()
  const { t } = useLanguage()

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    setLoading(true)
    try {
      await fetch("/api/admin/site/bootstrap", {
        method: "POST",
        credentials: "include",
      })

      const { data, error } = await db
        .from("projects")
        .select("*")
        .order("display_order", { ascending: true })

      if (error) {
        console.error("Error fetching projects:", error)
        toast.error(t("admin.projects.loadError"))
        setLoading(false)
      } else if (data) {
        console.log("Projects loaded:", data.length)
        setProjects(data)
        setLoading(false)
        
      } else {
        setProjects([])
        setLoading(false)
      }
    } catch (err) {
      console.error("Exception fetching projects:", err)
      toast.error(t("admin.projects.loadError"))
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingProject({ ...defaultProject })
    setTagsInput("")
    setIsDialogOpen(true)
  }

  function openEditDialog(project: Project) {
    setEditingProject(project)
    setTagsInput(project.tags?.join(", ") || "")
    setIsDialogOpen(true)
  }

  async function saveProject() {
    if (!editingProject?.title) {
      toast.error(t("admin.projects.titleRequired"))
      return
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t)

    const projectData = {
      ...editingProject,
      tags,
      updated_at: new Date().toISOString(),
    }

    if (editingProject.id) {
      // Update
      const { error } = await db
        .from("projects")
        .update(projectData)
        .eq("id", editingProject.id)

      if (error) {
        toast.error(t("admin.projects.updateError"))
      } else {
        toast.success(t("admin.projects.updated"))
        setIsDialogOpen(false)
        fetchProjects()
      }
    } else {
      // Create
      const { error } = await db.from("projects").insert([projectData])

      if (error) {
        toast.error(t("admin.projects.createError"))
      } else {
        toast.success(t("admin.projects.created"))
        setIsDialogOpen(false)
        fetchProjects()
      }
    }
  }

  async function deleteProject(id: string) {
    const { error } = await db.from("projects").delete().eq("id", id)

    if (error) {
      toast.error(t("admin.projects.deleteError"))
    } else {
      toast.success(t("admin.projects.deleted"))
      setIsDeleteDialogOpen(false)
      setEditingProject(null)
      fetchProjects()
    }
  }

  async function togglePublished(id: string, is_published: boolean) {
    const { error } = await db
      .from("projects")
      .update({ is_published, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      toast.error(t("admin.projects.statusError"))
    } else {
      toast.success(is_published ? t("admin.projects.publishedStatus") : t("admin.projects.hiddenStatus"))
      fetchProjects()
    }
  }

  async function toggleFeatured(id: string, is_featured: boolean) {
    const { error } = await db
      .from("projects")
      .update({ is_featured, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      toast.error(t("admin.projects.statusError"))
    } else {
      toast.success(is_featured ? t("admin.projects.featuredStatus") : t("admin.projects.notFeaturedStatus"))
      fetchProjects()
    }
  }

  async function initializeDefaultProjects(isAutomatic = false) {
    if (!isAutomatic) {
      setInitializing(true)
    }
    
    const defaultProjects = [
      {
        title: "Hack Evans",
        description_es: "Plataforma educativa #1 para docentes en Ecuador. Simuladores actualizados, evaluaciones personalizadas y seguimiento en tiempo real del progreso.",
        description_en: "Educational platform #1 for teachers in Ecuador. Updated simulators, personalized evaluations and real-time progress tracking.",
        description_pt: "Plataforma educacional #1 para professores no Equador. Simuladores atualizados, avaliações personalizadas e acompanhamento em tempo real.",
        project_url: "https://hack-evans.netlify.app/",
        image_url: "/images/projects/hack-evans.jpg",
        tags: ["Next.js", "Panel", "Educación", "IA"],
        gradient: "from-red-500 to-orange-500",
        is_published: true,
        is_featured: true,
        display_order: 1,
      },
      {
        title: "ManaCacao - ASO PROCANAM",
        description_es: "Sistema web para la Asociación de Producción Agrícola de Cacao Nacional La Maná. Gestión completa de socios, productos y comercialización.",
        description_en: "Web system for the Agricultural Production Association of National Cacao La Maná. Complete management of partners, products and marketing.",
        description_pt: "Sistema web para a Associação de Produção Agrícola de Cacau Nacional La Maná. Gestão completa de sócios, produtos e comercialização.",
        project_url: "https://aso-procanam.vercel.app/",
        image_url: "/images/projects/mana-cacao.png",
        tags: ["Next.js", "Vercel", "Agricultura", "Gestión"],
        gradient: "from-green-500 to-emerald-500",
        is_published: true,
        is_featured: true,
        display_order: 2,
      },
      {
        title: "S.P.A. Talleres",
        description_es: "Plataforma web profesional para taller automotriz. Planchado y pintura al horno en Arequipa con acabado garantizado y resultados duraderos.",
        description_en: "Professional web platform for automotive workshop. Professional bodywork and paint in Arequipa with guaranteed finish and lasting results.",
        description_pt: "Plataforma web profissional para oficina automotiva. Funilaria e pintura profissional em Arequipa com acabamento garantido e resultados duradouros.",
        project_url: "https://spatalleres.netlify.app/",
        image_url: "/images/projects/spa-talleres.png",
        tags: ["React", "Sitio Web", "Automotriz", "UI/UX"],
        gradient: "from-lime-400 to-green-500",
        is_published: true,
        is_featured: true,
        display_order: 3,
      },
    ]

    try {
      const { error, data } = await db
        .from("projects")
        .insert(defaultProjects)
        .select()

      if (error) {
        console.error("Insert error:", error)
        if (!isAutomatic) {
          toast.error(t("admin.projects.createError") + ": " + error.message)
        }
      } else {
        console.log("Projects initialized successfully:", data?.length)
        if (!isAutomatic) {
          toast.success("Proyectos cargados correctamente")
        }
        // Wait a moment for the database to be ready
        await new Promise((resolve) => setTimeout(resolve, 500))
        await fetchProjects()
      }
    } catch (error) {
      console.error("Exception:", error)
      if (!isAutomatic) {
        toast.error(t("admin.projects.createError"))
      }
    } finally {
      if (!isAutomatic) {
        setInitializing(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("admin.projects.title")}</h2>
          <p className="text-muted-foreground">
            {t("admin.projects.subtitle")}
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t("admin.projects.new")}
        </Button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 && !loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">{t("admin.projects.noProjects")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("admin.projects.addFirst")}
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              {t("admin.projects.create")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden group">
              {/* Image */}
              <div className={`relative h-48 bg-gradient-to-br ${project.gradient || "from-blue-500 to-purple-500"}`}>
                {project.image_url ? (
                  <img
                    src={project.image_url}
                    alt={project.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-white/50" />
                  </div>
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEditDialog(project)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {project.project_url && (
                    <Button size="sm" variant="secondary" asChild>
                      <a href={project.project_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setEditingProject(project)
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {/* Badges */}
                <div className="absolute top-2 right-2 flex gap-1">
                  {project.is_featured && (
                    <Badge className="bg-yellow-500">
                      <Star className="h-3 w-3 mr-1" />
                      {t("admin.projects.featured")}
                    </Badge>
                  )}
                  {!project.is_published && (
                    <Badge variant="secondary">
                      <EyeOff className="h-3 w-3 mr-1" />
                      {t("admin.status.hidden")}
                    </Badge>
                  )}
                </div>
              </div>

              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{project.title}</span>
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description_es || t("admin.projects.noDescription")}
                </p>

                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={project.is_published}
                      onCheckedChange={(checked) => togglePublished(project.id, checked)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {project.is_published ? t("admin.status.visible") : t("admin.status.hidden")}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFeatured(project.id, !project.is_featured)}
                  >
                    <Star className={`h-4 w-4 ${project.is_featured ? "fill-yellow-500 text-yellow-500" : ""}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject?.id ? t("admin.projects.edit") : t("admin.projects.new")}
            </DialogTitle>
            <DialogDescription>
              {editingProject?.id
                ? t("admin.projects.editDescription")
                : t("admin.projects.newDescription")}
            </DialogDescription>
          </DialogHeader>

          {editingProject && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="title">{t("admin.projects.title.label")} *</Label>
                  <Input
                    id="title"
                    value={editingProject.title}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, title: e.target.value })
                    }
                    placeholder={t("admin.projects.title.label")}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description_es">{t("admin.projects.descriptionES")}</Label>
                  <Textarea
                    id="description_es"
                    value={editingProject.description_es || ""}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, description_es: e.target.value })
                    }
                    placeholder={t("admin.projects.descriptionES")}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description_en">{t("admin.projects.descriptionEN")}</Label>
                  <Textarea
                    id="description_en"
                    value={editingProject.description_en || ""}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, description_en: e.target.value })
                    }
                    placeholder={t("admin.projects.descriptionEN")}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description_pt">{t("admin.projects.descriptionPT")}</Label>
                  <Textarea
                    id="description_pt"
                    value={editingProject.description_pt || ""}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, description_pt: e.target.value })
                    }
                    placeholder={t("admin.projects.descriptionPT")}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">{t("admin.projects.imageURL")}</Label>
                  <Input
                    id="image_url"
                    value={editingProject.image_url || ""}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, image_url: e.target.value })
                    }
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_url">{t("admin.projects.projectURL")}</Label>
                  <Input
                    id="project_url"
                    value={editingProject.project_url || ""}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, project_url: e.target.value })
                    }
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="tags">{t("admin.projects.tags")}</Label>
                  <Input
                    id="tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="React, Next.js, TypeScript"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gradient">{t("admin.projects.backgroundColor")}</Label>
                  <select
                    id="gradient"
                    value={editingProject.gradient || ""}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, gradient: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-md border bg-background"
                  >
                    {gradientOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_order">{t("admin.projects.displayOrder")}</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={editingProject.display_order || 0}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        display_order: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="flex items-center gap-4 sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_published"
                      checked={editingProject.is_published}
                      onCheckedChange={(checked) =>
                        setEditingProject({ ...editingProject, is_published: checked })
                      }
                    />
                    <Label htmlFor="is_published">{t("admin.status.published")}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_featured"
                      checked={editingProject.is_featured}
                      onCheckedChange={(checked) =>
                        setEditingProject({ ...editingProject, is_featured: checked })
                      }
                    />
                    <Label htmlFor="is_featured">{t("admin.projects.featured")}</Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t("admin.projects.cancel")}
            </Button>
            <Button onClick={saveProject}>
              {editingProject?.id ? t("admin.projects.save") : t("admin.projects.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.projects.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("admin.projects.deleteDescription", { title: editingProject?.title || "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t("admin.projects.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => editingProject?.id && deleteProject(editingProject.id)}
            >
              {t("admin.projects.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
