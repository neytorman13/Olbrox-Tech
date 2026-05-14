"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/db-client"
import { useLanguage } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Code,
  Globe,
  Smartphone,
  Server,
  ShoppingCart,
  Database,
  Lock,
  Bot,
  MonitorSmartphone,
  Brush,
  Link as LinkIcon,
} from "lucide-react"
import { defaultServices as sharedDefaultServices } from "@/lib/site-defaults"
import { normalizeService, slugifyService, type ServiceRecord } from "@/lib/services"

interface Service extends ServiceRecord {
  created_at: string
}

const iconOptions = [
  { value: "code", label: "Desarrollo", icon: Code },
  { value: "globe", label: "Web", icon: Globe },
  { value: "smartphone", label: "Movil", icon: Smartphone },
  { value: "server", label: "Backend", icon: Server },
  { value: "shopping-cart", label: "E-commerce", icon: ShoppingCart },
  { value: "palette", label: "Diseno", icon: Brush },
  { value: "settings", label: "Automatizacion", icon: Bot },
  { value: "zap", label: "Integracion / IA", icon: MonitorSmartphone },
  { value: "database", label: "Base de Datos", icon: Database },
  { value: "lock", label: "Seguridad", icon: Lock },
]

const defaultService: Partial<Service> = {
  name_es: "",
  name_en: "",
  name_pt: "",
  description_es: "",
  description_en: "",
  description_pt: "",
  icon: "code",
  features: [],
  is_featured: false,
  is_published: true,
  display_order: 0,
  slug: "",
  hero_title: "",
  hero_description: "",
  detail_content: "",
  process_steps: [],
  deliverables: [],
  use_cases: [],
}

function stringifyLines(value: unknown) {
  if (Array.isArray(value)) return value.join("\n")
  if (typeof value === "string") return value
  return ""
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null)
  const [featuresInput, setFeaturesInput] = useState("")
  const [processInput, setProcessInput] = useState("")
  const [deliverablesInput, setDeliverablesInput] = useState("")
  const [useCasesInput, setUseCasesInput] = useState("")
  const db = createClient()
  const { t } = useLanguage()

  useEffect(() => {
    void fetchServices()
  }, [])

  async function fetchServices() {
    setLoading(true)
    await fetch("/api/admin/site/bootstrap", { method: "POST", credentials: "include" })

    const { data, error } = await db.from("services").select("*").order("display_order", { ascending: true })

    if (error) {
      toast.error(t("admin.services.loadError"))
      setLoading(false)
      return
    }

    setServices(((data || []) as Service[]).map((service) => normalizeService(service) as Service))
    setLoading(false)
  }

  function fillDerivedState(service: Partial<Service>) {
    setFeaturesInput(stringifyLines(service.features))
    setProcessInput(stringifyLines(service.process_steps))
    setDeliverablesInput(stringifyLines(service.deliverables))
    setUseCasesInput(stringifyLines(service.use_cases))
  }

  function openCreateDialog() {
    const draft = { ...defaultService }
    setEditingService(draft)
    fillDerivedState(draft)
    setIsDialogOpen(true)
  }

  function openEditDialog(service: Service) {
    setEditingService(service)
    fillDerivedState(service)
    setIsDialogOpen(true)
  }

  async function saveService() {
    if (!editingService?.name_es || !editingService?.description_es) {
      toast.error(t("admin.services.requiredFields"))
      return
    }

    const features = featuresInput.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
    const processSteps = processInput.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
    const deliverables = deliverablesInput.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
    const useCases = useCasesInput.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
    const slug = (editingService.slug || slugifyService(editingService.name_es)).trim()

    const serviceData = {
      ...editingService,
      slug,
      title_es: editingService.name_es,
      title_en: editingService.name_en || null,
      title_pt: editingService.name_pt || null,
      hero_title: editingService.hero_title || editingService.name_es,
      hero_description: editingService.hero_description || editingService.description_es,
      detail_content: editingService.detail_content || editingService.description_es,
      features,
      process_steps: processSteps,
      deliverables,
      use_cases: useCases,
      updated_at: new Date().toISOString(),
    }

    if (editingService.id) {
      const { error } = await db.from("services").update(serviceData).eq("id", editingService.id)
      if (error) {
        toast.error(t("admin.services.updateError"))
        return
      }
      toast.success(t("admin.services.updated"))
    } else {
      const { error } = await db.from("services").insert([serviceData])
      if (error) {
        toast.error(t("admin.services.createError"))
        return
      }
      toast.success(t("admin.services.created"))
    }

    setIsDialogOpen(false)
    void fetchServices()
  }

  async function deleteService(id: string) {
    const { error } = await db.from("services").delete().eq("id", id)
    if (error) {
      toast.error(t("admin.services.deleteError"))
      return
    }
    toast.success(t("admin.services.deleted"))
    setIsDeleteDialogOpen(false)
    setEditingService(null)
    void fetchServices()
  }

  async function togglePublished(id: string, is_published: boolean) {
    const { error } = await db.from("services").update({ is_published, updated_at: new Date().toISOString() }).eq("id", id)
    if (error) {
      toast.error(t("admin.services.toggleStatusError"))
      return
    }
    void fetchServices()
  }

  async function initializeDefaultServices() {
    const { error } = await db.from("services").insert(
      sharedDefaultServices.map((service) => ({
        ...service,
        title_es: service.name_es,
        title_en: service.name_en,
        title_pt: service.name_pt,
      })),
    )
    if (error) {
      toast.error(t("admin.services.createError"))
      return
    }
    toast.success("Servicios inicializados correctamente")
    void fetchServices()
  }

  function getIcon(iconName: string | null | undefined) {
    const option = iconOptions.find((item) => item.value === iconName)
    return option?.icon || Code
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("admin.services.title")}</h2>
          <p className="text-muted-foreground">{t("admin.services.subtitle")}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t("admin.services.newService")}
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Card key={index}>
              <CardHeader><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="mt-2 h-6 w-3/4" /></CardHeader>
              <CardContent><Skeleton className="h-20 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Code className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{t("admin.services.noServices")}</h3>
            <p className="mb-4 text-center text-muted-foreground">{t("admin.services.addFirst")}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button onClick={openCreateDialog}><Plus className="mr-2 h-4 w-4" />{t("admin.services.createService")}</Button>
              <Button onClick={initializeDefaultServices} variant="outline">Cargar servicios base</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const IconComponent = getIcon(service.icon)
            return (
              <Card key={service.id} className="group relative overflow-hidden">
                <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="icon" variant="ghost" onClick={() => openEditDialog(service)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { setEditingService(service); setIsDeleteDialogOpen(true) }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="flex flex-wrap items-center gap-2 pr-10 text-lg leading-tight">
                        <span className="min-w-0 break-words">{service.name_es}</span>
                        {service.is_featured && <Badge variant="secondary" className="text-xs">Destacado</Badge>}
                      </CardTitle>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <LinkIcon className="h-3.5 w-3.5" />
                        <span>/servicios/{service.slug}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="min-h-[4.5rem] break-words text-sm leading-6 text-muted-foreground line-clamp-3">{service.description_es}</p>
                  <p className="min-h-[3rem] break-words text-xs leading-5 text-muted-foreground line-clamp-2">{service.hero_title}</p>

                  {Array.isArray(service.features) && service.features.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {service.features.slice(0, 4).map((feature, index) => (
                        <Badge key={index} variant="outline" className="max-w-full text-xs"><span className="truncate">{feature}</span></Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t pt-2">
                    <div className="flex items-center gap-2">
                      <Switch checked={Boolean(service.is_published)} onCheckedChange={(checked) => togglePublished(service.id, checked)} />
                      <span className="text-sm text-muted-foreground">
                        {service.is_published ? t("admin.status.visible") : t("admin.status.hidden")}
                      </span>
                    </div>
                    <GripVertical className="h-5 w-5 cursor-grab text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService?.id ? t("admin.services.editService") : t("admin.services.newService")}</DialogTitle>
            <DialogDescription>
              {editingService?.id ? "Edita el resumen y la pagina detallada del servicio." : "Crea el servicio y su pagina de detalle publica."}
            </DialogDescription>
          </DialogHeader>

          {editingService && (
            <div className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="name_es">{t("admin.services.nameES")} *</Label>
                  <Input id="name_es" value={editingService.name_es || ""} onChange={(e) => {
                    const name = e.target.value
                    setEditingService({ ...editingService, name_es: name, slug: editingService.slug || slugifyService(name) })
                  }} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug de URL *</Label>
                  <Input id="slug" value={editingService.slug || ""} onChange={(e) => setEditingService({ ...editingService, slug: slugifyService(e.target.value) })} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">{t("admin.services.icon")}</Label>
                  <Select value={editingService.icon || "code"} onValueChange={(value) => setEditingService({ ...editingService, icon: value })}>
                    <SelectTrigger id="icon" className="h-11"><SelectValue placeholder="Selecciona un icono" /></SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((option) => {
                        const OptionIcon = option.icon
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2"><OptionIcon className="h-4 w-4 text-primary" /><span>{option.label}</span></div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 lg:col-span-3">
                  <Label htmlFor="description_es">{t("admin.services.descriptionES")} *</Label>
                  <Textarea id="description_es" rows={3} value={editingService.description_es || ""} onChange={(e) => setEditingService({ ...editingService, description_es: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name_en">{t("admin.services.nameEN")}</Label>
                  <Input id="name_en" value={editingService.name_en || ""} onChange={(e) => setEditingService({ ...editingService, name_en: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_pt">{t("admin.services.namePT")}</Label>
                  <Input id="name_pt" value={editingService.name_pt || ""} onChange={(e) => setEditingService({ ...editingService, name_pt: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">{t("admin.services.displayOrder")}</Label>
                  <Input id="display_order" type="number" value={editingService.display_order || 0} onChange={(e) => setEditingService({ ...editingService, display_order: parseInt(e.target.value, 10) || 0 })} />
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 p-5">
                <h3 className="text-lg font-semibold">Pagina de detalle del servicio</h3>
                <p className="mt-1 text-sm text-muted-foreground">Este contenido se mostrara en la pagina profesional del servicio.</p>

                <div className="mt-5 grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hero_title">Titulo principal de la pagina</Label>
                    <Input id="hero_title" value={editingService.hero_title || ""} onChange={(e) => setEditingService({ ...editingService, hero_title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero_description">Descripcion destacada</Label>
                    <Textarea id="hero_description" rows={3} value={editingService.hero_description || ""} onChange={(e) => setEditingService({ ...editingService, hero_description: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="detail_content">Contenido explicativo completo</Label>
                    <Textarea id="detail_content" rows={6} value={editingService.detail_content || ""} onChange={(e) => setEditingService({ ...editingService, detail_content: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="features">{t("admin.services.features")}</Label>
                  <Textarea id="features" rows={5} value={featuresInput} onChange={(e) => setFeaturesInput(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="process_steps">Proceso de trabajo (uno por linea)</Label>
                  <Textarea id="process_steps" rows={5} value={processInput} onChange={(e) => setProcessInput(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliverables">Entregables (uno por linea)</Label>
                  <Textarea id="deliverables" rows={5} value={deliverablesInput} onChange={(e) => setDeliverablesInput(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="use_cases">Casos de uso (uno por linea)</Label>
                  <Textarea id="use_cases" rows={5} value={useCasesInput} onChange={(e) => setUseCasesInput(e.target.value)} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch id="is_published" checked={Boolean(editingService.is_published)} onCheckedChange={(checked) => setEditingService({ ...editingService, is_published: checked })} />
                  <Label htmlFor="is_published">{t("admin.services.published")}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="is_featured" checked={Boolean(editingService.is_featured)} onCheckedChange={(checked) => setEditingService({ ...editingService, is_featured: checked })} />
                  <Label htmlFor="is_featured">{t("admin.services.featured")}</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t("admin.services.cancel")}</Button>
            <Button onClick={saveService}>{editingService?.id ? t("admin.services.save") : t("admin.services.createService")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.services.deleteServiceTitle")}</DialogTitle>
            <DialogDescription>{t("admin.services.deleteServiceDescription", { name: editingService?.name_es || "" })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>{t("admin.services.cancel")}</Button>
            <Button variant="destructive" onClick={() => editingService?.id && deleteService(editingService.id)}>{t("admin.services.delete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
