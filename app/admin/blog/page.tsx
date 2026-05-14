"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/db-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  FileText,
  Calendar,
  ExternalLink,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n"

interface Post {
  id: string
  title_es: string
  title_en: string | null
  slug: string
  excerpt_es: string | null
  featured_image: string | null
  category: string | null
  tags: string[] | null
  is_published: boolean
  is_featured: boolean
  published_at: string | null
  views_count: number
  created_at: string
}

export default function BlogPage() {
  const { t } = useLanguage()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const db = createClient()

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    setLoading(true)
    const { data, error } = await db
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      toast.error(t("admin.errors.loadingPosts"))
    } else {
      setPosts(data || [])
    }
    setLoading(false)
  }

  async function togglePublished(id: string, is_published: boolean) {
    const updates: Record<string, unknown> = {
      is_published,
      updated_at: new Date().toISOString(),
    }

    if (is_published && !posts.find((p) => p.id === id)?.published_at) {
      updates.published_at = new Date().toISOString()
    }

    const { error } = await db.from("blog_posts").update(updates).eq("id", id)

    if (error) {
      toast.error(t("admin.errors.updatingPost"))
    } else {
      toast.success(is_published ? t("admin.success.postPublished") : t("admin.success.postUnpublished"))
      fetchPosts()
    }
  }

  async function deletePost(id: string) {
    const { error } = await db.from("blog_posts").delete().eq("id", id)

    if (error) {
      toast.error(t("admin.errors.deletingPost"))
    } else {
      toast.success(t("admin.success.postDeleted"))
      fetchPosts()
    }
  }

  const filteredPosts = posts.filter(
    (post) =>
      post.title_es.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.category && post.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Stats
  const publishedCount = posts.filter((p) => p.is_published).length
  const draftCount = posts.filter((p) => !p.is_published).length
  const totalViews = posts.reduce((sum, p) => sum + (p.views_count || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("admin.blog.title")}</h2>
          <p className="text-muted-foreground">
            {t("admin.blog.subtitle")}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("admin.blog.newArticle")}
          </Link>
        </Button>
      </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.blog.published")}
            </CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.blog.drafts")}
            </CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.blog.totalViews")}
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("admin.blog.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.blog.articles")} ({filteredPosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">{t("admin.blog.noArticles")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("admin.blog.startWriting")}
              </p>
              <Button asChild>
                <Link href="/admin/blog/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("admin.blog.newArticle")}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.blog.titleHeader")}</TableHead>
                    <TableHead>{t("admin.blog.category")}</TableHead>
                    <TableHead>{t("admin.blog.status")}</TableHead>
                    <TableHead>{t("admin.blog.views")}</TableHead>
                    <TableHead>{t("admin.blog.date")}</TableHead>
                    <TableHead className="text-right">{t("admin.blog.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {post.featured_image ? (
                            <img
                              src={post.featured_image}
                              alt=""
                              className="h-10 w-16 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-16 rounded bg-muted flex items-center justify-center">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{post.title_es}</p>
                            <p className="text-sm text-muted-foreground">/{post.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {post.category ? (
                          <Badge variant="outline">{post.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={post.is_published}
                            onCheckedChange={(checked) => togglePublished(post.id, checked)}
                          />
                          <span className="text-sm">
                            {post.is_published ? (
                              <Badge className="bg-green-500">{t("admin.blog.publishedBadge")}</Badge>
                            ) : (
                              <Badge variant="secondary">{t("admin.blog.draftBadge")}</Badge>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{post.views_count || 0}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {post.published_at
                          ? format(new Date(post.published_at), "dd MMM yyyy", { locale: es })
                          : format(new Date(post.created_at), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t("admin.blog.actionsLabel")}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/blog/${post.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                {t("admin.blog.edit")}
                              </Link>
                            </DropdownMenuItem>
                            {post.is_published && (
                              <DropdownMenuItem asChild>
                                <Link href={`/blog/${post.slug}`} target="_blank">
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  {t("admin.blog.viewOnSite")}
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deletePost(post.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("admin.blog.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


