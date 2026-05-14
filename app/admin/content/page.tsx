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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supportedLanguages, useLanguage } from "@/lib/i18n"
import { toast } from "sonner"
import {
  Layers,
  Pencil,
  Save,
  LayoutTemplate,
  Type,
  MousePointerClick,
  BarChart2,
  Sparkles,
  Settings2,
  Globe,
} from "lucide-react"

interface ContentBlock {
  id: string
  block_identifier: string
  block_name: string
  block_type: string
  content: Record<string, unknown>
  is_published: boolean
  updated_by: string | null
  updated_at: string
}

const BLOCK_TYPES = [
  { value: "hero", labelKey: "admin.content.hero", icon: LayoutTemplate },
  { value: "text", labelKey: "admin.content.text", icon: Type },
  { value: "cta", labelKey: "admin.content.cta", icon: MousePointerClick },
  { value: "stats", labelKey: "admin.content.stats", icon: BarChart2 },
  { value: "features", labelKey: "admin.content.features", icon: Sparkles },
  { value: "custom", labelKey: "admin.content.custom", icon: Settings2 },
]

const DEFAULT_CONTENT_BLOCKS = [
  {
    block_identifier: "hero",
    block_name: "Hero Section",
    block_type: "hero",
    content: {
      title: "Soluciones tecnológicas innovadoras",
      subtitle: "Impulsamos tu negocio al siguiente nivel",
      cta_text: "Solicitar Cotización",
      cta_link: "#contacto",
      image_url: "/images/hero-bg.jpg",
      tagline: "Tecnología que transforma tu negocio.",
    },
    is_published: true,
  },
  {
    block_identifier: "about",
    block_name: "About Section",
    block_type: "text",
    content: {
      title: "Quiénes Somos",
      description: "Somos un equipo de profesionales apasionados en tecnología, dedicados a transformar ideas en soluciones digitales.",
    },
    is_published: true,
  },
  {
    block_identifier: "cta",
    block_name: "Call to Action",
    block_type: "cta",
    content: {
      title: "¿Listo para transformar tu negocio?",
      description: "Ponte en contacto con nosotros hoy",
      subtitle: "Empecemos tu proyecto juntos.",
      button_text: "Solicitar Demo",
      button_link: "#contacto",
    },
    is_published: true,
  },
]

export default function ContentPage() {
  const { t } = useLanguage()
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBlock, setSelectedBlock] = useState<ContentBlock | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editContent, setEditContent] = useState<Record<string, string>>({})
  const db = createClient()

  useEffect(() => {
    void fetchContentBlocks()
  }, [])

  async function fetchContentBlocks() {
    setLoading(true)

    try {
      await fetch("/api/admin/site/bootstrap", {
        method: "POST",
        credentials: "include",
      })

      const { data, error } = await db
        .from("content_blocks")
        .select("*")
        .order("block_name", { ascending: true })

      if (error) throw error

      setBlocks(data || [])
    } catch (error) {
      console.error("Error fetching content blocks:", error)
      toast.error(t("admin.errors.loadingContentBlocks"))
      setBlocks([])
    } finally {
      setLoading(false)
    }
  }

  async function initializeDefaultBlocks() {
    setLoading(true)

    try {
      const { error } = await db
        .from("content_blocks")
        .insert(DEFAULT_CONTENT_BLOCKS)

      if (error) throw error

      await fetchContentBlocks()
      toast.success("Bloques de contenido inicializados")
    } catch (error) {
      console.error("Error initializing blocks:", error)
      toast.error("Error al inicializar bloques")
    } finally {
      setLoading(false)
    }
  }

  function openEditDialog(block: ContentBlock) {
    setSelectedBlock(block)
    const flatContent: Record<string, string> = {}
    for (const [key, value] of Object.entries(block.content)) {
      if (typeof value === "string") {
        flatContent[key] = value
      } else if (typeof value === "object" && value !== null) {
        flatContent[key] = JSON.stringify(value, null, 2)
      }
    }
    setEditContent(flatContent)
    setIsEditing(true)
  }

  async function handleSave() {
    if (!selectedBlock) return
    setSaving(true)

    try {
      const newContent: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(editContent)) {
        try {
          if (value.trim().startsWith("[") || value.trim().startsWith("{")) {
            newContent[key] = JSON.parse(value)
          } else {
            newContent[key] = value
          }
        } catch {
          newContent[key] = value
        }
      }

      const { error } = await db
        .from("content_blocks")
        .update({
          content: newContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedBlock.id)

      if (error) throw error
      toast.success(t("admin.content.contentUpdated"))
      setIsEditing(false)
      await fetchContentBlocks()
    } catch (error) {
      console.error("Error saving content:", error)
      toast.error(t("admin.content.errorSavingContent"))
    } finally {
      setSaving(false)
    }
  }

  async function togglePublished(block: ContentBlock) {
    try {
      const { error } = await db
        .from("content_blocks")
        .update({
          is_published: !block.is_published,
          updated_at: new Date().toISOString(),
        })
        .eq("id", block.id)

      if (error) throw error
      toast.success(block.is_published ? t("admin.content.blockHidden") : t("admin.content.blockPublished"))
      await fetchContentBlocks()
    } catch (error) {
      console.error("Error toggling block:", error)
      toast.error(t("admin.content.errorUpdatingBlock"))
    }
  }

  function getBlockIcon(type: string) {
    const blockType = BLOCK_TYPES.find((t) => t.value === type)
    if (blockType) {
      const Icon = blockType.icon
      return <Icon className="h-5 w-5" />
    }
    return <Layers className="h-5 w-5" />
  }

  function renderContentPreview(content: Record<string, unknown>) {
    const entries = Object.entries(content).slice(0, 3)
    return (
      <div className="space-y-1">
        {entries.map(([key, value]) => (
          <div key={key} className="grid gap-1 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {key.replace(/_/g, " ")}
            </span>
            <span className="break-words font-medium leading-6 text-foreground">
              {typeof value === "string"
                ? value.substring(0, 90) + (value.length > 90 ? "..." : "")
                : Array.isArray(value)
                  ? `[${value.length} items]`
                  : typeof value === "object"
                    ? "{...}"
                    : String(value)}
            </span>
          </div>
        ))}
        {Object.keys(content).length > 3 && (
          <p className="text-xs text-muted-foreground">
            {t("admin.content.moreFields", { count: Object.keys(content).length - 3 })}
          </p>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
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
          <h2 className="text-2xl font-bold tracking-tight">{t("admin.content.title")}</h2>
          <p className="text-muted-foreground">
            {t("admin.content.subtitle")}
          </p>
        </div>
      </div>

      {/* Content Blocks Grid */}
      {blocks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">{t("admin.content.noBlocks")}</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              {t("admin.content.noBlocksDescription")}
            </p>
            <Button onClick={initializeDefaultBlocks} variant="outline">
              Crear bloques por defecto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blocks.map((block) => (
            <Card
              key={block.id}
              className={`cursor-pointer overflow-hidden hover:ring-2 hover:ring-primary transition-all ${
                !block.is_published ? "opacity-60" : ""
              }`}
              onClick={() => openEditDialog(block)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {getBlockIcon(block.block_type)}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="break-words text-base leading-tight">{block.block_name}</CardTitle>
                      <CardDescription className="text-xs">
                        {t(BLOCK_TYPES.find((t) => t.value === block.block_type)?.labelKey ||
                          block.block_type)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={block.is_published ? "default" : "secondary"}>
                    {block.is_published ? t("admin.content.activeStatus") : t("admin.content.hiddenStatus")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="min-w-0">
                {renderContentPreview(block.content as Record<string, unknown>)}
                <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    {t("admin.content.updatedOn")} {new Date(block.updated_at).toLocaleDateString("es", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <Button variant="ghost" size="sm" className="w-fit">
                    <Pencil className="h-4 w-4 mr-1" />
                    {t("admin.content.edit")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedBlock && getBlockIcon(selectedBlock.block_type)}
              {selectedBlock?.block_name}
            </DialogTitle>
            <DialogDescription>
              {t("admin.content.editDescription")}
            </DialogDescription>
          </DialogHeader>
          {selectedBlock && (
            <div className="space-y-4">
              <Tabs defaultValue={supportedLanguages[0].code} className="w-full">
                <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
                  {supportedLanguages.map((lang) => (
                    <TabsTrigger key={lang.code} value={lang.code} className="gap-2 rounded-full border border-border px-3">
                      <Globe className="h-4 w-4" />
                      {lang.nativeName}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {supportedLanguages.map((lang) => (
                  <TabsContent key={lang.code} value={lang.code} className="space-y-4 mt-4">
                    {Object.entries(editContent)
                      .filter(([key]) =>
                        lang.code === "es"
                          ? key.includes(`_${lang.code}`) || !supportedLanguages.some((l) => key.endsWith(`_${l.code}`))
                          : key.includes(`_${lang.code}`)
                      )
                      .map(([key, value]) => (
                        <div key={key} className="min-w-0 space-y-2">
                          <Label htmlFor={key} className="capitalize">
                            {key.replace(new RegExp(`_${lang.code}$`), "").replace(/_/g, " ")}
                          </Label>
                          {value.length > 100 || value.includes("\n") || key.includes("items") ? (
                            <Textarea
                              id={key}
                              value={value}
                              onChange={(e) =>
                                setEditContent({ ...editContent, [key]: e.target.value })
                              }
                              rows={key.includes("items") ? 8 : 4}
                              className="font-mono text-sm break-words"
                            />
                          ) : (
                            <Input
                              id={key}
                              value={value}
                              onChange={(e) =>
                                setEditContent({ ...editContent, [key]: e.target.value })
                              }
                              className="break-words"
                            />
                          )}
                        </div>
                      ))}
                  </TabsContent>
                ))}
              </Tabs>

              <div className="flex items-center gap-2 pt-4 border-t">
                <Switch
                  id="is_published"
                  checked={selectedBlock.is_published}
                  onCheckedChange={() => togglePublished(selectedBlock)}
                />
                <Label htmlFor="is_published">{t("admin.content.blockActiveLabel")}</Label>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  {t("admin.cancel")}
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? t("admin.saving") : t("admin.saveChanges")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
