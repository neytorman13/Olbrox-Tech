"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/db-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { Database, Download, HardDrive, Clock, RefreshCw, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Backup {
  id: string
  backup_name: string
  backup_type: string
  tables_included: string[] | null
  file_url: string | null
  file_size_bytes: number
  record_count: number
  status: string
  created_at: string
}

const BACKUP_TABLES = [
  "leads",
  "customers",
  "quotations",
  "projects",
  "services",
  "blog_posts",
  "testimonials",
  "faq",
  "website_settings",
  "page_seo",
  "content_blocks",
  "emails",
  "meetings",
  "followups",
  "campaigns",
  "automations",
]

export default function BackupsPage() {
  const [items, setItems] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const db = createClient()

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    const { data, error } = await db.from("backups").select("*").order("created_at", { ascending: false })
    if (error) toast.error("Error al cargar respaldos")
    setItems(data || [])
    setLoading(false)
  }

  async function runBackup() {
    setRunning(true)
    toast.info("Generando respaldo...")
    try {
      const snapshot: Record<string, any[]> = {}
      let totalRecords = 0

      for (const table of BACKUP_TABLES) {
        const { data } = await db.from(table).select("*")
        snapshot[table] = data || []
        totalRecords += (data || []).length
      }

      const json = JSON.stringify(snapshot, null, 2)
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const name = `olbrox_backup_${format(new Date(), "yyyyMMdd_HHmmss")}.json`
      link.href = url
      link.download = name
      link.click()

      await db.from("backups").insert({
        backup_name: name,
        backup_type: "manual",
        tables_included: BACKUP_TABLES,
        file_size_bytes: blob.size,
        record_count: totalRecords,
        status: "completed",
      })

      toast.success(`Respaldo generado: ${totalRecords} registros`)
      fetchItems()
    } catch (e) {
      toast.error("Error al generar respaldo")
      console.error(e)
    } finally {
      setRunning(false)
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este registro de respaldo?")) return
    const { error } = await db.from("backups").delete().eq("id", id)
    if (error) return toast.error("Error")
    toast.success("Eliminado")
    fetchItems()
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  const lastBackup = items[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Respaldos</h2>
          <p className="text-muted-foreground">Copias de seguridad de la base de datos</p>
        </div>
        <Button onClick={runBackup} disabled={running}>
          {running ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          {running ? "Generando..." : "Generar respaldo ahora"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Respaldos totales</span>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-1 text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Último respaldo</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-1 text-lg font-bold">
              {lastBackup ? format(new Date(lastBackup.created_at), "dd MMM HH:mm", { locale: es }) : "Nunca"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tablas incluidas</span>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-1 text-2xl font-bold">{BACKUP_TABLES.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de respaldos</CardTitle>
          <CardDescription>
            Los respaldos manuales se descargan a tu equipo. Configura respaldos automáticos en tu servidor MySQL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-muted-foreground">
              <Database className="h-10 w-10" />
              <p className="mt-2 text-sm">Aún no hay respaldos</p>
              <p className="text-xs">Genera el primer respaldo desde el botón superior</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Registros</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.backup_name}</TableCell>
                    <TableCell><Badge variant="outline">{b.backup_type}</Badge></TableCell>
                    <TableCell>{b.record_count.toLocaleString()}</TableCell>
                    <TableCell>{formatSize(b.file_size_bytes)}</TableCell>
                    <TableCell className="text-sm">{format(new Date(b.created_at), "dd MMM yyyy, HH:mm", { locale: es })}</TableCell>
                    <TableCell>
                      <Badge className={b.status === "completed" ? "bg-emerald-500" : b.status === "failed" ? "bg-red-500" : "bg-blue-500"}>
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => remove(b.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


