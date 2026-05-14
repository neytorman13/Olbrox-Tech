"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/db-client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  FileText,
  File,
  MoreVertical,
  Copy,
  Download,
  FolderOpen,
  Search,
  Grid,
  List,
  X,
} from "lucide-react"
import Image from "next/image"

interface MediaItem {
  id: string
  filename: string
  original_name: string
  file_url: string
  file_type: string
  mime_type: string | null
  file_size: number | null
  alt_text: string | null
  caption: string | null
  folder: string
  uploaded_by: string | null
  created_at: string
}

const FOLDERS = [
  { value: "general", label: "General" },
  { value: "branding", label: "Branding" },
  { value: "projects", label: "Proyectos" },
  { value: "services", label: "Servicios" },
  { value: "blog", label: "Blog" },
  { value: "testimonials", label: "Testimonios" },
  { value: "documents", label: "Documentos" },
]

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filterFolder, setFilterFolder] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const db = createClient()

  const fetchMedia = useCallback(async () => {
    try {
      let query = db.from("media").select("*").order("created_at", { ascending: false })

      if (filterFolder !== "all") {
        query = query.eq("folder", filterFolder)
      }
      if (filterType !== "all") {
        query = query.eq("file_type", filterType)
      }

      const { data, error } = await query

      if (error) throw error
      setMedia(data || [])
    } catch (error) {
      console.error("Error fetching media:", error)
      toast.error("Error al cargar archivos")
    } finally {
      setLoading(false)
    }
  }, [db, filterFolder, filterType])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", filterFolder === "all" ? "general" : filterFolder)

        const response = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || "Error uploading file")
        }
      }

      toast.success(`${files.length} archivo(s) subido(s)`)
      fetchMedia()
    } catch (error) {
      console.error("Error uploading:", error)
      toast.error("Error al subir archivo")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/media/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Error deleting file")
      }

      toast.success("Archivo eliminado")
      setIsDetailOpen(false)
      fetchMedia()
    } catch (error) {
      console.error("Error deleting:", error)
      toast.error("Error al eliminar archivo")
    }
  }

  function copyToClipboard(url: string) {
    navigator.clipboard.writeText(url)
    toast.success("URL copiada al portapapeles")
  }

  function formatFileSize(bytes: number | null): string {
    if (!bytes || bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  function getFileIcon(type: string) {
    if (type === "image") return <ImageIcon className="h-8 w-8" />
    if (type === "document") return <FileText className="h-8 w-8" />
    return <File className="h-8 w-8" />
  }

  const filteredMedia = media.filter((item) =>
    item.original_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
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
          <h2 className="text-2xl font-bold tracking-tight">Biblioteca de Medios</h2>
          <p className="text-muted-foreground">
            Gestiona imágenes, documentos y archivos de tu sitio web
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            id="file-upload"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={handleUpload}
          />
          <Button asChild disabled={uploading}>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Subiendo..." : "Subir Archivos"}
            </label>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar archivos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterFolder} onValueChange={setFilterFolder}>
          <SelectTrigger className="w-40">
            <FolderOpen className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Carpeta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {FOLDERS.map((folder) => (
              <SelectItem key={folder.value} value={folder.value}>
                {folder.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="image">Imágenes</SelectItem>
            <SelectItem value="document">Documentos</SelectItem>
            <SelectItem value="other">Otros</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Media Grid/List */}
      {filteredMedia.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Sin archivos</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Sube imágenes y documentos para usar en tu sitio web
            </p>
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Subir Archivos
              </label>
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {filteredMedia.map((item) => (
            <Card
              key={item.id}
              className="group cursor-pointer overflow-hidden hover:ring-2 hover:ring-primary transition-all"
              onClick={() => {
                setSelectedMedia(item)
                setIsDetailOpen(true)
              }}
            >
              <div className="aspect-square relative bg-muted flex items-center justify-center">
                {item.file_type === "image" ? (
                  <Image
                    src={item.file_url}
                    alt={item.alt_text || item.original_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground">{getFileIcon(item.file_type)}</div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="secondary" size="sm">
                    Ver
                  </Button>
                </div>
              </div>
              <CardContent className="p-2">
                <p className="text-xs truncate">{item.original_name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(item.file_size)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    setSelectedMedia(item)
                    setIsDetailOpen(true)
                  }}
                >
                  <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.file_type === "image" ? (
                      <Image
                        src={item.file_url}
                        alt={item.alt_text || item.original_name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground">{getFileIcon(item.file_type)}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.original_name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatFileSize(item.file_size)}</span>
                      <span>•</span>
                      <span>{FOLDERS.find((f) => f.value === item.folder)?.label}</span>
                    </div>
                  </div>
                  <Badge variant="secondary">{item.file_type}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => copyToClipboard(item.file_url)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar URL
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={item.file_url} download target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Descargar
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del archivo</DialogTitle>
            <DialogDescription>{selectedMedia?.original_name}</DialogDescription>
          </DialogHeader>
          {selectedMedia && (
            <div className="space-y-4">
              <div className="aspect-video relative bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                {selectedMedia.file_type === "image" ? (
                  <Image
                    src={selectedMedia.file_url}
                    alt={selectedMedia.alt_text || selectedMedia.original_name}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="text-muted-foreground">
                    {getFileIcon(selectedMedia.file_type)}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Nombre</Label>
                  <p className="text-sm font-medium">{selectedMedia.original_name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Tamaño</Label>
                  <p className="text-sm font-medium">{formatFileSize(selectedMedia.file_size)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Tipo</Label>
                  <p className="text-sm font-medium">{selectedMedia.mime_type}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Carpeta</Label>
                  <p className="text-sm font-medium">
                    {FOLDERS.find((f) => f.value === selectedMedia.folder)?.label}
                  </p>
                </div>

              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">URL</Label>
                <div className="flex items-center gap-2">
                  <Input value={selectedMedia.file_url} readOnly className="font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(selectedMedia.file_url)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" asChild>
                  <a
                    href={selectedMedia.file_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                  </a>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar Archivo</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Estás seguro de que deseas eliminar este archivo? Esta acción no se puede
                        deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(selectedMedia.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}



