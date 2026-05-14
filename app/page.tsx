import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Services } from "@/components/services"
import { Projects } from "@/components/projects"
import { Testimonials } from "@/components/testimonials"
import { About } from "@/components/about"
import { CtaBlock } from "@/components/cta-block"
import { Faq } from "@/components/faq"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"
import { WhatsAppButton } from "@/components/whatsapp-button"
import { PageViewTracker } from "@/components/page-view-tracker"
import { fetchPublishedContentBlockByIdentifier } from "@/lib/public/content-blocks"

export const dynamic = "force-dynamic"

export default async function Home() {
  const [heroBlock, aboutBlock, ctaBlock] = await Promise.all([
    fetchPublishedContentBlockByIdentifier("hero"),
    fetchPublishedContentBlockByIdentifier("about"),
    fetchPublishedContentBlockByIdentifier("cta"),
  ])

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <PageViewTracker path="/" />
      <Header />
      <Hero content={heroBlock?.content as Record<string, string> | undefined} />
      <Services />
      <Projects />
      <Testimonials />
      <About content={aboutBlock?.content as Record<string, string> | undefined} />
      <CtaBlock content={ctaBlock?.content as Record<string, string> | undefined} />
      <Faq />
      <Contact />
      <Footer />
      <WhatsAppButton />
    </main>
  )
}

