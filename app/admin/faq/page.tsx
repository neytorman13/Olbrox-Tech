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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, HelpCircle, GripVertical } from "lucide-react"

interface FAQ {
  id: string
  question_es: string
  question_en: string | null
  question_pt: string | null
  answer_es: string
  answer_en: string | null
  answer_pt: string | null
  category: string
  is_published: boolean
  display_order: number
  created_at: string
  updated_at: string
}

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "servicios", label: "Servicios" },
  { value: "precios", label: "Precios" },
  { value: "proceso", label: "Proceso" },
  { value: "soporte", label: "Soporte" },
  { value: "otros", label: "Otros" },
]

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const db = createClient()
  const { t } = useLanguage()

  const [formData, setFormData] = useState({
    question_es: "",
    question_en: "",
    question_pt: "",
    answer_es: "",
    answer_en: "",
    answer_pt: "",
    category: "general",
    is_published: true,
    display_order: 0,
  })

  useEffect(() => {
    fetchFaqs()
  }, [])

  async function fetchFaqs() {
    try {
      const { data, error } = await db
        .from("faq")
        .select("*")
        .order("display_order", { ascending: true })

      if (error) throw error
      setFaqs(data || [])
    } catch (error) {
      console.error("Error fetching FAQs:", error)
      toast.error(t("admin.faq.loadError"))
    } finally {
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingFaq(null)
    setFormData({
      question_es: "",
      question_en: "",
      question_pt: "",
      answer_es: "",
      answer_en: "",
      answer_pt: "",
      category: "general",
      is_published: true,
      display_order: faqs.length,
    })
    setIsDialogOpen(true)
  }

  function openEditDialog(faq: FAQ) {
    setEditingFaq(faq)
    setFormData({
      question_es: faq.question_es,
      question_en: faq.question_en || "",
      question_pt: faq.question_pt || "",
      answer_es: faq.answer_es,
      answer_en: faq.answer_en || "",
      answer_pt: faq.answer_pt || "",
      category: faq.category,
      is_published: faq.is_published,
      display_order: faq.display_order,
    })
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        question_es: formData.question_es,
        question_en: formData.question_en || null,
        question_pt: formData.question_pt || null,
        answer_es: formData.answer_es,
        answer_en: formData.answer_en || null,
        answer_pt: formData.answer_pt || null,
        category: formData.category,
        is_published: formData.is_published,
        display_order: formData.display_order,
        updated_at: new Date().toISOString(),
      }

      if (editingFaq) {
        const { error } = await db.from("faq").update(payload).eq("id", editingFaq.id)

        if (error) throw error
        toast.success("Pregunta actualizada")
      } else {
        const { error } = await db.from("faq").insert(payload)

        if (error) throw error
        toast.success("Pregunta creada")
      }

      setIsDialogOpen(false)
      fetchFaqs()
    } catch (error) {
      console.error("Error saving FAQ:", error)
      toast.error("Error al guardar pregunta")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await db.from("faq").delete().eq("id", id)

      if (error) throw error
      toast.success("Pregunta eliminada")
      fetchFaqs()
    } catch (error) {
      console.error("Error deleting FAQ:", error)
      toast.error("Error al eliminar pregunta")
    }
  }

  async function togglePublished(faq: FAQ) {
    try {
      const { error } = await db
        .from("faq")
        .update({ is_published: !faq.is_published, updated_at: new Date().toISOString() })
        .eq("id", faq.id)

      if (error) throw error
      toast.success(faq.is_published ? "Pregunta ocultada" : "Pregunta publicada")
      fetchFaqs()
    } catch (error) {
      console.error("Error toggling FAQ:", error)
      toast.error("Error al actualizar pregunta")
    }
  }

  const filteredFaqs = filterCategory === "all" 
    ? faqs 
    : faqs.filter(f => f.category === filterCategory)

  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    const cat = faq.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(faq)
    return acc
  }, {} as Record<string, FAQ[]>)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("admin.faq.title")}</h2>
          <p className="text-muted-foreground">
            {t("admin.faq.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("admin.faq.filter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.status.all")}</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                {t("admin.faq.new")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingFaq ? t("admin.edit") : t("admin.faq.new")}
                </DialogTitle>
                <DialogDescription>
                  {editingFaq
                    ? t("admin.edit.description")
                    : t("admin.faq.new.description")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">{t("admin.faq.category")}</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_order">{t("admin.faq.displayOrder")}</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) =>
                        setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question_es">{t("admin.faq.questionES")} *</Label>
                  <Input
                    id="question_es"
                    value={formData.question_es}
                    onChange={(e) => setFormData({ ...formData, question_es: e.target.value })}
                    placeholder="¿Cuánto tiempo toma...?"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="answer_es">{t("admin.faq.answerES")} *</Label>
                  <Textarea
                    id="answer_es"
                    value={formData.answer_es}
                    onChange={(e) => setFormData({ ...formData, answer_es: e.target.value })}
                    placeholder={t("admin.faq.answerES")}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question_en">{t("admin.faq.questionEN")}</Label>
                  <Input
                    id="question_en"
                    value={formData.question_en}
                    onChange={(e) => setFormData({ ...formData, question_en: e.target.value })}
                    placeholder="How long does it take...?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="answer_en">{t("admin.faq.answerEN")}</Label>
                  <Textarea
                    id="answer_en"
                    value={formData.answer_en}
                    onChange={(e) => setFormData({ ...formData, answer_en: e.target.value })}
                    placeholder="The answer to the question..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question_pt">{t("admin.faq.questionPT")}</Label>
                  <Input
                    id="question_pt"
                    value={formData.question_pt}
                    onChange={(e) => setFormData({ ...formData, question_pt: e.target.value })}
                    placeholder="Quanto tempo leva...?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="answer_pt">{t("admin.faq.answerPT")}</Label>
                  <Textarea
                    id="answer_pt"
                    value={formData.answer_pt}
                    onChange={(e) => setFormData({ ...formData, answer_pt: e.target.value })}
                    placeholder="A resposta à pergunta..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_published: checked })
                    }
                  />
                  <Label htmlFor="is_published">{t("admin.faq.published")}</Label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t("admin.faq.cancel")}
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? t("admin.common.saving") : editingFaq ? t("admin.common.update") : t("admin.common.create")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* FAQ List */}
      {faqs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">{t("admin.faq.noFAQs")}</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              {t("admin.faq.noFAQs.description")}
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              {t("admin.faq.addQuestion")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg capitalize">
                  {CATEGORIES.find((c) => c.value === category)?.label || category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {categoryFaqs.map((faq) => (
                    <AccordionItem
                      key={faq.id}
                      value={faq.id}
                      className={!faq.is_published ? "opacity-60" : ""}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <AccordionTrigger className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span>{faq.question_es}</span>
                            {!faq.is_published && (
                              <Badge variant="secondary" className="ml-2">
                                {t("admin.faq.hidden")}
                              </Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <div className="flex items-center gap-1 mr-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditDialog(faq)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("admin.faq.delete")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("admin.faq.deleteConfirm")}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("admin.common.cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(faq.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t("admin.common.delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          <p className="text-muted-foreground">{faq.answer_es}</p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => togglePublished(faq)}
                            >
                              {faq.is_published ? t("admin.faq.hide") : t("admin.faq.publish")}
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}


