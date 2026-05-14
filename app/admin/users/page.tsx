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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Shield, User, Crown, Megaphone, LifeBuoy, Eye, Edit3, Pencil } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useLanguage } from "@/lib/i18n"

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
  created_at: string
  email?: string
  roles?: { role: string; granted_at: string; is_active: boolean }[]
}

const roleMeta: Record<string, { labelKey: string; color: string; icon: any; descKey: string }> = {
  super_admin: { labelKey: "admin.users.superAdmin", color: "bg-red-500", icon: Crown, descKey: "admin.users.superAdminDesc" },
  admin: { labelKey: "admin.users.admin", color: "bg-orange-500", icon: Shield, descKey: "admin.users.adminDesc" },
  editor: { labelKey: "admin.users.editor", color: "bg-blue-500", icon: Edit3, descKey: "admin.users.editorDesc" },
  sales: { labelKey: "admin.users.sales", color: "bg-emerald-500", icon: User, descKey: "admin.users.salesDesc" },
  marketing: { labelKey: "admin.users.marketing", color: "bg-purple-500", icon: Megaphone, descKey: "admin.users.marketingDesc" },
  support: { labelKey: "admin.users.support", color: "bg-teal-500", icon: LifeBuoy, descKey: "admin.users.supportDesc" },
  viewer: { labelKey: "admin.users.viewer", color: "bg-gray-500", icon: Eye, descKey: "admin.users.viewerDesc" },
}

export default function UsersPage() {
  const { t } = useLanguage()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const db = createClient()

  useEffect(() => {
    fetchProfiles()
  }, [])

  async function fetchProfiles() {
    setLoading(true)
    const { data: profileData, error } = await db
      .from("admin_profiles")
      .select("id, full_name, avatar_url, role, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      toast.error(t("admin.errors.loadingUsers"))
      setLoading(false)
      return
    }

    // Fetch roles from user_roles table
    const { data: rolesData } = await db
      .from("user_roles")
      .select("user_id, role, granted_at, is_active")
      .eq("is_active", true)

    const profilesWithRoles = (profileData || []).map((p: any) => ({
      ...p,
      roles: (rolesData || []).filter((r: any) => r.user_id === p.id),
    }))

    setProfiles(profilesWithRoles)
    setLoading(false)
  }

  async function updatePrimaryRole(userId: string, role: string) {
    const { error } = await db
      .from("admin_profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", userId)
    if (error) return toast.error(t("admin.errors.updatingRole"))
    toast.success(t("admin.success.roleUpdated"))
    fetchProfiles()
  }

  async function toggleRoleGrant(userId: string, role: string, hasRole: boolean) {
    if (hasRole) {
      const { error } = await db
        .from("user_roles")
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("role", role)
      if (error) return toast.error(t("admin.errors.revokingRole"))
      toast.success(t("admin.success.roleRevoked", { role: t(roleMeta[role].labelKey) }))
    } else {
      const { error } = await db.from("user_roles").upsert({
        user_id: userId,
        role,
        is_active: true,
        granted_at: new Date().toISOString(),
      })
      if (error) return toast.error(t("admin.errors.grantingRole"))
      toast.success(t("admin.success.roleGranted", { role: t(roleMeta[role].labelKey) }))
    }
    fetchProfiles()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t("admin.users.title")}</h2>
        <p className="text-muted-foreground">{t("admin.users.subtitle")}</p>
      </div>

      {/* Role reference */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.users.availableRoles")}</CardTitle>
          <CardDescription>{t("admin.users.roleReference")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(roleMeta).map(([key, meta]) => (
              <div key={key} className="flex items-start gap-3 rounded-lg border p-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-md ${meta.color} text-white`}>
                  <meta.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{t(meta.labelKey)}</p>
                  <p className="text-xs text-muted-foreground">{t(meta.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.users.teamMembers")}</CardTitle>
          <CardDescription>
            {t("admin.users.newUsersNote")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : profiles.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <User className="h-10 w-10" />
              <p className="mt-2 text-sm">{t("admin.users.noUsers")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.users.user")}</TableHead>
                  <TableHead>{t("admin.users.primaryRole")}</TableHead>
                  <TableHead>{t("admin.users.additionalRoles")}</TableHead>
                  <TableHead>{t("admin.users.since")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {(p.full_name || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{p.full_name || "Sin nombre"}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={p.role || "admin"} onValueChange={(v) => updatePrimaryRole(p.id, v)}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(roleMeta).map(([key, meta]) => {
                          const has = p.roles?.some((r) => r.role === key && r.is_active)
                          return (
                            <button
                              key={key}
                              onClick={() => toggleRoleGrant(p.id, key, !!has)}
                              className={`rounded-full px-2 py-0.5 text-xs transition-opacity ${
                                has ? `${meta.color} text-white` : "bg-muted text-muted-foreground opacity-60 hover:opacity-100"
                              }`}
                              title={has ? t("admin.users.revokeRole") : t("admin.users.grantRole")}
                            >
                              {t(meta.labelKey)}
                            </button>
                          )
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(p.created_at), "dd MMM yyyy", { locale: es })}
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



