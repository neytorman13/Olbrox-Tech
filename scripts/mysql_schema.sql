-- MySQL migration schema for the Olbrox project.
-- Convert PostgreSQL/Supabase schema to MySQL-compatible DDL.

CREATE DATABASE IF NOT EXISTS olbrox CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE olbrox;

-- Placeholder users table for auth references.
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  raw_user_meta_data JSON,
  password_hash VARCHAR(128),
  role ENUM('super_admin','admin','editor','user') NOT NULL DEFAULT 'admin',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token CHAR(36) NOT NULL UNIQUE,
  expires_at DATETIME(6) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_profiles (
  id CHAR(36) NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role ENUM('admin','super_admin','editor') NOT NULL DEFAULT 'admin',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_admin_profiles_user FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS website_settings (
  id CHAR(36) NOT NULL PRIMARY KEY,
  setting_key TEXT NOT NULL,
  setting_value JSON NOT NULL,
  updated_by CHAR(36),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uk_website_settings_key (setting_key(191)),
  CONSTRAINT fk_website_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS page_seo (
  id CHAR(36) NOT NULL PRIMARY KEY,
  page_identifier TEXT UNIQUE NOT NULL,
  page_name TEXT NOT NULL,
  meta_title_es TEXT,
  meta_title_en TEXT,
  meta_title_pt TEXT,
  meta_description_es TEXT,
  meta_description_en TEXT,
  meta_description_pt TEXT,
  og_image TEXT,
  keywords JSON,
  canonical_url TEXT,
  no_index BOOLEAN DEFAULT FALSE,
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS page_analytics (
  id CHAR(36) NOT NULL PRIMARY KEY,
  page_path TEXT NOT NULL,
  visitor_ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  city TEXT,
  device_type ENUM('desktop','mobile','tablet'),
  browser TEXT,
  os TEXT,
  session_id TEXT,
  visit_duration INT DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leads (
  id CHAR(36) NOT NULL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT,
  source VARCHAR(50) NOT NULL DEFAULT 'website',
  status ENUM('new','contacted','qualified','proposal','won','lost') NOT NULL DEFAULT 'new',
  assigned_to CHAR(36),
  notes TEXT,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_leads_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
  id CHAR(36) NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  description_es TEXT,
  description_en TEXT,
  description_pt TEXT,
  image_url TEXT,
  project_url TEXT,
  tags JSON,
  gradient TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS services (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name_es TEXT NOT NULL,
  name_en TEXT,
  name_pt TEXT,
  title_es TEXT,
  title_en TEXT,
  title_pt TEXT,
  description_es TEXT,
  description_en TEXT,
  description_pt TEXT,
  icon TEXT,
  features JSON,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  slug VARCHAR(191),
  hero_title TEXT,
  hero_description TEXT,
  detail_content LONGTEXT,
  process_steps JSON,
  deliverables JSON,
  use_cases JSON,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS testimonials (
  id CHAR(36) NOT NULL PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_company TEXT,
  client_position TEXT,
  client_avatar TEXT,
  content_es TEXT NOT NULL,
  content_en TEXT,
  content_pt TEXT,
  rating INT NOT NULL DEFAULT 5,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_posts (
  id CHAR(36) NOT NULL PRIMARY KEY,
  slug TEXT NOT NULL,
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
  author_id CHAR(36),
  category TEXT,
  tags JSON,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at DATETIME(6),
  views INT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uk_blog_posts_slug (slug(191)),
  CONSTRAINT fk_blog_posts_author FOREIGN KEY (author_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_blocks (
  id CHAR(36) NOT NULL PRIMARY KEY,
  block_identifier TEXT NOT NULL,
  block_name TEXT NOT NULL,
  block_type ENUM('hero','text','cta','stats','features','custom') NOT NULL DEFAULT 'text',
  content JSON NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by CHAR(36),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uk_content_blocks_identifier (block_identifier(191)),
  CONSTRAINT fk_content_blocks_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS faq (
  id CHAR(36) NOT NULL PRIMARY KEY,
  question_es TEXT NOT NULL,
  question_en TEXT,
  question_pt TEXT,
  answer_es TEXT NOT NULL,
  answer_en TEXT,
  answer_pt TEXT,
  category TEXT,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media (
  id CHAR(36) NOT NULL PRIMARY KEY,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT,
  file_size INT,
  alt_text TEXT,
  caption TEXT,
  folder VARCHAR(100) NOT NULL DEFAULT 'general',
  uploaded_by CHAR(36),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_media_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36),
  title TEXT NOT NULL,
  message TEXT,
  type ENUM('info','success','warning','error') NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quotations (
  id CHAR(36) NOT NULL PRIMARY KEY,
  quote_number TEXT NOT NULL,
  lead_id CHAR(36),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_company TEXT,
  project_title TEXT NOT NULL,
  project_description TEXT,
  items JSON NOT NULL DEFAULT '[]',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  status ENUM('draft','sent','viewed','accepted','rejected','expired') NOT NULL DEFAULT 'draft',
  valid_until DATE,
  notes TEXT,
  terms TEXT,
  created_by CHAR(36),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uk_quotations_quote_number (quote_number(191)),
  CONSTRAINT fk_quotations_lead FOREIGN KEY (lead_id) REFERENCES leads(id),
  CONSTRAINT fk_quotations_created_by FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_settings (
  id CHAR(36) NOT NULL PRIMARY KEY,
  page_path TEXT NOT NULL,
  title_es TEXT,
  title_en TEXT,
  title_pt TEXT,
  description_es TEXT,
  description_en TEXT,
  description_pt TEXT,
  keywords JSON,
  og_image TEXT,
  canonical_url TEXT,
  no_index BOOLEAN NOT NULL DEFAULT FALSE,
  no_follow BOOLEAN NOT NULL DEFAULT FALSE,
  structured_data JSON,
  updated_by CHAR(36),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uk_seo_settings_page_path (page_path(191)),
  CONSTRAINT fk_seo_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id CHAR(36) NOT NULL PRIMARY KEY,
  lead_id CHAR(36),
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  initial_message TEXT,
  source_page TEXT,
  source_button TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  user_agent TEXT,
  status ENUM('initiated','responded','converted','closed') NOT NULL DEFAULT 'initiated',
  notes TEXT,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS whatsapp_analytics (
  id CHAR(36) NOT NULL PRIMARY KEY,
  phone_number TEXT,
  message_type ENUM('click','conversion','inquiry') NOT NULL DEFAULT 'click',
  source_page TEXT,
  referrer TEXT,
  user_agent TEXT,
  device_type ENUM('desktop','mobile','tablet'),
  country TEXT,
  city TEXT,
  session_id TEXT,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_log (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id CHAR(36),
  details JSON,
  ip_address TEXT,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_activity_log_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS emails (
  id CHAR(36) NOT NULL PRIMARY KEY,
  message_id TEXT UNIQUE,
  thread_id TEXT,
  from_name TEXT,
  from_email TEXT NOT NULL,
  to_email TEXT,
  subject TEXT,
  snippet TEXT,
  body_text TEXT,
  body_html TEXT,
  labels JSON,
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_replied BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  lead_id CHAR(36),
  customer_id CHAR(36),
  received_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_emails_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
  INDEX idx_emails_received (received_at),
  INDEX idx_emails_read (is_read),
  INDEX idx_emails_lead (lead_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customers (
  id CHAR(36) NOT NULL PRIMARY KEY,
  lead_id CHAR(36),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  position TEXT,
  country TEXT,
  city TEXT,
  website TEXT,
  customer_type ENUM('prospect','client','vip','partner') DEFAULT 'client',
  lifetime_value DECIMAL(12,2) DEFAULT 0,
  total_projects INT DEFAULT 0,
  last_contact_at DATETIME(6),
  notes TEXT,
  tags JSON,
  assigned_to CHAR(36),
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_customers_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
  INDEX idx_customers_type (customer_type),
  INDEX idx_customers_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS followups (
  id CHAR(36) NOT NULL PRIMARY KEY,
  lead_id CHAR(36),
  customer_id CHAR(36),
  title TEXT NOT NULL,
  description TEXT,
  followup_type ENUM('call','email','whatsapp','meeting','task','other') DEFAULT 'call',
  due_date DATETIME(6) NOT NULL,
  priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
  status ENUM('pending','in_progress','completed','cancelled','overdue') DEFAULT 'pending',
  assigned_to CHAR(36),
  completed_at DATETIME(6),
  result TEXT,
  created_by CHAR(36),
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_followups_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  INDEX idx_followups_due (due_date),
  INDEX idx_followups_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS meetings (
  id CHAR(36) NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  lead_id CHAR(36),
  customer_id CHAR(36),
  attendee_name TEXT,
  attendee_email TEXT,
  attendee_phone TEXT,
  meeting_link TEXT,
  location TEXT,
  scheduled_at DATETIME(6) NOT NULL,
  duration_minutes INT DEFAULT 30,
  status ENUM('scheduled','confirmed','completed','cancelled','no_show') DEFAULT 'scheduled',
  notes TEXT,
  created_by CHAR(36),
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_meetings_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
  INDEX idx_meetings_scheduled (scheduled_at),
  INDEX idx_meetings_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roles (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  role ENUM('super_admin','admin','editor','sales','marketing','support','viewer') NOT NULL,
  permissions JSON DEFAULT '{}',
  granted_by CHAR(36),
  granted_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  revoked_at DATETIME(6),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE KEY uk_user_roles_user_role (user_id, role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS legal_docs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  doc_key TEXT UNIQUE NOT NULL,
  title_es TEXT NOT NULL,
  title_en TEXT,
  title_pt TEXT,
  content_es TEXT,
  content_en TEXT,
  content_pt TEXT,
  version TEXT DEFAULT '1.0',
  is_published BOOLEAN DEFAULT TRUE,
  updated_by CHAR(36),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS form_submissions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  form_name TEXT NOT NULL,
  page_path TEXT,
  payload JSON NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  is_spam BOOLEAN DEFAULT FALSE,
  is_handled BOOLEAN DEFAULT FALSE,
  lead_id CHAR(36),
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_form_submissions_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS campaigns (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  channel ENUM('email','whatsapp','social','ads','sms','other') DEFAULT 'email',
  budget DECIMAL(12,2) DEFAULT 0,
  spent DECIMAL(12,2) DEFAULT 0,
  leads_generated INT DEFAULT 0,
  conversions INT DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  starts_at DATETIME(6),
  ends_at DATETIME(6),
  status ENUM('draft','active','paused','ended') DEFAULT 'draft',
  created_by CHAR(36),
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS automations (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT,
  action TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS backups (
  id CHAR(36) NOT NULL PRIMARY KEY,
  table_name TEXT NOT NULL,
  backup_path TEXT NOT NULL,
  backup_url TEXT,
  status ENUM('pending','completed','failed') DEFAULT 'pending',
  started_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  completed_at DATETIME(6),
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_categories (
  id CHAR(36) NOT NULL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_es TEXT NOT NULL,
  name_en TEXT,
  name_pt TEXT,
  description_es TEXT,
  description_en TEXT,
  description_pt TEXT,
  display_order INT DEFAULT 0,
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO users (id, email, full_name, password_hash, role, created_at, updated_at)
VALUES (
  UUID(),
  'admin@olbrox.tech',
  'Administrador',
  'ad89b64d66caa8e30e5d5ce4a9763f4ecc205814c412175f3e2c50027471426d',
  'super_admin',
  NOW(),
  NOW()
);

CREATE INDEX idx_page_analytics_created_at ON page_analytics(created_at);
CREATE INDEX idx_page_analytics_page_path ON page_analytics(page_path(191));
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_blog_posts_published ON blog_posts(is_published, published_at);
CREATE INDEX idx_activity_log_user ON activity_log(user_id, created_at);
