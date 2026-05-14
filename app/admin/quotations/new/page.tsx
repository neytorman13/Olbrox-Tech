"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/db-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { ArrowLeft, Plus, Trash2, Save, Send } from "lucide-react"
import Link from "next/link"

interface QuoteItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export default function NewQuotationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const leadId = searchParams.get("lead")
  const [saving, setSaving] = useState(false)
  const db = createClient()

  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_company: "",
    project_title: "",
    project_description: "",
    currency: "USD",
    tax_rate: 12,
    discount: 0,
    valid_days: 30,
    notes: "",
    terms: "- Pago inicial del 50% para comenzar el proyecto.\n- 25% al entregar el primer avance.\n- 25% restante al finalizar el proyecto.\n- Incluye 30 días de soporte post-entrega.",
  })

  const [items, setItems] = useState<QuoteItem[]>([
    { description: "", quantity: 1, unit_price: 0, total: 0 },
  ])

  useEffect(() => {
    if (leadId) {
      fetchLeadData(leadId)
    }
  }, [leadId])

  async function fetchLeadData(id: string) {
    const { data } = await db.from("leads").select("*").eq("id", id).single()
    if (data) {
      setFormData((prev) => ({
        ...prev,
        client_name: data.full_name,
        client_email: data.email,
        client_company: data.company || "",
      }))
    }
  }

  function updateItem(index: number, field: keyof QuoteItem, value: string | number) {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    if (field === "quantity" || field === "unit_price") {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price
    }
    
    setItems(newItems)
  }

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unit_price: 0, total: 0 }])
  }

  function removeItem(index: number) {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = (subtotal - formData.discount) * (formData.tax_rate / 100)
  const total = subtotal - formData.discount + taxAmount

  async function generateQuoteNumber() {
    const { count } = await db
      .from("quotations")
      .select("*", { count: "exact", head: true })
    
    const year = new Date().getFullYear()
    const number = String((count || 0) + 1).padStart(4, "0")
    return `COT-${year}-${number}`
  }

  async function saveQuotation(status: "draft" | "sent") {
    if (!formData.client_name || !formData.client_email || !formData.project_title) {
      toast.error("Por favor completa los campos requeridos")
      return
    }

    if (items.every((item) => !item.description)) {
      toast.error("Agrega al menos un ítem a la cotización")
      return
    }

    setSaving(true)

    try {
      const quoteNumber = await generateQuoteNumber()
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + formData.valid_days)

      const authResponse = await fetch('/api/auth/me', { credentials: 'include' })
      const authData = await authResponse.json()
      const authUser = authData?.data?.user ?? null
      if (!authResponse.ok || !authUser?.id) throw new Error('Failed to get user')

      const { error } = await db.from("quotations").insert([
        {
          quote_number: quoteNumber,
          lead_id: leadId || null,
          client_name: formData.client_name,
          client_email: formData.client_email,
          client_company: formData.client_company,
          project_title: formData.project_title,
          project_description: formData.project_description,
          items: items.filter((item) => item.description),
          subtotal,
          tax_rate: formData.tax_rate,
          tax_amount: taxAmount,
          discount: formData.discount,
          total,
          currency: formData.currency,
          status,
          valid_until: validUntil.toISOString().split("T")[0],
          notes: formData.notes,
          terms: formData.terms,
          created_by: authUser.id,
        },
      ])

      if (error) throw error

      toast.success(status === "draft" ? "Cotización guardada como borrador" : "Cotización enviada")
      router.push("/admin/quotations")
    } catch (error) {
      toast.error("Error al guardar la cotización")
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
          <Link href="/admin/quotations">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Nueva Cotización</h2>
          <p className="text-muted-foreground">Crea una propuesta para tu cliente</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Nombre *</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_email">Email *</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    placeholder="cliente@ejemplo.com"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="client_company">Empresa</Label>
                  <Input
                    id="client_company"
                    value={formData.client_company}
                    onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
                    placeholder="Nombre de la empresa"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Proyecto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project_title">Título del Proyecto *</Label>
                <Input
                  id="project_title"
                  value={formData.project_title}
                  onChange={(e) => setFormData({ ...formData, project_title: e.target.value })}
                  placeholder="Ej: Desarrollo de Aplicación Web"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_description">Descripción</Label>
                <Textarea
                  id="project_description"
                  value={formData.project_description}
                  onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
                  placeholder="Descripción detallada del proyecto..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Ítems de la Cotización</CardTitle>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Ítem
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Descripción del servicio"
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                    />
                  </div>
                  <div className="w-20 space-y-2">
                    <Input
                      type="number"
                      placeholder="Cant."
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Input
                      type="number"
                      placeholder="Precio"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-32 text-right pt-2">
                    <span className="font-medium">${item.total.toLocaleString()}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Descuento</span>
                  <Input
                    type="number"
                    className="w-32 text-right"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">IVA ({formData.tax_rate}%)</span>
                  <span>${taxAmount.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toLocaleString()} {formData.currency}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Términos y Condiciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="terms">Condiciones de Pago</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales para el cliente..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border bg-background"
                >
                  <option value="USD">USD - Dólar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="PEN">PEN - Sol</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_rate">Tasa de Impuesto (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_days">Validez (días)</Label>
                <Input
                  id="valid_days"
                  type="number"
                  value={formData.valid_days}
                  onChange={(e) => setFormData({ ...formData, valid_days: parseInt(e.target.value) || 30 })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => saveQuotation("draft")}
                disabled={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                Guardar Borrador
              </Button>
              <Button
                className="w-full"
                onClick={() => saveQuotation("sent")}
                disabled={saving}
              >
                <Send className="mr-2 h-4 w-4" />
                Guardar y Enviar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

