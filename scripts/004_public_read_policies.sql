-- =============================================
-- OLBROX TECH - Public read policies for SSR metadata
-- Run this after 003 to allow the public site to
-- read SEO, settings, content blocks without auth.
-- =============================================

-- page_seo: allow anon + public to read SEO for any page
DROP POLICY IF EXISTS "page_seo_select_public" ON public.page_seo;
CREATE POLICY "page_seo_select_public"
  ON public.page_seo FOR SELECT
  USING (true);

-- website_settings: allow anon to read (settings are public by nature)
DROP POLICY IF EXISTS "website_settings_select_public" ON public.website_settings;
CREATE POLICY "website_settings_select_public"
  ON public.website_settings FOR SELECT
  USING (true);

-- content_blocks already has a public select for published blocks; ensure policy present
DROP POLICY IF EXISTS "content_blocks_select_public_all" ON public.content_blocks;
CREATE POLICY "content_blocks_select_public_all"
  ON public.content_blocks FOR SELECT
  USING (is_published = true);

-- legal_docs: allow anon to read published docs (so /privacy, /terms render)
DROP POLICY IF EXISTS "legal_docs_select_public" ON public.legal_docs;
CREATE POLICY "legal_docs_select_public"
  ON public.legal_docs FOR SELECT
  USING (is_published = true);

-- Seed a default SEO row for the home page
INSERT INTO public.page_seo (page_identifier, page_name, meta_title_es, meta_description_es, keywords, og_image)
VALUES (
  'home',
  'Inicio',
  'Olbrox Tech | Desarrollo de Software Profesional',
  'Empresa de desarrollo de software especializada en sistemas web, apps móviles, automatización y soluciones tecnológicas innovadoras.',
  ARRAY['desarrollo de software','aplicaciones web','apps móviles','automatización','Ecuador'],
  '/images/olbrox-logo.png'
)
ON CONFLICT (page_identifier) DO NOTHING;
