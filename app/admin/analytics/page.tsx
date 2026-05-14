"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/db-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Eye,
  Users,
  Clock,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  TrendingUp,
  MapPin,
  Link2,
  FileText,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts"
import { format, subDays, startOfDay, endOfDay, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { useLanguage } from "@/lib/i18n"

interface Analytics {
  id: string
  page_path: string
  visitor_ip: string | null
  user_agent: string | null
  referrer: string | null
  country: string | null
  city: string | null
  device_type: string | null
  browser: string | null
  os: string | null
  session_id: string | null
  visit_duration: number
  created_at: string
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("7")
  const db = createClient()
  const { t } = useLanguage()

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  async function fetchAnalytics() {
    setLoading(true)
    const days = parseInt(dateRange)
    const startDate = subDays(new Date(), days)

    const { data, error } = await db
      .from("page_analytics")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching analytics:", error)
    } else {
      setAnalytics(data || [])
    }
    setLoading(false)
  }

  // Calculate stats
  const totalVisits = analytics.length
  const uniqueVisitors = new Set(analytics.map((a) => a.session_id || a.visitor_ip)).size
  const avgDuration = analytics.length > 0
    ? Math.round(analytics.reduce((sum, a) => sum + (a.visit_duration || 0), 0) / analytics.length)
    : 0

  // Page views by day
  const visitsByDay = analytics.reduce((acc: Record<string, number>, item) => {
    const date = format(new Date(item.created_at), "dd MMM", { locale: es })
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  const chartData = Object.entries(visitsByDay)
    .reverse()
    .map(([date, visits]) => ({ date, visits }))

  // Device distribution
  const deviceDistribution = analytics.reduce((acc: Record<string, number>, item) => {
    const device = item.device_type || "desktop"
    acc[device] = (acc[device] || 0) + 1
    return acc
  }, {})

  const deviceData = [
    { name: "Escritorio", value: deviceDistribution.desktop || 0, icon: Monitor },
    { name: "Móvil", value: deviceDistribution.mobile || 0, icon: Smartphone },
    { name: "Tablet", value: deviceDistribution.tablet || 0, icon: Tablet },
  ]

  // Browser distribution
  const browserDistribution = analytics.reduce((acc: Record<string, number>, item) => {
    const browser = item.browser || "Desconocido"
    acc[browser] = (acc[browser] || 0) + 1
    return acc
  }, {})

  const browserData = Object.entries(browserDistribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  // Country distribution
  const countryDistribution = analytics.reduce((acc: Record<string, number>, item) => {
    const country = item.country || "Desconocido"
    acc[country] = (acc[country] || 0) + 1
    return acc
  }, {})

  const countryData = Object.entries(countryDistribution)
    .map(([country, visits]) => ({ country, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10)

  // Top pages
  const pageDistribution = analytics.reduce((acc: Record<string, number>, item) => {
    acc[item.page_path] = (acc[item.page_path] || 0) + 1
    return acc
  }, {})

  const topPages = Object.entries(pageDistribution)
    .map(([page, visits]) => ({ page, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10)

  // Referrers
  const referrerDistribution = analytics.reduce((acc: Record<string, number>, item) => {
    const ref = item.referrer ? new URL(item.referrer).hostname : "Directo"
    acc[ref] = (acc[ref] || 0) + 1
    return acc
  }, {})

  const referrerData = Object.entries(referrerDistribution)
    .map(([source, visits]) => ({ source, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10)

  // OS distribution
  const osDistribution = analytics.reduce((acc: Record<string, number>, item) => {
    const os = item.os || "Desconocido"
    acc[os] = (acc[os] || 0) + 1
    return acc
  }, {})

  const osData = Object.entries(osDistribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
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
          <h2 className="text-2xl font-bold">{t("admin.analytics.title")}</h2>
          <p className="text-muted-foreground">
            {t("admin.analytics.description")}
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("admin.analytics.periodPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{t("admin.analytics.last7days")}</SelectItem>
            <SelectItem value="14">{t("admin.analytics.last14days")}</SelectItem>
            <SelectItem value="30">{t("admin.analytics.last30days")}</SelectItem>
            <SelectItem value="90">{t("admin.analytics.last90days")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.analytics.totalVisits")}
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {t("admin.analytics.periodSummary", { count: dateRange })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.analytics.uniqueVisitors")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {t("admin.analytics.sessions")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.analytics.avgDuration")}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgDuration > 60
                ? `${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s`
                : `${avgDuration}s`}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("admin.analytics.durationPerVisit")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.analytics.countries")}
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(countryDistribution).length}</div>
            <p className="text-xs text-muted-foreground">
              {t("admin.analytics.differentLocations")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.analytics.visitsByDay")}</CardTitle>
          <CardDescription>{t("admin.analytics.chartDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVisits)"
                    name={t("admin.analytics.pageVisits")}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                  <p>{t("admin.analytics.noVisits")}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different analytics */}
      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="devices">{t("admin.analytics.devicesTab")}</TabsTrigger>
          <TabsTrigger value="countries">{t("admin.analytics.countriesTab")}</TabsTrigger>
          <TabsTrigger value="pages">{t("admin.analytics.pagesTab")}</TabsTrigger>
          <TabsTrigger value="referrers">{t("admin.analytics.referrersTab")}</TabsTrigger>
          <TabsTrigger value="tech">{t("admin.analytics.techTab")}</TabsTrigger>
        </TabsList>

        {/* Devices Tab */}
        <TabsContent value="devices">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.analytics.deviceDistribution")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {deviceData.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deviceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {deviceData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      {t("admin.analytics.noDeviceData")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("admin.analytics.deviceBreakdown")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deviceData.map((device, index) => {
                    const Icon = device.icon
                    const percentage = totalVisits > 0 ? ((device.value / totalVisits) * 100).toFixed(1) : 0
                    return (
                      <div key={device.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${COLORS[index]}20` }}
                          >
                            <Icon className="h-5 w-5" style={{ color: COLORS[index] }} />
                          </div>
                          <div>
                            <p className="font-medium">{device.name}</p>
                            <p className="text-sm text-muted-foreground">{device.value} {t("admin.analytics.pageVisits").toLowerCase()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{percentage}%</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Countries Tab */}
        <TabsContent value="countries">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t("admin.analytics.countries")}
              </CardTitle>
              <CardDescription>{t("admin.analytics.topCountries")}</CardDescription>
            </CardHeader>
            <CardContent>
              {countryData.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={countryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="country" type="category" className="text-xs" width={120} />
                      <Tooltip />
                      <Bar dataKey="visits" fill="#3b82f6" radius={[0, 4, 4, 0]} name={t("admin.analytics.pageVisits")} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  {t("admin.analytics.noLocationData")}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t("admin.analytics.pagesVisited")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topPages.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.analytics.pageSource")}</TableHead>
                      <TableHead className="text-right">{t("admin.analytics.pageVisits")}</TableHead>
                      <TableHead className="text-right">{t("admin.analytics.pagePercentage")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPages.map((page) => (
                      <TableRow key={page.page}>
                        <TableCell className="font-mono text-sm">{page.page}</TableCell>
                        <TableCell className="text-right">{page.visits}</TableCell>
                        <TableCell className="text-right">
                          {((page.visits / totalVisits) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  {t("admin.analytics.noPagesData")}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referrers Tab */}
        <TabsContent value="referrers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                {t("admin.analytics.trafficSources")}
              </CardTitle>
              <CardDescription>{t("admin.analytics.sourceDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {referrerData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.analytics.pageSource")}</TableHead>
                      <TableHead className="text-right">{t("admin.analytics.pageVisits")}</TableHead>
                      <TableHead className="text-right">{t("admin.analytics.pagePercentage")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrerData.map((ref) => (
                      <TableRow key={ref.source}>
                        <TableCell>{ref.source}</TableCell>
                        <TableCell className="text-right">{ref.visits}</TableCell>
                        <TableCell className="text-right">
                          {((ref.visits / totalVisits) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  {t("admin.analytics.noSources")}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technology Tab */}
        <TabsContent value="tech">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.analytics.browsers")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {browserData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={browserData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={false}
                          labelLine={false}
                        >
                          {browserData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number, _name, item: any) => [`${value} visitas`, item?.payload?.name || "Navegador"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      {t("admin.analytics.noBrowsers")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("admin.analytics.operatingSystems")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {osData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={osData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={false}
                          labelLine={false}
                        >
                          {osData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number, _name, item: any) => [`${value} visitas`, item?.payload?.name || "Sistema operativo"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      {t("admin.analytics.noOS")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

