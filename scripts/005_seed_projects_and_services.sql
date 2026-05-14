-- =============================================
-- OLBROX TECH - Seed real projects & services
-- Inserts the current production portfolio + services
-- so they appear on the public site and are editable
-- from the admin panel. Safe to re-run (ON CONFLICT).
-- =============================================

-- Ensure projects.title is unique so upsert can target it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_title_unique'
  ) THEN
    BEGIN
      ALTER TABLE public.projects ADD CONSTRAINT projects_title_unique UNIQUE (title);
    EXCEPTION WHEN duplicate_table THEN NULL;
    END;
  END IF;
END $$;

-- 1. Projects (Olbrox Tech portfolio)
INSERT INTO public.projects
  (title, description_es, description_en, description_pt, image_url, project_url, tags, gradient, is_featured, is_published, display_order)
VALUES
  (
    'Mana Cacao',
    'Plataforma digital para marca premium de cacao ecuatoriano con catálogo, historia y experiencia inmersiva.',
    'Digital platform for a premium Ecuadorian cacao brand with catalog, story and immersive experience.',
    'Plataforma digital para marca premium de cacau equatoriano com catálogo, história e experiência imersiva.',
    '/images/projects/mana-cacao.png',
    'https://manacacao.com',
    ARRAY['Next.js','E-commerce','Branding','i18n'],
    'from-amber-500 to-orange-600',
    true,
    true,
    1
  ),
  (
    'SPA Talleres',
    'Sistema web para taller mecánico: gestión de clientes, órdenes de servicio, inventario y facturación.',
    'Web system for auto repair shops: customer management, work orders, inventory and billing.',
    'Sistema web para oficina mecânica: gestão de clientes, ordens de serviço, estoque e faturamento.',
    '/images/projects/spa-talleres.png',
    'https://spatalleres.com',
    ARRAY['Next.js','Supabase','Dashboard','SaaS'],
    'from-blue-500 to-cyan-600',
    true,
    true,
    2
  ),
  (
    'Hack Evans',
    'Sitio corporativo y landing para consultora tecnológica, optimizado en performance y SEO.',
    'Corporate site and landing for a tech consultancy, optimized for performance and SEO.',
    'Site corporativo e landing para consultoría de tecnología, otimizado em performance e SEO.',
    '/images/projects/hack-evans.jpg',
    'https://hackevans.com',
    ARRAY['Landing','Next.js','SEO','Motion'],
    'from-violet-500 to-fuchsia-600',
    false,
    true,
    3
  )
ON CONFLICT (title) DO UPDATE SET
  description_es = EXCLUDED.description_es,
  description_en = EXCLUDED.description_en,
  description_pt = EXCLUDED.description_pt,
  image_url      = EXCLUDED.image_url,
  project_url    = EXCLUDED.project_url,
  tags           = EXCLUDED.tags,
  gradient       = EXCLUDED.gradient,
  is_featured    = EXCLUDED.is_featured,
  is_published   = EXCLUDED.is_published,
  display_order  = EXCLUDED.display_order,
  updated_at     = NOW();

-- 2. Services — match the 6 services in the i18n dictionary
-- Ensure unique name_es so upsert targets existing rows cleanly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_name_es_unique'
  ) THEN
    BEGIN
      ALTER TABLE public.services ADD CONSTRAINT services_name_es_unique UNIQUE (name_es);
    EXCEPTION WHEN duplicate_table THEN NULL;
    END;
  END IF;
END $$;

INSERT INTO public.services
  (name_es, name_en, name_pt, description_es, description_en, description_pt, icon, is_featured, is_published, display_order)
VALUES
  ('Sistemas Web',      'Web Systems',       'Sistemas Web',
   'Plataformas web robustas y escalables para tu negocio.',
   'Robust and scalable web platforms for your business.',
   'Plataformas web robustas e escaláveis para seu negócio.',
   'globe',        true,  true, 1),
  ('Apps Móviles',      'Mobile Apps',       'Apps Móveis',
   'Aplicaciones nativas y multiplataforma iOS y Android.',
   'Native and cross-platform iOS and Android apps.',
   'Aplicativos nativos e multiplataforma iOS e Android.',
   'smartphone',   true,  true, 2),
  ('Automatización',    'Automation',        'Automação',
   'Optimiza procesos con automatizaciones inteligentes.',
   'Optimize processes with smart automations.',
   'Otimize processos com automações inteligentes.',
   'code',         false, true, 3),
  ('Software a Medida', 'Custom Software',   'Software Sob Medida',
   'Soluciones personalizadas para necesidades únicas.',
   'Customized solutions for unique needs.',
   'Soluções personalizadas para necessidades únicas.',
   'database',     false, true, 4),
  ('E-Commerce',        'E-Commerce',        'E-Commerce',
   'Tiendas online completas con pasarelas de pago.',
   'Complete online stores with payment gateways.',
   'Lojas online completas com gateways de pagamento.',
   'shopping-cart',true,  true, 5),
  ('Integración IA',    'AI Integration',    'Integração IA',
   'Potencia tu negocio con inteligencia artificial.',
   'Power your business with artificial intelligence.',
   'Potencialize seu negócio com inteligência artificial.',
   'brain',        true,  true, 6)
ON CONFLICT (name_es) DO UPDATE SET
  name_en         = EXCLUDED.name_en,
  name_pt         = EXCLUDED.name_pt,
  description_es  = EXCLUDED.description_es,
  description_en  = EXCLUDED.description_en,
  description_pt  = EXCLUDED.description_pt,
  icon            = EXCLUDED.icon,
  is_featured     = EXCLUDED.is_featured,
  is_published    = EXCLUDED.is_published,
  display_order   = EXCLUDED.display_order;
