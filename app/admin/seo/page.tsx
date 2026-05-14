"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/db-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Search,
  Globe,
  FileText,
  Image as ImageIcon,
  Save,
  Pencil,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"

interface PageSEO {
  id: string
  page_identifier: string
  page_name: string
  meta_title_es: string | null
  meta_title_en: string | null
  meta_title_pt: string | null
  meta_description_es: string | null
  meta_description_en: string | null
  meta_description_pt: string | null
  og_image: string | null
  keywords: string[] | null
  canonical_url: string | null
  no_index: boolean
  updated_at: string
}

export default function SEOPage() {
  const [pages, setPages] = useState<PageSEO[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPage, setSelectedPage] = useState<PageSEO | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    meta_title_es: "",
    meta_title_en: "",
    meta_title_pt: "",
    meta_description_es: "",
    meta_description_en: "",
    meta_description_pt: "",
    og_image: "",
    keywords: "",
    canonical_url: "",
    no_index: false,
  })
  const db = createClient()

  useEffect(() => {
    fetchPages()
  }, [])

  async function fetchPages() {
    try {
      const { data, error } = await db
        .from("page_seo")
        .select("*")
        .order("page_name", { ascending: true })

      if (error) throw error
      setPages(data || [])
    } catch (error) {
      console.error("Error fetching SEO pages:", error)
      toast.error("Error al cargar configuración SEO")
    } finally {
      setLoading(false)
    }
  }

  function openEditDialog(page: PageSEO) {
    setSelectedPage(page)
    setFormData({
      meta_title_es: page.meta_title_es || "",
      meta_title_en: page.meta_title_en || "",
      meta_title_pt: page.meta_title_pt || "",
      meta_description_es: page.meta_description_es || "",
      meta_description_en: page.meta_description_en || "",
      meta_description_pt: page.meta_description_pt || "",
      og_image: page.og_image || "",
      keywords: page.keywords?.join(", ") || "",
      canonical_url: page.canonical_url || "",
      no_index: page.no_index,
    })
    setIsEditing(true)
  }

  async function handleSave() {
    if (!selectedPage) return
    setSaving(true)

    try {
      const { error } = await db
        .from("page_seo")
        .update({
          meta_title_es: formData.meta_title_es || null,
          meta_title_en: formData.meta_title_en || null,
          meta_title_pt: formData.meta_title_pt || null,
          meta_description_es: formData.meta_description_es || null,
          meta_description_en: formData.meta_description_en || null,
          meta_description_pt: formData.meta_description_pt || null,
          og_image: formData.og_image || null,
          keywords: formData.keywords
            ? formData.keywords.split(",").map((k) => k.trim())
            : null,
          canonical_url: formData.canonical_url || null,
          no_index: formData.no_index,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedPage.id)

      if (error) throw error
      toast.success("Configuración SEO actualizada")
      setIsEditing(false)
      fetchPages()
    } catch (error) {
      console.error("Error saving SEO:", error)
      toast.error("Error al guardar configuración SEO")
    } finally {
      setSaving(false)
    }
  }

  function getSEOScore(page: PageSEO): { score: number; issues: string[] } {
    const issues: string[] = []
    let score = 100

    if (!page.meta_title_es) {
      issues.push("Falta título meta (español)")
      score -= 20
    } else if (page.meta_title_es.length < 30) {
      issues.push("Título meta muy corto")
      score -= 10
    } else if (page.meta_title_es.length > 60) {
      issues.push("Título meta muy largo")
      score -= 10
    }

    if (!page.meta_description_es) {
      issues.push("Falta descripción meta")
      score -= 20
    } else if (page.meta_description_es.length < 120) {
      issues.push("Descripción meta muy corta")
      score -= 10
    } else if (page.meta_description_es.length > 160) {
      issues.push("Descripción meta muy larga")
      score -= 5
    }

    if (!page.og_image) {
      issues.push("Falta imagen OG")
      score -= 15
    }

    if (!page.keywords || page.keywords.length === 0) {
      issues.push("Sin palabras clave")
      score -= 10
    }

    return { score: Math.max(0, score), issues }
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  function getScoreBadge(score: number) {
    if (score >= 80) return <Badge className="bg-green-500">Bueno</Badge>
    if (score >= 60) return <Badge className="bg-yellow-500">Regular</Badge>
    return <Badge className="bg-red-500">Mejorable</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuración SEO</h2>
          <p className="text-muted-foreground">
            Optimiza los meta tags y configuración SEO de cada página
          </p>
        </div>
      </div>

      {/* SEO Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Páginas Configuradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pages.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Puntuación Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pages.length > 0
                ? Math.round(pages.reduce((sum, p) => sum + getSEOScore(p).score, 0) / pages.length)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Páginas sin Indexar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pages.filter((p) => p.no_index).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pages List */}
      {pages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Sin páginas configuradas</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Las páginas SEO se crearán automáticamente
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pages.map((page) => {
            const { score, issues } = getSEOScore(page)
            return (
              <Card
                key={page.id}
                className="cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                onClick={() => openEditDialog(page)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-lg bg-muted font-bold ${getScoreColor(score)}`}
                      >
                        {score}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{page.page_name}</h3>
                          {getScoreBadge(score)}
                          {page.no_index && (
                            <Badge variant="secondary" className="ml-2">
                              No Index
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {page.meta_title_es || "Sin título meta"}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {page.meta_description_es || "Sin descripción meta"}
                        </p>
                        {issues.length > 0 && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {issues.slice(0, 3).map((issue, i) => (
                              <span
                                key={i}
                                className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1"
                              >
                                <AlertTriangle className="h-3 w-3" />
                                {issue}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              SEO: {selectedPage?.page_name}
            </DialogTitle>
            <DialogDescription>
              Configura los meta tags y propiedades SEO de esta página
            </DialogDescription>
          </DialogHeader>
          {selectedPage && (
            <div className="space-y-6">
              <Tabs defaultValue="es" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="es" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Español
                  </TabsTrigger>
                  <TabsTrigger value="en" className="gap-2">
                    <Globe className="h-4 w-4" />
                    English
                  </TabsTrigger>
                  <TabsTrigger value="pt" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Português
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="es" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="meta_title_es">Título Meta</Label>
                      <span
                        className={`text-xs ${
                          formData.meta_title_es.length > 60
                            ? "text-red-500"
                            : formData.meta_title_es.length >= 30
                              ? "text-green-500"
                              : "text-yellow-500"
                        }`}
                      >
                        {formData.meta_title_es.length}/60
                      </span>
                    </div>
                    <Input
                      id="meta_title_es"
                      value={formData.meta_title_es}
                      onChange={(e) =>
                        setFormData({ ...formData, meta_title_es: e.target.value })
                      }
                      placeholder="Título de la página para motores de búsqueda"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="meta_description_es">Descripción Meta</Label>
                      <span
                        className={`text-xs ${
                          formData.meta_description_es.length > 160
                            ? "text-red-500"
                            : formData.meta_description_es.length >= 120
                              ? "text-green-500"
                              : "text-yellow-500"
                        }`}
                      >
                        {formData.meta_description_es.length}/160
                      </span>
                    </div>
                    <Textarea
                      id="meta_description_es"
                      value={formData.meta_description_es}
                      onChange={(e) =>
                        setFormData({ ...formData, meta_description_es: e.target.value })
                      }
                      placeholder="Descripción breve de la página"
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="en" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="meta_title_en">Meta Title</Label>
                      <span className="text-xs text-muted-foreground">
                        {formData.meta_title_en.length}/60
                      </span>
                    </div>
                    <Input
                      id="meta_title_en"
                      value={formData.meta_title_en}
                      onChange={(e) =>
                        setFormData({ ...formData, meta_title_en: e.target.value })
                      }
                      placeholder="Page title for search engines"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="meta_description_en">Meta Description</Label>
                      <span className="text-xs text-muted-foreground">
                        {formData.meta_description_en.length}/160
                      </span>
                    </div>
                    <Textarea
                      id="meta_description_en"
                      value={formData.meta_description_en}
                      onChange={(e) =>
                        setFormData({ ...formData, meta_description_en: e.target.value })
                      }
                      placeholder="Brief page description"
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="pt" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="meta_title_pt">Título Meta</Label>
                      <span className="text-xs text-muted-foreground">
                        {formData.meta_title_pt.length}/60
                      </span>
                    </div>
                    <Input
                      id="meta_title_pt"
                      value={formData.meta_title_pt}
                      onChange={(e) =>
                        setFormData({ ...formData, meta_title_pt: e.target.value })
                      }
                      placeholder="Título da página para mecanismos de busca"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="meta_description_pt">Descrição Meta</Label>
                      <span className="text-xs text-muted-foreground">
                        {formData.meta_description_pt.length}/160
                      </span>
                    </div>
                    <Textarea
                      id="meta_description_pt"
                      value={formData.meta_description_pt}
                      onChange={(e) =>
                        setFormData({ ...formData, meta_description_pt: e.target.value })
                      }
                      placeholder="Descrição breve da página"
                      rows={3}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">Configuración General</h4>

                <div className="space-y-2">
                  <Label htmlFor="og_image">Imagen OG (Open Graph)</Label>
                  <Input
                    id="og_image"
                    type="url"
                    value={formData.og_image}
                    onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Imagen que se muestra al compartir en redes sociales
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Palabras Clave</Label>
                  <Input
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="desarrollo web, software, tecnología"
                  />
                  <p className="text-xs text-muted-foreground">Separadas por comas</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="canonical_url">URL Canónica</Label>
                  <Input
                    id="canonical_url"
                    type="url"
                    value={formData.canonical_url}
                    onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
                    placeholder="https://olbroxtech.com/pagina"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="no_index"
                    checked={formData.no_index}
                    onCheckedChange={(checked) => setFormData({ ...formData, no_index: checked })}
                  />
                  <Label htmlFor="no_index">No indexar (noindex)</Label>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-medium">Vista Previa en Google</h4>
                <div className="p-4 border rounded-lg bg-background">
                  <p className="text-blue-600 text-lg hover:underline cursor-pointer truncate">
                    {formData.meta_title_es || "Título de la página"}
                  </p>
                  <p className="text-green-700 text-sm">
                    olbroxtech.com/{selectedPage.page_identifier}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {formData.meta_description_es ||
                      "Descripción de la página que aparecerá en los resultados de búsqueda..."}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}



