-- =============================================
-- OLBROX TECH - Enterprise Admin Expansion v3
-- Adds: Emails (Gmail), Customers (CRM), Follow-ups, Meetings,
--       User Roles, Legal Docs, Form Submissions, Campaigns,
--       Automations, Backups and Dashboard helpers.
-- =============================================

-- 18. Emails Inbox (Gmail integration + manual)
CREATE TABLE IF NOT EXISTS public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT UNIQUE,
  thread_id TEXT,
  from_name TEXT,
  from_email TEXT NOT NULL,
  to_email TEXT,
  subject TEXT,
  snippet TEXT,
  body_text TEXT,
  body_html TEXT,
  labels TEXT[],
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_replied BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_id UUID,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emails_select" ON public.emails FOR SELECT TO authenticated USING (true);
CREATE POLICY "emails_insert" ON public.emails FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "emails_update" ON public.emails FOR UPDATE TO authenticated USING (true);
CREATE POLICY "emails_delete" ON public.emails FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_emails_received ON public.emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_read ON public.emails(is_read);
CREATE INDEX IF NOT EXISTS idx_emails_lead ON public.emails(lead_id);

-- 19. Customers (prospectos convertidos)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  position TEXT,
  country TEXT,
  city TEXT,
  website TEXT,
  customer_type TEXT DEFAULT 'client' CHECK (customer_type IN ('prospect','client','vip','partner')),
  lifetime_value DECIMAL(12,2) DEFAULT 0,
  total_projects INTEGER DEFAULT 0,
  last_contact_at TIMESTAMPTZ,
  notes TEXT,
  tags TEXT[],
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "customers_insert" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "customers_update" ON public.customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "customers_delete" ON public.customers FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_customers_type ON public.customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- 20. Follow-ups (seguimientos comerciales)
CREATE TABLE IF NOT EXISTS public.followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  followup_type TEXT DEFAULT 'call' CHECK (followup_type IN ('call','email','whatsapp','meeting','task','other')),
  due_date TIMESTAMPTZ NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled','overdue')),
  assigned_to UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  result TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "followups_select" ON public.followups FOR SELECT TO authenticated USING (true);
CREATE POLICY "followups_insert" ON public.followups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "followups_update" ON public.followups FOR UPDATE TO authenticated USING (true);
CREATE POLICY "followups_delete" ON public.followups FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_followups_due ON public.followups(due_date);
CREATE INDEX IF NOT EXISTS idx_followups_status ON public.followups(status);

-- 21. Meetings (agenda / reuniones)
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  attendee_name TEXT,
  attendee_email TEXT,
  attendee_phone TEXT,
  meeting_link TEXT,
  location TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','completed','cancelled','no_show')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meetings_select" ON public.meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "meetings_insert" ON public.meetings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "meetings_update" ON public.meetings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "meetings_delete" ON public.meetings FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_meetings_scheduled ON public.meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings(status);

-- 22. User Roles (explicit multi-role model that extends admin_profiles)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin','admin','editor','sales','marketing','support','viewer')),
  permissions JSONB DEFAULT '{}',
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_roles_insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "user_roles_update" ON public.user_roles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "user_roles_delete" ON public.user_roles FOR DELETE TO authenticated USING (true);

-- 23. Legal Documents (privacidad, términos, cookies)
CREATE TABLE IF NOT EXISTS public.legal_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_key TEXT UNIQUE NOT NULL,
  title_es TEXT NOT NULL,
  title_en TEXT,
  title_pt TEXT,
  content_es TEXT,
  content_en TEXT,
  content_pt TEXT,
  version TEXT DEFAULT '1.0',
  is_published BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.legal_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "legal_docs_select_public" ON public.legal_docs FOR SELECT USING (is_published = true);
CREATE POLICY "legal_docs_select_admin" ON public.legal_docs FOR SELECT TO authenticated USING (true);
CREATE POLICY "legal_docs_insert" ON public.legal_docs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "legal_docs_update" ON public.legal_docs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "legal_docs_delete" ON public.legal_docs FOR DELETE TO authenticated USING (true);

INSERT INTO public.legal_docs (doc_key, title_es, title_en, content_es) VALUES
  ('privacy', 'Política de Privacidad', 'Privacy Policy', 'En Olbrox Tech respetamos tu privacidad...'),
  ('terms', 'Términos y Condiciones', 'Terms and Conditions', 'Al utilizar nuestros servicios aceptas estos términos...'),
  ('cookies', 'Política de Cookies', 'Cookie Policy', 'Utilizamos cookies para mejorar tu experiencia...')
ON CONFLICT (doc_key) DO NOTHING;

-- 24. Form Submissions (bandeja de formularios)
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_name TEXT NOT NULL,
  page_path TEXT,
  payload JSONB NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  is_spam BOOLEAN DEFAULT false,
  is_handled BOOLEAN DEFAULT false,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_submissions_select" ON public.form_submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "form_submissions_insert" ON public.form_submissions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "form_submissions_update" ON public.form_submissions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "form_submissions_delete" ON public.form_submissions FOR DELETE TO authenticated USING (true);

-- 25. Campaigns (marketing)
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT DEFAULT 'email' CHECK (channel IN ('email','whatsapp','social','ads','sms','other')),
  budget DECIMAL(12,2) DEFAULT 0,
  spent DECIMAL(12,2) DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','paused','ended')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_select" ON public.campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "campaigns_insert" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "campaigns_update" ON public.campaigns FOR UPDATE TO authenticated USING (true);
CREATE POLICY "campaigns_delete" ON public.campaigns FOR DELETE TO authenticated USING (true);

-- 26. Automations (reglas internas)
CREATE TABLE IF NOT EXISTS public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN ('lead_created','form_submitted','quote_sent','quote_accepted','whatsapp_click','email_received','no_response','customer_converted','manual')),
  trigger_config JSONB DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  runs_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automations_select" ON public.automations FOR SELECT TO authenticated USING (true);
CREATE POLICY "automations_insert" ON public.automations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "automations_update" ON public.automations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "automations_delete" ON public.automations FOR DELETE TO authenticated USING (true);

-- 27. Backups (registro de respaldos)
CREATE TABLE IF NOT EXISTS public.backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_name TEXT NOT NULL,
  backup_type TEXT DEFAULT 'manual' CHECK (backup_type IN ('manual','scheduled','automatic')),
  tables_included TEXT[],
  file_url TEXT,
  file_size_bytes BIGINT DEFAULT 0,
  record_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('running','completed','failed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backups_select" ON public.backups FOR SELECT TO authenticated USING (true);
CREATE POLICY "backups_insert" ON public.backups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "backups_delete" ON public.backups FOR DELETE TO authenticated USING (true);

-- 28. WhatsApp Quick Reply Templates
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general','greeting','quotation','meeting','followup','closing','postsale')),
  message TEXT NOT NULL,
  variables TEXT[],
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wtemplates_select" ON public.whatsapp_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "wtemplates_insert" ON public.whatsapp_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "wtemplates_update" ON public.whatsapp_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "wtemplates_delete" ON public.whatsapp_templates FOR DELETE TO authenticated USING (true);

INSERT INTO public.whatsapp_templates (name, category, message) VALUES
  ('Saludo inicial', 'greeting', 'Hola {{nombre}}, gracias por contactar a Olbrox Tech. ¿En qué podemos ayudarte?'),
  ('Envío de cotización', 'quotation', 'Hola {{nombre}}, te comparto la cotización solicitada. Quedo atento a tus comentarios.'),
  ('Agendar reunión', 'meeting', 'Hola {{nombre}}, te propongo agendar una reunión para revisar tu proyecto. ¿Qué día te viene bien?'),
  ('Seguimiento', 'followup', 'Hola {{nombre}}, te escribo para dar seguimiento a tu consulta. ¿Sigues interesado?'),
  ('Cierre', 'closing', 'Gracias {{nombre}} por confiar en Olbrox Tech. Iniciamos el proyecto esta semana.'),
  ('Post-venta', 'postsale', 'Hola {{nombre}}, esperamos que estés disfrutando el resultado. ¿Hay algo más en lo que podamos apoyarte?')
ON CONFLICT DO NOTHING;

-- Helper: seed super_admin role trigger
CREATE OR REPLACE FUNCTION public.handle_new_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Grant admin role by default to each new auth user registered via admin sign up
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (new.id, 'admin', new.id)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_admin_role();
