"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/db-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Save, FileText, Cookie, Scale, Shield } from "lucide-react"

interface LegalDoc {
  id?: string
  doc_key: string
  title_es: string
  title_en: string | null
  title_pt: string | null
  content_es: string | null
  content_en: string | null
  content_pt: string | null
  version: string
  is_published: boolean
}

const docs: { key: string; label: string; icon: any; desc: string }[] = [
  { key: "privacy", label: "Política de Privacidad", icon: Shield, desc: "Cómo tratamos los datos de los usuarios" },
  { key: "terms", label: "Términos y Condiciones", icon: Scale, desc: "Condiciones de uso del servicio" },
  { key: "cookies", label: "Política de Cookies", icon: Cookie, desc: "Uso de cookies en el sitio" },
]

export default function LegalPage() {
  const [items, setItems] = useState<Record<string, LegalDoc>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [current, setCurrent] = useState("privacy")
  const db = createClient()

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    const { data, error } = await db.from("legal_docs").select("*")
    if (error) toast.error("Error al cargar documentos")
    const map: Record<string, LegalDoc> = {}
    for (const d of docs) {
      const existing = (data || []).find((x: any) => x.doc_key === d.key)
      map[d.key] = existing || {
        doc_key: d.key,
        title_es: d.label,
        title_en: "",
        title_pt: "",
        content_es: "",
        content_en: "",
        content_pt: "",
        version: "1.0",
        is_published: true,
      }
    }
    setItems(map)
    setLoading(false)
  }

  async function saveDoc(key: string) {
    setSaving(true)
    const doc = items[key]
    const payload = { ...doc, updated_at: new Date().toISOString() }

    const { error } = await db
      .from("legal_docs")
      .upsert(payload, { onConflict: "doc_key" })

    if (error) {
      toast.error("Error al guardar")
    } else {
      toast.success("Documento guardado")
    }
    setSaving(false)
  }

  function update(key: string, field: keyof LegalDoc, value: any) {
    setItems((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Documentos legales</h2>
        <p className="text-muted-foreground">Privacidad, términos y cookies del sitio</p>
      </div>

      <Tabs value={current} onValueChange={setCurrent}>
        <TabsList>
          {docs.map((d) => (
            <TabsTrigger key={d.key} value={d.key} className="gap-2">
              <d.icon className="h-4 w-4" /> {d.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {docs.map((d) => {
          const item = items[d.key]
          return (
            <TabsContent key={d.key} value={d.key}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2"><d.icon className="h-5 w-5" /> {d.label}</CardTitle>
                      <CardDescription>{d.desc}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={item.is_published} onCheckedChange={(v) => update(d.key, "is_published", v)} />
                      <Label className="text-sm">Publicado</Label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Versión</Label>
                      <Input value={item.version} onChange={(e) => update(d.key, "version", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Título (ES)</Label>
                      <Input value={item.title_es} onChange={(e) => update(d.key, "title_es", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Título (EN)</Label>
                      <Input value={item.title_en || ""} onChange={(e) => update(d.key, "title_en", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Título (PT)</Label>
                      <Input value={item.title_pt || ""} onChange={(e) => update(d.key, "title_pt", e.target.value)} />
                    </div>
                  </div>

                  <Tabs defaultValue="es">
                    <TabsList>
                      <TabsTrigger value="es">Español</TabsTrigger>
                      <TabsTrigger value="en">English</TabsTrigger>
                      <TabsTrigger value="pt">Português</TabsTrigger>
                    </TabsList>
                    <TabsContent value="es">
                      <Textarea
                        rows={18}
                        value={item.content_es || ""}
                        onChange={(e) => update(d.key, "content_es", e.target.value)}
                        placeholder="Escribe el contenido en español... Soporta Markdown o HTML."
                      />
                    </TabsContent>
                    <TabsContent value="en">
                      <Textarea
                        rows={18}
                        value={item.content_en || ""}
                        onChange={(e) => update(d.key, "content_en", e.target.value)}
                        placeholder="English content..."
                      />
                    </TabsContent>
                    <TabsContent value="pt">
                      <Textarea
                        rows={18}
                        value={item.content_pt || ""}
                        onChange={(e) => update(d.key, "content_pt", e.target.value)}
                        placeholder="Conteúdo em português..."
                      />
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end">
                    <Button onClick={() => saveDoc(d.key)} disabled={saving}>
                      <Save className="mr-2 h-4 w-4" /> {saving ? "Guardando..." : "Guardar documento"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}


