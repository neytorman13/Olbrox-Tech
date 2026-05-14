"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/db-client"
import { useLanguage } from "@/lib/i18n"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Settings,
  Globe,
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Github,
  Video,
  Save,
  Palette,
  User,
  Shield,
} from "lucide-react"

interface SettingsData {
  [key: string]: string
}

export default function SettingsPage() {
  const { t } = useLanguage()
  const [settings, setSettings] = useState<SettingsData>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<{ email?: string; full_name?: string } | null>(null)
  const db = createClient()

  useEffect(() => {
    fetchSettings()
    fetchUser()
  }, [])

  async function fetchUser() {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' })
      const data = await response.json()
      const authUser = data?.data?.user ?? null
      if (response.ok && authUser) {
        setUser({
          email: authUser.email,
          full_name: authUser.full_name || authUser.user_metadata?.full_name || "",
        })
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  async function fetchSettings() {
    setLoading(true)
    const { data, error } = await db
      .from("website_settings")
      .select("setting_key, setting_value")

    if (error) {
      toast.error(t("admin.errors.loadingSettings"))
      console.error(error)
    } else {
      const settingsObj: SettingsData = {}
      data?.forEach((item: any) => {
        try {
          settingsObj[item.setting_key] = JSON.parse(item.setting_value)
        } catch {
          settingsObj[item.setting_key] = item.setting_value
        }
      })
      setSettings(settingsObj)
    }
    setLoading(false)
  }

  async function saveSetting(key: string, value: string) {
    const { error } = await db
      .from("website_settings")
      .upsert({
        setting_key: key,
        setting_value: JSON.stringify(value),
        updated_at: new Date().toISOString(),
      }, { onConflict: "setting_key" })

    if (error) {
      throw error
    }
  }

  async function saveAllSettings() {
    setSaving(true)
    try {
      for (const [key, value] of Object.entries(settings)) {
        await saveSetting(key, value)
      }
      toast.success(t("admin.success.settingsSaved"))
    } catch (error) {
      toast.error(t("admin.errors.savingSettings"))
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  async function updateProfile(fullName: string) {
    try {
      const response = await fetch('/api/auth/update', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { full_name: fullName } })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      toast.success(t("admin.success.profileUpdated"))
      setUser({ ...user, full_name: fullName })
    } catch (error) {
      toast.error(t("admin.errors.savingProfile"))
      console.error(error)
    }
  }

  async function updatePassword(newPassword: string) {
    if (newPassword.length < 6) {
      toast.error(t("admin.errors.passwordTooShort"))
      return
    }

    try {
      const response = await fetch('/api/auth/update', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      toast.success(t("admin.success.passwordUpdated"))
    } catch (error) {
      toast.error(t("admin.errors.savingProfile"))
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("admin.settings.title")}</h2>
          <p className="text-muted-foreground">
            {t("admin.settings.subtitle")}
          </p>
        </div>
        <Button onClick={saveAllSettings} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? t("admin.common.saving") : t("admin.settings.saveChanges")}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">{t("admin.settings.tabs.general")}</TabsTrigger>
          <TabsTrigger value="contact">{t("admin.settings.tabs.contact")}</TabsTrigger>
          <TabsTrigger value="social">{t("admin.settings.tabs.social")}</TabsTrigger>
          <TabsTrigger value="account">{t("admin.settings.tabs.account")}</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t("admin.settings.general.title")}
              </CardTitle>
              <CardDescription>
                {t("admin.settings.general.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="site_name">{t("admin.settings.general.siteName")}</Label>
                  <Input
                    id="site_name"
                    value={settings.site_name || ""}
                    onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                    placeholder="Olbrox Tech"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site_tagline">{t("admin.settings.general.tagline")}</Label>
                  <Input
                    id="site_tagline"
                    value={settings.site_tagline || ""}
                    onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
                    placeholder="Desarrollo de Software Profesional"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="business_hours" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t("admin.settings.general.businessHours")}
                </Label>
                <Input
                  id="business_hours"
                  value={settings.business_hours || ""}
                  onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })}
                  placeholder="Lunes a Viernes: 9:00 - 18:00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t("admin.settings.general.address")}
                </Label>
                <Input
                  id="address"
                  value={settings.address || ""}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="Quito, Ecuador"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Settings */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                {t("admin.settings.contact.title")}
              </CardTitle>
              <CardDescription>
                {t("admin.settings.contact.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact_email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t("admin.settings.contact.email")}
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={settings.contact_email || ""}
                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                    placeholder="info@olbroxtech.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {t("admin.settings.contact.phone")}
                  </Label>
                  <Input
                    id="contact_phone"
                    value={settings.contact_phone || ""}
                    onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                    placeholder="+593 99 999 9999"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="whatsapp_number" className="flex items-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  {t("admin.settings.contact.whatsapp")}
                </Label>
                <Input
                  id="whatsapp_number"
                  value={settings.whatsapp_number || ""}
                  onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                  placeholder="593999999999"
                />
                <p className="text-xs text-muted-foreground">
                  {t("admin.settings.contact.whatsappHelp")}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Settings */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t("admin.settings.social.title")}
              </CardTitle>
              <CardDescription>
                {t("admin.settings.social.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="social_facebook" className="flex items-center gap-2">
                    <Facebook className="h-4 w-4" />
                    {t("admin.settings.social.facebook")}
                  </Label>
                  <Input
                    id="social_facebook"
                    value={settings.social_facebook || ""}
                    onChange={(e) => setSettings({ ...settings, social_facebook: e.target.value })}
                    placeholder="https://facebook.com/olbroxtech"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social_instagram" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    {t("admin.settings.social.instagram")}
                  </Label>
                  <Input
                    id="social_instagram"
                    value={settings.social_instagram || ""}
                    onChange={(e) => setSettings({ ...settings, social_instagram: e.target.value })}
                    placeholder="https://instagram.com/olbroxtech"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social_tiktok" className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    {t("admin.settings.social.tiktok")}
                  </Label>
                  <Input
                    id="social_tiktok"
                    value={settings.social_tiktok || ""}
                    onChange={(e) => setSettings({ ...settings, social_tiktok: e.target.value })}
                    placeholder="https://tiktok.com/@olbroxtech"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social_linkedin" className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4" />
                    {t("admin.settings.social.linkedin")}
                  </Label>
                  <Input
                    id="social_linkedin"
                    value={settings.social_linkedin || ""}
                    onChange={(e) => setSettings({ ...settings, social_linkedin: e.target.value })}
                    placeholder="https://linkedin.com/company/olbroxtech"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social_twitter" className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" />
                    {t("admin.settings.social.twitter")}
                  </Label>
                  <Input
                    id="social_twitter"
                    value={settings.social_twitter || ""}
                    onChange={(e) => setSettings({ ...settings, social_twitter: e.target.value })}
                    placeholder="https://twitter.com/olbroxtech"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="social_github" className="flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    {t("admin.settings.social.github")}
                  </Label>
                  <Input
                    id="social_github"
                    value={settings.social_github || ""}
                    onChange={(e) => setSettings({ ...settings, social_github: e.target.value })}
                    placeholder="https://github.com/olbroxtech"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t("admin.settings.account.profile")}
                </CardTitle>
                <CardDescription>
                  {t("admin.settings.account.profileDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("admin.settings.account.email")}</Label>
                  <Input value={user?.email || ""} disabled />
                  <p className="text-xs text-muted-foreground">
                    {t("admin.settings.account.emailDisabled")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">{t("admin.settings.account.fullName")}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="full_name"
                      value={user?.full_name || ""}
                      onChange={(e) => setUser({ ...user, full_name: e.target.value })}
                      placeholder={t("admin.settings.account.fullName")}
                    />
                    <Button onClick={() => updateProfile(user?.full_name || "")}>
                      {t("admin.common.save")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t("admin.settings.account.security")}
                </CardTitle>
                <CardDescription>
                  {t("admin.settings.account.securityDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new_password">{t("admin.settings.account.newPassword")}</Label>
                  <Input
                    id="new_password"
                    type="password"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">{t("admin.settings.account.confirmPassword")}</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="••••••••"
                  />
                </div>
                <Button
                  onClick={() => {
                    const newPass = (document.getElementById("new_password") as HTMLInputElement).value
                    const confirmPass = (document.getElementById("confirm_password") as HTMLInputElement).value
                    if (newPass !== confirmPass) {
                      toast.error(t("admin.errors.passwordMismatch"))
                      return
                    }
                    updatePassword(newPass)
                  }}
                >
                  {t("admin.settings.account.changePassword")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


