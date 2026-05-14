import type { Metadata, Viewport } from 'next'
import { Sora, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { LanguageProvider } from '@/lib/i18n'
import { createClient } from '@/lib/db-server'
import './globals.css'

const sora = Sora({
  subsets: ["latin"],
  variable: '--font-sora'
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: '--font-geist-mono'
})

const defaultMeta = {
  title: 'Olbrox Tech | Desarrollo de Software Profesional',
  description: 'Empresa de desarrollo de software especializada en sistemas web, apps móviles, automatización y soluciones tecnológicas innovadoras. Transformamos tus ideas en realidad digital.',
  keywords: ['desarrollo de software', 'aplicaciones web', 'apps móviles', 'automatización', 'sistemas web', 'tecnología', 'inteligencia artificial', 'Ecuador'],
}

function resolveMetadataBase() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    'http://localhost:3000'

  try {
    return new URL(baseUrl)
  } catch {
    return new URL('http://localhost:3000')
  }
}

export async function generateMetadata(): Promise<Metadata> {
  let title = defaultMeta.title
  let description = defaultMeta.description
  let keywords = defaultMeta.keywords
  let ogImage = '/images/olbrox-logo.png'

  try {
    const db = await createClient()
    const { data } = await db
      .from('page_seo')
      .select('meta_title_es, meta_description_es, keywords, og_image')
      .eq('page_identifier', 'home')
      .maybeSingle()

    if (data) {
      if (data.meta_title_es) title = data.meta_title_es
      if (data.meta_description_es) description = data.meta_description_es
      if (data.keywords && Array.isArray(data.keywords) && data.keywords.length) keywords = data.keywords
      if (data.og_image) ogImage = data.og_image
    }
  } catch {}

  return {
    metadataBase: resolveMetadataBase(),
    title,
    description,
    keywords,
    authors: [{ name: 'Olbrox Tech' }],
    creator: 'Olbrox Tech',
    icons: {
      icon: [
        { url: '/images/olbrox-logo.png', type: 'image/png' },
      ],
      apple: '/images/olbrox-logo.png',
    },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Olbrox Tech',
      images: [{ url: ogImage, width: 1200, height: 630, alt: 'Olbrox Tech' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0B0B' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${sora.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased overflow-x-hidden bg-background text-foreground">
        <LanguageProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
          >
            {children}
          </ThemeProvider>
        </LanguageProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

