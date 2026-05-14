"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/db-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  Plus,
  Search,
  Users,
  Building,
  Mail,
  Phone,
  MoreHorizontal,
  Eye,
  Trash2,
  Edit,
  DollarSign,
  Crown,
  Handshake,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useLanguage } from "@/lib/i18n"

interface Customer {
  id: string
  full_name: string
  email: string
  phone: string | null
  company: string | null
  position: string | null
  country: string | null
  customer_type: "prospect" | "client" | "vip" | "partner"
  lifetime_value: number
  total_projects: number
  last_contact_at: string | null
  notes: string | null
  tags: string[] | null
  created_at: string
}

const typeMeta: Record<string, { labelKey: string; color: string; icon: any }> = {
  prospect: { labelKey: "admin.customers.prospect", color: "bg-blue-500", icon: Users },
  client: { labelKey: "admin.customers.client", color: "bg-emerald-500", icon: Handshake },
  vip: { labelKey: "admin.customers.vip", color: "bg-amber-500", icon: Crown },
  partner: { labelKey: "admin.customers.partner", color: "bg-purple-500", icon: Building },
}

export default function CustomersPage() {
  const { t } = useLanguage()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selected, setSelected] = useState<Customer | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState<Partial<Customer>>({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    country: "",
    customer_type: "prospect",
    lifetime_value: 0,
    notes: "",
  })
  const db = createClient()

  useEffect(() => {
    fetchCustomers()
  }, [typeFilter])

  async function fetchCustomers() {
    setLoading(true)
    let query = db.from("customers").select("*").order("created_at", { ascending: false })
    if (typeFilter !== "all") query = query.eq("customer_type", typeFilter)
    const { data, error } = await query
    if (error) toast.error(t("admin.customers.errorLoading"))
    setCustomers(data || [])
    setLoading(false)
  }

  function openCreate() {
    setIsEdit(false)
    setForm({
      full_name: "",
      email: "",
      phone: "",
      company: "",
      position: "",
      country: "",
      customer_type: "prospect",
      lifetime_value: 0,
      notes: "",
    })
    setIsFormOpen(true)
  }

  function openEdit(c: Customer) {
    setIsEdit(true)
    setSelected(c)
    setForm(c)
    setIsFormOpen(true)
  }

  async function saveCustomer() {
    if (!form.full_name || !form.email) return toast.error(t("admin.customers.nameEmailRequired"))
    const payload = {
      ...form,
      lifetime_value: Number(form.lifetime_value) || 0,
      updated_at: new Date().toISOString(),
    }

    if (isEdit && selected) {
      const { error } = await db.from("customers").update(payload).eq("id", selected.id)
      if (error) return toast.error(t("admin.customers.errorUpdating"))
      toast.success(t("admin.customers.customerUpdated"))
    } else {
      const { error } = await db.from("customers").insert(payload)
      if (error) return toast.error(t("admin.customers.errorCreating"))
      toast.success(t("admin.customers.customerCreated"))
    }
    setIsFormOpen(false)
    fetchCustomers()
  }

  async function deleteCustomer(id: string) {
    if (!confirm(t("admin.customers.confirmDelete"))) return
    const { error } = await db.from("customers").delete().eq("id", id)
    if (error) return toast.error(t("admin.customers.errorDeleting"))
    toast.success(t("admin.customers.customerDeleted"))
    fetchCustomers()
  }

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.company || "").toLowerCase().includes(search.toLowerCase()),
  )

  const totalLTV = customers.reduce((s, c) => s + Number(c.lifetime_value || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("admin.customers.title")}</h2>
          <p className="text-muted-foreground">{t("admin.customers.subtitle")}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t("admin.customers.newCustomer")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-muted-foreground">{t("admin.customers.total")}</div>
            <div className="mt-1 text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        {Object.entries(typeMeta).map(([key, meta]) => {
          const count = customers.filter((c) => c.customer_type === key).length
          return (
            <Card key={key} className="cursor-pointer hover:bg-muted/50" onClick={() => setTypeFilter(key)}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t(meta.labelKey)}</span>
                  <meta.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-1 text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder={t("admin.customers.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.customers.allTypes")}</SelectItem>
                {Object.entries(typeMeta).map(([k, m]) => (
                  <SelectItem key={k} value={k}>{t(m.labelKey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-muted/40 px-4 py-3 text-sm">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span className="text-muted-foreground">{t("admin.customers.portfolioValue")}</span>
            <span className="font-semibold">${totalLTV.toLocaleString()}</span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Users className="h-10 w-10" />
              <p className="mt-2 text-sm">{t("admin.customers.noCustomers")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.customers.customer")}</TableHead>
                    <TableHead>{t("admin.customers.company")}</TableHead>
                    <TableHead>{t("admin.customers.contact")}</TableHead>
                    <TableHead>{t("admin.customers.type")}</TableHead>
                    <TableHead>{t("admin.customers.ltv")}</TableHead>
                    <TableHead>{t("admin.customers.projects")}</TableHead>
                    <TableHead>{t("admin.customers.lastContact")}</TableHead>
                    <TableHead className="text-right">{t("admin.customers.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const meta = typeMeta[c.customer_type]
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.full_name}</TableCell>
                        <TableCell>{c.company || "-"}</TableCell>
                        <TableCell className="text-sm">
                          <div>{c.email}</div>
                          {c.phone && <div className="text-xs text-muted-foreground">{c.phone}</div>}
                        </TableCell>
                        <TableCell><Badge className={meta.color}>{t(meta.labelKey)}</Badge></TableCell>
                        <TableCell>${Number(c.lifetime_value).toLocaleString()}</TableCell>
                        <TableCell>{c.total_projects}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.last_contact_at ? format(new Date(c.last_contact_at), "dd MMM", { locale: es }) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(c)}>
                                <Edit className="mr-2 h-4 w-4" /> {t("admin.customers.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={`mailto:${c.email}`}>
                                  <Mail className="mr-2 h-4 w-4" /> {t("admin.customers.email")}
                                </a>
                              </DropdownMenuItem>
                              {c.phone && (
                                <DropdownMenuItem asChild>
                                  <a href={`tel:${c.phone}`}>
                                    <Phone className="mr-2 h-4 w-4" /> {t("admin.customers.call")}
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteCustomer(c.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> {t("admin.customers.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEdit ? t("admin.customers.editCustomer") : t("admin.customers.newCustomerTitle")}</DialogTitle>
            <DialogDescription>{t("admin.customers.formDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("admin.customers.fullNameRequired")}</Label>
              <Input value={form.full_name || ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.customers.emailRequired")}</Label>
              <Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.customers.phone")}</Label>
              <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.customers.company")}</Label>
              <Input value={form.company || ""} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.customers.position")}</Label>
              <Input value={form.position || ""} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.customers.country")}</Label>
              <Input value={form.country || ""} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.customers.type")}</Label>
              <Select value={form.customer_type} onValueChange={(v: any) => setForm({ ...form, customer_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(typeMeta).map(([k, m]) => (
                    <SelectItem key={k} value={k}>{t(m.labelKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("admin.customers.estimatedValue")}</Label>
              <Input
                type="number"
                value={form.lifetime_value || 0}
                onChange={(e) => setForm({ ...form, lifetime_value: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("admin.customers.notes")}</Label>
              <Textarea rows={3} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>{t("admin.customers.cancel")}</Button>
            <Button onClick={saveCustomer}>{isEdit ? t("admin.customers.saveChanges") : t("admin.customers.createCustomer")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


