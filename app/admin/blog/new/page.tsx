"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/db-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { ArrowLeft, Save, Eye, Send } from "lucide-react"
import Link from "next/link"

export default function NewBlogPostPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const db = createClient()

  const [formData, setFormData] = useState({
    title_es: "",
    title_en: "",
    slug: "",
    excerpt_es: "",
    excerpt_en: "",
    content_es: "",
    content_en: "",
    featured_image: "",
    category: "",
    tags: "",
    meta_title: "",
    meta_description: "",
    is_featured: false,
    is_published: false,
  })

  // Generate slug from title
  useEffect(() => {
    if (formData.title_es && !formData.slug) {
      const slug = formData.title_es
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
      setFormData((prev) => ({ ...prev, slug }))
    }
  }, [formData.title_es])

  async function savePost(publish: boolean) {
    if (!formData.title_es || !formData.content_es) {
      toast.error("El título y contenido son requeridos")
      return
    }

    if (!formData.slug) {
      toast.error("El slug es requerido")
      return
    }

    setSaving(true)

    try {
      const authResponse = await fetch('/api/auth/me', { credentials: 'include' })
      const authData = await authResponse.json()
      const authUser = authData?.data?.user ?? null
      if (!authResponse.ok || !authUser?.id) throw new Error('Failed to get user')

      const tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t)

      const postData = {
        title_es: formData.title_es,
        title_en: formData.title_en || null,
        slug: formData.slug,
        excerpt_es: formData.excerpt_es || null,
        excerpt_en: formData.excerpt_en || null,
        content_es: formData.content_es,
        content_en: formData.content_en || null,
        featured_image: formData.featured_image || null,
        category: formData.category || null,
        tags: tags.length > 0 ? tags : null,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        is_featured: formData.is_featured,
        is_published: publish,
        published_at: publish ? new Date().toISOString() : null,
        author_id: authUser.id,
      }

      const { error } = await db.from("blog_posts").insert([postData])

      if (error) throw error

      toast.success(publish ? "Artículo publicado" : "Borrador guardado")
      router.push("/admin/blog")
    } catch (error) {
      toast.error("Error al guardar el artículo")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/blog">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Nuevo Artículo</h2>
          <p className="text-muted-foreground">Crea un nuevo artículo para tu blog</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => savePost(false)} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            Guardar Borrador
          </Button>
          <Button onClick={() => savePost(true)} disabled={saving}>
            <Send className="mr-2 h-4 w-4" />
            Publicar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Content */}
          <Card>
            <CardHeader>
              <CardTitle>Contenido Principal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title_es">Título (Español) *</Label>
                <Input
                  id="title_es"
                  value={formData.title_es}
                  onChange={(e) => setFormData({ ...formData, title_es: e.target.value })}
                  placeholder="Título del artículo"
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL (Slug) *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">/blog/</span>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="mi-articulo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt_es">Extracto (Español)</Label>
                <Textarea
                  id="excerpt_es"
                  value={formData.excerpt_es}
                  onChange={(e) => setFormData({ ...formData, excerpt_es: e.target.value })}
                  placeholder="Breve resumen del artículo..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content_es">Contenido (Español) *</Label>
                <Textarea
                  id="content_es"
                  value={formData.content_es}
                  onChange={(e) => setFormData({ ...formData, content_es: e.target.value })}
                  placeholder="Escribe el contenido del artículo... Soporta Markdown."
                  rows={15}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Soporta formato Markdown: **negrita**, *cursiva*, [enlaces](url), etc.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* English Version */}
          <Card>
            <CardHeader>
              <CardTitle>Versión en Inglés (Opcional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title_en">Title (English)</Label>
                <Input
                  id="title_en"
                  value={formData.title_en}
                  onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                  placeholder="Article title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt_en">Excerpt</Label>
                <Textarea
                  id="excerpt_en"
                  value={formData.excerpt_en}
                  onChange={(e) => setFormData({ ...formData, excerpt_en: e.target.value })}
                  placeholder="Brief article summary..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content_en">Content</Label>
                <Textarea
                  id="content_en"
                  value={formData.content_en}
                  onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                  placeholder="Write the article content in English..."
                  rows={10}
                  className="font-mono"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle>Imagen Destacada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="featured_image">URL de la imagen</Label>
                <Input
                  id="featured_image"
                  value={formData.featured_image}
                  onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
              {formData.featured_image && (
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={formData.featured_image}
                    alt="Preview"
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = ""
                      e.currentTarget.classList.add("hidden")
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category & Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Organización</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Desarrollo Web"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (separados por coma)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="react, nextjs, tutorial"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="is_featured">Artículo destacado</Label>
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Título</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  placeholder="Título para SEO (opcional)"
                />
                <p className="text-xs text-muted-foreground">
                  Si se deja vacío, se usará el título del artículo
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Descripción</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="Descripción para motores de búsqueda..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Recomendado: 150-160 caracteres
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

