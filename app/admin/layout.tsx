"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import NextImage from "next/image"
import { createClient } from "@/lib/db-client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useLanguage, supportedLanguages } from "@/lib/i18n"
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  Settings,
  BarChart3,
  MessageSquare,
  Calculator,
  Briefcase,
  Bell,
  LogOut,
  Menu,
  ChevronLeft,
  Star,
  Globe,
  HelpCircle,
  Image,
  Search,
  Layers,
  Mail,
  CalendarDays,
  ClipboardList,
  Megaphone,
  Zap,
  ShieldCheck,
  Database,
  Scale,
  UserCog,
  ClipboardCheck,
  Building2,
  Home as HomeIcon,
} from "lucide-react"

type NavItem = { name: string; href: string; icon: any }
type NavGroup = { title: string; items: NavItem[] }

const navigation: NavGroup[] = [
  {
    title: "admin.principal",
    items: [
      { name: "admin.dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "admin.website",
    items: [
      { name: "admin.content", href: "/admin/content", icon: Layers },
      { name: "admin.services", href: "/admin/services", icon: Briefcase },
      { name: "admin.projects", href: "/admin/projects", icon: FolderKanban },
      { name: "admin.faq", href: "/admin/faq", icon: HelpCircle },
      { name: "admin.media", href: "/admin/media", icon: Image },
      { name: "admin.settings", href: "/admin/settings", icon: Settings },
    ],
  },
]

const allItems = navigation.flatMap((g) => g.items)
const allowedAdminPaths = new Set(allItems.map((item) => item.href))

function isAllowedAdminPath(pathname: string) {
  return pathname === "/admin" || allowedAdminPaths.has(pathname)
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email?: string; full_name?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const db = useMemo(() => createClient(), [])
  const { t, language, setLanguage } = useLanguage()

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' })
        const data = await response.json()

        const authUser = data?.data?.user ?? null

        if (!response.ok || !authUser) {
          router.push("/auth/login")
          return
        }

        if (!isAllowedAdminPath(pathname)) {
          router.replace("/admin")
          return
        }

        setUser({
          email: authUser.email,
          full_name: authUser.full_name || authUser.user_metadata?.full_name || authUser.email,
        })

      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [db, pathname, router])

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push("/auth/login")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">{t("admin.loading")}</p>
        </div>
      </div>
    )
  }

  const isActive = (href: string) =>
    pathname === href || (href !== "/admin" && pathname.startsWith(href))

  const currentTitle =
    t(allItems.find((i) => isActive(i.href))?.name || "admin.dashboard")

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background">
          <NextImage
            src="/images/olbrox-logo.png"
            alt="Olbrox Tech"
            fill
            className="object-contain p-1"
            sizes="36px"
            priority
          />
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col">
            <span className="font-semibold">Olbrox Tech</span>
            <span className="text-xs text-muted-foreground">Panel Empresarial</span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="flex flex-col gap-4">
          {navigation.map((group) => (
            <div key={group.title} className="flex flex-col gap-0.5">
              {!sidebarCollapsed && (
                <span className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(group.title)}
                </span>
              )}
              {group.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={active ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "h-9 w-full justify-start gap-3 font-normal",
                        sidebarCollapsed && "justify-center px-2",
                      )}
                      title={sidebarCollapsed ? t(item.name) : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{t(item.name)}</span>}
                    </Button>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t p-3">
        <Link href="/" target="_blank">
          <Button variant="outline" size="sm" className={cn("w-full gap-2", sidebarCollapsed && "px-2")}>
            <Globe className="h-4 w-4" />
            {!sidebarCollapsed && <span>{t("admin.viewsite")}</span>}
          </Button>
        </Link>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-muted/30">
      <aside
        className={cn(
          "hidden border-r bg-background transition-all duration-300 lg:block",
          sidebarCollapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <ChevronLeft className={cn("h-5 w-5 transition-transform", sidebarCollapsed && "rotate-180")} />
            </Button>

            <div className="hidden items-center gap-2 sm:flex">
              <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-background">
                <NextImage
                  src="/images/olbrox-logo.png"
                  alt="Olbrox Tech"
                  fill
                  className="object-contain p-1"
                  sizes="36px"
                  priority
                />
              </div>
              <span className="font-semibold text-sm">Olbrox Tech</span>
            </div>

            <h1 className="truncate text-lg font-semibold">{currentTitle}</h1>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="max-w-[220px] gap-2">
                  <Globe className="h-5 w-5" />
                  <span className="hidden sm:inline">{language.toUpperCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t("admin.language")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {supportedLanguages.map((lang) => (
                  <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code)}>
                    <span className="mr-2 font-semibold">{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.full_name?.charAt(0).toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden truncate md:inline-block">{user?.full_name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t("admin.account")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    {t("admin.settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/security">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {t("admin.security")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("admin.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
