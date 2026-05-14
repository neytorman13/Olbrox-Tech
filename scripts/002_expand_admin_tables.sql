-- =============================================
-- OLBROX TECH - Expanded Admin Panel Schema
-- New tables for FAQ, Media, SEO, Content Blocks, WhatsApp
-- =============================================

-- 12. FAQ Table
CREATE TABLE IF NOT EXISTS public.faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_es TEXT NOT NULL,
  question_en TEXT,
  question_pt TEXT,
  answer_es TEXT NOT NULL,
  answer_en TEXT,
  answer_pt TEXT,
  category TEXT DEFAULT 'general',
  is_published BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faq_select_public" ON public.faq FOR SELECT USING (is_published = true);
CREATE POLICY "faq_select_admin" ON public.faq FOR SELECT TO authenticated USING (true);
CREATE POLICY "faq_insert" ON public.faq FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "faq_update" ON public.faq FOR UPDATE TO authenticated USING (true);
CREATE POLICY "faq_delete" ON public.faq FOR DELETE TO authenticated USING (true);

-- 13. Media Library Table
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  caption TEXT,
  folder TEXT DEFAULT 'general',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_select" ON public.media FOR SELECT TO authenticated USING (true);
CREATE POLICY "media_insert" ON public.media FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "media_update" ON public.media FOR UPDATE TO authenticated USING (true);
CREATE POLICY "media_delete" ON public.media FOR DELETE TO authenticated USING (true);

-- 14. Page SEO Settings Table
CREATE TABLE IF NOT EXISTS public.page_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_identifier TEXT UNIQUE NOT NULL,
  page_name TEXT NOT NULL,
  meta_title_es TEXT,
  meta_title_en TEXT,
  meta_title_pt TEXT,
  meta_description_es TEXT,
  meta_description_en TEXT,
  meta_description_pt TEXT,
  og_image TEXT,
  keywords TEXT[],
  canonical_url TEXT,
  no_index BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.page_seo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_seo_select" ON public.page_seo FOR SELECT TO authenticated USING (true);
CREATE POLICY "page_seo_insert" ON public.page_seo FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "page_seo_update" ON public.page_seo FOR UPDATE TO authenticated USING (true);
CREATE POLICY "page_seo_delete" ON public.page_seo FOR DELETE TO authenticated USING (true);

-- 15. Content Blocks Table (for dynamic page sections)
CREATE TABLE IF NOT EXISTS public.content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_identifier TEXT UNIQUE NOT NULL,
  block_name TEXT NOT NULL,
  block_type TEXT NOT NULL CHECK (block_type IN ('hero', 'text', 'cta', 'stats', 'features', 'custom')),
  content JSONB NOT NULL DEFAULT '{}',
  is_published BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_blocks_select_public" ON public.content_blocks FOR SELECT USING (is_published = true);
CREATE POLICY "content_blocks_select_admin" ON public.content_blocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "content_blocks_insert" ON public.content_blocks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "content_blocks_update" ON public.content_blocks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "content_blocks_delete" ON public.content_blocks FOR DELETE TO authenticated USING (true);

-- 16. WhatsApp Conversations Table
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id),
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  initial_message TEXT,
  source_page TEXT,
  source_button TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'responded', 'converted', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_select" ON public.whatsapp_conversations FOR SELECT TO authenticated USING (true);
CREATE POLICY "whatsapp_insert" ON public.whatsapp_conversations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "whatsapp_update" ON public.whatsapp_conversations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "whatsapp_delete" ON public.whatsapp_conversations FOR DELETE TO authenticated USING (true);

-- 17. Blog Categories Table
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_es TEXT NOT NULL,
  name_en TEXT,
  name_pt TEXT,
  description_es TEXT,
  description_en TEXT,
  description_pt TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_categories_select" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "blog_categories_insert" ON public.blog_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "blog_categories_update" ON public.blog_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "blog_categories_delete" ON public.blog_categories FOR DELETE TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_faq_category ON public.faq(category);
CREATE INDEX IF NOT EXISTS idx_faq_published ON public.faq(is_published);
CREATE INDEX IF NOT EXISTS idx_media_folder ON public.media(folder);
CREATE INDEX IF NOT EXISTS idx_media_file_type ON public.media(file_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_lead ON public.whatsapp_conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_created ON public.whatsapp_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_content_blocks_identifier ON public.content_blocks(block_identifier);

-- Insert default page SEO settings
INSERT INTO public.page_seo (page_identifier, page_name, meta_title_es, meta_title_en) VALUES
  ('home', 'Inicio', 'Olbrox Tech - Desarrollo de Software Profesional', 'Olbrox Tech - Professional Software Development'),
  ('services', 'Servicios', 'Servicios - Olbrox Tech', 'Services - Olbrox Tech'),
  ('projects', 'Proyectos', 'Proyectos - Olbrox Tech', 'Projects - Olbrox Tech'),
  ('about', 'Nosotros', 'Sobre Nosotros - Olbrox Tech', 'About Us - Olbrox Tech'),
  ('contact', 'Contacto', 'Contacto - Olbrox Tech', 'Contact - Olbrox Tech'),
  ('blog', 'Blog', 'Blog - Olbrox Tech', 'Blog - Olbrox Tech')
ON CONFLICT (page_identifier) DO NOTHING;

-- Insert default content blocks
INSERT INTO public.content_blocks (block_identifier, block_name, block_type, content) VALUES
  ('hero_main', 'Hero Principal', 'hero', '{"title_es": "Transformamos Ideas en Software", "title_en": "We Transform Ideas into Software", "subtitle_es": "Desarrollo web y móvil de alta calidad", "subtitle_en": "High-quality web and mobile development", "cta_text_es": "Contáctanos", "cta_text_en": "Contact Us", "cta_url": "#contact"}'),
  ('stats_section', 'Estadísticas', 'stats', '{"items": [{"value": "50+", "label_es": "Proyectos", "label_en": "Projects"}, {"value": "30+", "label_es": "Clientes", "label_en": "Clients"}, {"value": "5+", "label_es": "Años", "label_en": "Years"}]}'),
  ('cta_main', 'CTA Principal', 'cta', '{"title_es": "¿Listo para empezar?", "title_en": "Ready to get started?", "description_es": "Hablemos de tu proyecto", "description_en": "Let us talk about your project", "button_text_es": "Solicitar Cotización", "button_text_en": "Request a Quote", "button_url": "#contact"}')
ON CONFLICT (block_identifier) DO NOTHING;

-- Insert default blog categories
INSERT INTO public.blog_categories (slug, name_es, name_en, display_order) VALUES
  ('desarrollo-web', 'Desarrollo Web', 'Web Development', 1),
  ('desarrollo-movil', 'Desarrollo Móvil', 'Mobile Development', 2),
  ('tecnologia', 'Tecnología', 'Technology', 3),
  ('tutoriales', 'Tutoriales', 'Tutorials', 4),
  ('noticias', 'Noticias', 'News', 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert default FAQ items
INSERT INTO public.faq (question_es, question_en, answer_es, answer_en, category, display_order) VALUES
  ('¿Cuánto tiempo toma desarrollar un proyecto?', 'How long does it take to develop a project?', 'El tiempo varía según la complejidad. Un sitio web simple puede tomar 2-4 semanas, mientras que una aplicación compleja puede requerir 3-6 meses.', 'Time varies depending on complexity. A simple website can take 2-4 weeks, while a complex application may require 3-6 months.', 'general', 1),
  ('¿Qué tecnologías utilizan?', 'What technologies do you use?', 'Trabajamos con React, Next.js, Node.js, Python, PostgreSQL, y más. Elegimos la mejor tecnología según las necesidades de cada proyecto.', 'We work with React, Next.js, Node.js, Python, PostgreSQL, and more. We choose the best technology based on each project needs.', 'general', 2),
  ('¿Ofrecen mantenimiento después del desarrollo?', 'Do you offer maintenance after development?', 'Sí, ofrecemos planes de mantenimiento y soporte continuo para todos nuestros proyectos.', 'Yes, we offer maintenance and ongoing support plans for all our projects.', 'servicios', 3)
ON CONFLICT DO NOTHING;
