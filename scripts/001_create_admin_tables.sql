-- =============================================
-- OLBROX TECH - Admin Panel Database Schema
-- =============================================

-- 1. Admin Users Profile Table
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'editor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_profiles_select" ON public.admin_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "admin_profiles_update" ON public.admin_profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Website Settings Table
CREATE TABLE IF NOT EXISTS public.website_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "website_settings_select" ON public.website_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "website_settings_insert" ON public.website_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "website_settings_update" ON public.website_settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "website_settings_delete" ON public.website_settings FOR DELETE TO authenticated USING (true);

-- 3. Page Analytics Table
CREATE TABLE IF NOT EXISTS public.page_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  visitor_ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  browser TEXT,
  os TEXT,
  session_id TEXT,
  visit_duration INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.page_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_analytics_select" ON public.page_analytics FOR SELECT TO authenticated USING (true);
CREATE POLICY "page_analytics_insert" ON public.page_analytics FOR INSERT TO anon WITH CHECK (true);

-- 4. Leads/Contacts Table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  assigned_to UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_select" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "leads_insert" ON public.leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "leads_update" ON public.leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "leads_delete" ON public.leads FOR DELETE TO authenticated USING (true);

-- 5. Projects Table (for portfolio management)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description_es TEXT,
  description_en TEXT,
  description_pt TEXT,
  image_url TEXT,
  project_url TEXT,
  tags TEXT[],
  gradient TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_public" ON public.projects FOR SELECT USING (is_published = true);
CREATE POLICY "projects_select_admin" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "projects_update" ON public.projects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "projects_delete" ON public.projects FOR DELETE TO authenticated USING (true);

-- 6. Services Table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_es TEXT NOT NULL,
  title_en TEXT,
  title_pt TEXT,
  description_es TEXT,
  description_en TEXT,
  description_pt TEXT,
  icon TEXT,
  is_published BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_select_public" ON public.services FOR SELECT USING (is_published = true);
CREATE POLICY "services_select_admin" ON public.services FOR SELECT TO authenticated USING (true);
CREATE POLICY "services_insert" ON public.services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "services_update" ON public.services FOR UPDATE TO authenticated USING (true);
CREATE POLICY "services_delete" ON public.services FOR DELETE TO authenticated USING (true);

-- 7. Blog Posts Table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_es TEXT NOT NULL,
  title_en TEXT,
  title_pt TEXT,
  content_es TEXT,
  content_en TEXT,
  content_pt TEXT,
  excerpt_es TEXT,
  excerpt_en TEXT,
  excerpt_pt TEXT,
  featured_image TEXT,
  author_id UUID REFERENCES auth.users(id),
  category TEXT,
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_posts_select_public" ON public.blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "blog_posts_select_admin" ON public.blog_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "blog_posts_insert" ON public.blog_posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "blog_posts_update" ON public.blog_posts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "blog_posts_delete" ON public.blog_posts FOR DELETE TO authenticated USING (true);

-- 8. Testimonials Table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_company TEXT,
  client_position TEXT,
  client_avatar TEXT,
  content_es TEXT NOT NULL,
  content_en TEXT,
  content_pt TEXT,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  is_published BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "testimonials_select_public" ON public.testimonials FOR SELECT USING (is_published = true);
CREATE POLICY "testimonials_select_admin" ON public.testimonials FOR SELECT TO authenticated USING (true);
CREATE POLICY "testimonials_insert" ON public.testimonials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "testimonials_update" ON public.testimonials FOR UPDATE TO authenticated USING (true);
CREATE POLICY "testimonials_delete" ON public.testimonials FOR DELETE TO authenticated USING (true);

-- 9. Quotations/Proposals Table
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT UNIQUE NOT NULL,
  lead_id UUID REFERENCES public.leads(id),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_company TEXT,
  project_title TEXT NOT NULL,
  project_description TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
  valid_until DATE,
  notes TEXT,
  terms TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotations_select" ON public.quotations FOR SELECT TO authenticated USING (true);
CREATE POLICY "quotations_insert" ON public.quotations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "quotations_update" ON public.quotations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "quotations_delete" ON public.quotations FOR DELETE TO authenticated USING (true);

-- 10. Activity Log Table
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_log_select" ON public.activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "activity_log_insert" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create trigger for auto-creating admin profile
CREATE OR REPLACE FUNCTION public.handle_new_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;

CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_admin();

-- Insert default settings
INSERT INTO public.website_settings (setting_key, setting_value) VALUES
  ('site_name', '"Olbrox Tech"'),
  ('site_tagline', '"Desarrollo de Software Profesional"'),
  ('contact_email', '"info@olbroxtech.com"'),
  ('contact_phone', '"+593 99 999 9999"'),
  ('whatsapp_number', '"593999999999"'),
  ('social_facebook', '""'),
  ('social_instagram', '""'),
  ('social_linkedin', '""'),
  ('social_twitter', '""'),
  ('social_github', '""'),
  ('address', '"Ecuador"'),
  ('business_hours', '"Lunes a Viernes: 9:00 - 18:00"')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_analytics_created_at ON public.page_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_page_analytics_page_path ON public.page_analytics(page_path);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON public.activity_log(user_id, created_at);
