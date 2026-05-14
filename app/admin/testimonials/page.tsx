"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/db-client"
import { useLanguage } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Star, GripVertical, Quote } from "lucide-react"

interface Testimonial {
  id: string
  client_name: string
  client_company: string | null
  client_position: string | null
  client_avatar: string | null
  content_es: string
  content_en: string | null
  content_pt: string | null
  rating: number
  is_published: boolean
  display_order: number
  created_at: string
}

export default function TestimonialsPage() {
  const { t } = useLanguage()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const [saving, setSaving] = useState(false)
  const db = createClient()

  const [formData, setFormData] = useState({
    client_name: "",
    client_company: "",
    client_position: "",
    client_avatar: "",
    content_es: "",
    content_en: "",
    content_pt: "",
    rating: 5,
    is_published: true,
    display_order: 0,
  })

  useEffect(() => {
    fetchTestimonials()
  }, [])

  async function fetchTestimonials() {
    try {
      const { data, error } = await db
        .from("testimonials")
        .select("*")
        .order("display_order", { ascending: true })

      if (error) throw error
      setTestimonials(data || [])
    } catch (error) {
      console.error("Error fetching testimonials:", error)
      toast.error(t("admin.errors.loadingTestimonials"))
    } finally {
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingTestimonial(null)
    setFormData({
      client_name: "",
      client_company: "",
      client_position: "",
      client_avatar: "",
      content_es: "",
      content_en: "",
      content_pt: "",
      rating: 5,
      is_published: true,
      display_order: testimonials.length,
    })
    setIsDialogOpen(true)
  }

  function openEditDialog(testimonial: Testimonial) {
    setEditingTestimonial(testimonial)
    setFormData({
      client_name: testimonial.client_name,
      client_company: testimonial.client_company || "",
      client_position: testimonial.client_position || "",
      client_avatar: testimonial.client_avatar || "",
      content_es: testimonial.content_es,
      content_en: testimonial.content_en || "",
      content_pt: testimonial.content_pt || "",
      rating: testimonial.rating,
      is_published: testimonial.is_published,
      display_order: testimonial.display_order,
    })
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        client_name: formData.client_name,
        client_company: formData.client_company || null,
        client_position: formData.client_position || null,
        client_avatar: formData.client_avatar || null,
        content_es: formData.content_es,
        content_en: formData.content_en || null,
        content_pt: formData.content_pt || null,
        rating: formData.rating,
        is_published: formData.is_published,
        display_order: formData.display_order,
      }

      if (editingTestimonial) {
        const { error } = await db
          .from("testimonials")
          .update(payload)
          .eq("id", editingTestimonial.id)

        if (error) throw error
        toast.success(t("admin.success.testimonialUpdated"))
      } else {
        const { error } = await db.from("testimonials").insert(payload)

        if (error) throw error
        toast.success(t("admin.success.testimonialCreated"))
      }

      setIsDialogOpen(false)
      fetchTestimonials()
    } catch (error) {
      console.error("Error saving testimonial:", error)
      toast.error(t("admin.errors.savingTestimonial"))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await db.from("testimonials").delete().eq("id", id)

      if (error) throw error
      toast.success(t("admin.success.testimonialDeleted"))
      fetchTestimonials()
    } catch (error) {
      console.error("Error deleting testimonial:", error)
      toast.error(t("admin.errors.deletingTestimonial"))
    }
  }

  async function togglePublished(testimonial: Testimonial) {
    try {
      const { error } = await db
        .from("testimonials")
        .update({ is_published: !testimonial.is_published })
        .eq("id", testimonial.id)

      if (error) throw error
      toast.success(testimonial.is_published ? t("admin.success.testimonialHidden") : t("admin.success.testimonialPublished"))
      fetchTestimonials()
    } catch (error) {
      console.error("Error toggling testimonial:", error)
      toast.error(t("admin.errors.updatingTestimonial"))
    }
  }

  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
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
          <h2 className="text-2xl font-bold tracking-tight">{t("admin.testimonials.title")}</h2>
          <p className="text-muted-foreground">
            {t("admin.testimonials.subtitle")}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              {t("admin.testimonials.new")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTestimonial ? t("admin.testimonials.edit") : t("admin.testimonials.new")}
              </DialogTitle>
              <DialogDescription>
                {editingTestimonial
                  ? t("admin.testimonials.edit.description")
                  : t("admin.testimonials.new.description")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client_name">{t("admin.testimonials.clientName")} *</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_company">{t("admin.testimonials.company")}</Label>
                  <Input
                    id="client_company"
                    value={formData.client_company}
                    onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
                    placeholder="Empresa S.A."
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client_position">{t("admin.testimonials.position")}</Label>
                  <Input
                    id="client_position"
                    value={formData.client_position}
                    onChange={(e) => setFormData({ ...formData, client_position: e.target.value })}
                    placeholder="CEO"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">{t("admin.testimonials.rating")}</Label>
                  <Select
                    value={formData.rating.toString()}
                    onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <SelectItem key={rating} value={rating.toString()}>
                          {rating} {t("admin.testimonials.stars")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_avatar">{t("admin.testimonials.avatar")}</Label>
                <Input
                  id="client_avatar"
                  type="url"
                  value={formData.client_avatar}
                  onChange={(e) => setFormData({ ...formData, client_avatar: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content_es">{t("admin.testimonials.contentES")} *</Label>
                <Textarea
                  id="content_es"
                  value={formData.content_es}
                  onChange={(e) => setFormData({ ...formData, content_es: e.target.value })}
                  placeholder="El testimonio del cliente..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content_en">{t("admin.testimonials.contentEN")}</Label>
                <Textarea
                  id="content_en"
                  value={formData.content_en}
                  onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                  placeholder="Client testimonial..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content_pt">{t("admin.testimonials.contentPT")}</Label>
                <Textarea
                  id="content_pt"
                  value={formData.content_pt}
                  onChange={(e) => setFormData({ ...formData, content_pt: e.target.value })}
                  placeholder="Depoimento do cliente..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="is_published">{t("admin.testimonials.published")}</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t("admin.common.cancel")}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? t("admin.common.saving") : editingTestimonial ? t("admin.common.update") : t("admin.common.create")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Testimonials Grid */}
      {testimonials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Quote className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">{t("admin.testimonials.noTestimonials")}</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              {t("admin.testimonials.noTestimonials.description")}
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              {t("admin.testimonials.addTestimonial")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className={!testimonial.is_published ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {testimonial.client_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-base">{testimonial.client_name}</CardTitle>
                      {(testimonial.client_position || testimonial.client_company) && (
                        <p className="text-sm text-muted-foreground">
                          {[testimonial.client_position, testimonial.client_company]
                            .filter(Boolean)
                            .join(" @ ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  {renderStars(testimonial.rating)}
                  <Badge variant={testimonial.is_published ? "default" : "secondary"}>
                    {testimonial.is_published ? t("admin.testimonials.published") : t("admin.testimonials.hidden")}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-4">
                  &ldquo;{testimonial.content_es}&rdquo;
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePublished(testimonial)}
                  >
                    {testimonial.is_published ? t("admin.testimonials.hide") : t("admin.testimonials.publish")}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(testimonial)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("admin.testimonials.delete")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("admin.testimonials.deleteConfirm")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("admin.common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(testimonial.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t("admin.common.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}



