-- Script de Datos de Prueba para Olbrox Tech
-- Ejecutar después del schema principal

USE olbrox;

-- Datos de prueba: Servicios
INSERT INTO services (id, name_es, name_en, name_pt, description_es, description_en, description_pt, icon, is_published, display_order, created_at, updated_at) VALUES
(UUID(), 'Desarrollo Web', 'Web Development', 'Desenvolvimento Web', 'Creamos aplicaciones web modernas con tecnologías actuales', 'We create modern web applications with current technologies', 'Criamos aplicações web modernas com tecnologias atuais', 'globe', 1, 1, NOW(), NOW()),
(UUID(), 'Aplicaciones Móviles', 'Mobile Apps', 'Aplicativos Móveis', 'Desarrollo nativo e híbrido para iOS y Android', 'Native and hybrid development for iOS and Android', 'Desenvolvimento nativo e híbrido para iOS e Android', 'smartphone', 1, 2, NOW(), NOW()),
(UUID(), 'Automatización', 'Automation', 'Automação', 'Automatiza procesos comerciales para aumentar eficiencia', 'Automate business processes to increase efficiency', 'Automatiza processos comerciais para aumentar eficiência', 'cog', 1, 3, NOW(), NOW()),
(UUID(), 'Soluciones AI', 'AI Solutions', 'Soluções IA', 'Implementa inteligencia artificial en tus proyectos', 'Implement artificial intelligence in your projects', 'Implemente inteligência artificial em seus projetos', 'brain', 1, 4, NOW(), NOW());

-- Datos de prueba: Proyectos
INSERT INTO projects (id, title, description_es, description_en, description_pt, image_url, project_url, tags, gradient, is_featured, is_published, display_order, created_at, updated_at) VALUES
(UUID(), 'E-commerce Avanzado', 'Plataforma de e-commerce con integraciones de pago', 'Advanced e-commerce platform with payment integrations', 'Plataforma de e-commerce avançada com integrações de pagamento', '/images/project-1.jpg', 'https://example.com', '["ecommerce", "react", "nodejs"]', 'from-blue-500 to-cyan-500', 1, 1, 1, NOW(), NOW()),
(UUID(), 'Dashboard Analítico', 'Sistema de análisis de datos en tiempo real', 'Real-time data analysis system', 'Sistema de análise de dados em tempo real', '/images/project-2.jpg', 'https://example.com', '["dashboard", "analytics", "typescript"]', 'from-purple-500 to-pink-500', 1, 1, 2, NOW(), NOW()),
(UUID(), 'App Móvil de Productividad', 'Aplicación móvil para gestión de tareas', 'Mobile task management application', 'Aplicativo móvel para gerenciamento de tarefas', '/images/project-3.jpg', 'https://example.com', '["mobile", "react-native", "firebase"]', 'from-green-500 to-teal-500', 0, 1, 3, NOW(), NOW());

-- Datos de prueba: Testimonios
INSERT INTO testimonials (id, client_name, client_company, client_position, client_avatar, content_es, content_en, content_pt, rating, is_published, display_order, created_at) VALUES
(UUID(), 'Juan García', 'Tech Startup XYZ', 'CEO', '/images/avatar-1.jpg', 'Olbrox Tech transformó completamente nuestra visión en una plataforma escalable. Excelente equipo.', 'Olbrox Tech completely transformed our vision into a scalable platform. Excellent team.', 'Olbrox Tech transformou completamente nossa visão em uma plataforma escalável. Excelente equipe.', 5, 1, 1, NOW()),
(UUID(), 'María López', 'E-commerce Solutions', 'Product Manager', '/images/avatar-2.jpg', 'La calidad del código y el soporte post-implementación fueron excepcionales. Muy recomendados.', 'Code quality and post-implementation support were exceptional. Highly recommended.', 'A qualidade do código e o suporte pós-implementação foram excepcionais. Altamente recomendado.', 5, 1, 2, NOW()),
(UUID(), 'Carlos Rodríguez', 'Marketing Digital Pro', 'Director', '/images/avatar-3.jpg', 'Profesionales que entienden el negocio, no solo la tecnología. Entrega a tiempo y presupuesto.', 'Professionals who understand business, not just technology. On-time and on-budget delivery.', 'Profissionais que entendem negócios, não apenas tecnologia. Entrega no prazo e no orçamento.', 5, 1, 3, NOW());

-- Datos de prueba: FAQ
INSERT INTO faq (id, question_es, question_en, question_pt, answer_es, answer_en, answer_pt, category, is_published, display_order, created_at, updated_at) VALUES
(UUID(), '¿Cuál es el tiempo de desarrollo promedio?', 'What is the average development time?', 'Qual é o tempo médio de desenvolvimento?', 'Depende de la complejidad del proyecto. Proyectos pequeños: 2-4 semanas. Medianos: 4-8 semanas. Grandes: 8+ semanas.', 'It depends on project complexity. Small projects: 2-4 weeks. Medium: 4-8 weeks. Large: 8+ weeks.', 'Depende da complexidade do projeto. Projetos pequenos: 2-4 semanas. Médios: 4-8 semanas. Grandes: 8+ semanas.', 'Desarrollo', 1, 1, NOW(), NOW()),
(UUID(), '¿Ofrecen soporte post-lanzamiento?', 'Do you offer post-launch support?', 'Vocês oferecem suporte pós-lançamento?', 'Sí, ofrecemos paquetes de mantenimiento y soporte de 3 a 12 meses según necesidad.', 'Yes, we offer maintenance and support packages from 3 to 12 months based on needs.', 'Sim, oferecemos pacotes de manutenção e suporte de 3 a 12 meses conforme a necessidade.', 'Soporte', 1, 2, NOW(), NOW()),
(UUID(), '¿Qué tecnologías utilizan?', 'What technologies do you use?', 'Quais tecnologias vocês usam?', 'Utilizamos React, Node.js, TypeScript, MySQL, AWS y otras según lo requiera el proyecto.', 'We use React, Node.js, TypeScript, MySQL, AWS and others as required by the project.', 'Usamos React, Node.js, TypeScript, MySQL, AWS e outros conforme exigido pelo projeto.', 'Tecnología', 1, 3, NOW(), NOW());

-- Datos de prueba: Configuración de sitio
INSERT INTO website_settings (id, setting_key, setting_value, updated_at) VALUES
(UUID(), 'site_name', '"Olbrox Tech"', NOW()),
(UUID(), 'site_tagline', '"Desarrollo de Software Profesional"', NOW()),
(UUID(), 'contact_email', '"contact@olbrox.tech"', NOW()),
(UUID(), 'contact_phone', '"+593 985 532 437"', NOW()),
(UUID(), 'whatsapp_number', '"593985532437"', NOW()),
(UUID(), 'address', '"Ecuador - Worldwide"', NOW()),
(UUID(), 'business_hours', '"Lunes a Viernes: 9:00 - 18:00 (ECT)"', NOW()),
(UUID(), 'social_facebook', '"https://facebook.com/olbroxtech"', NOW()),
(UUID(), 'social_instagram', '"https://instagram.com/olbroxtech"', NOW()),
(UUID(), 'social_linkedin', '"https://linkedin.com/company/olbroxtech"', NOW()),
(UUID(), 'social_github', '"https://github.com/olbroxtech"', NOW());

-- Datos de prueba: SEO por página
INSERT INTO page_seo (id, page_identifier, page_path, meta_title_es, meta_description_es, keywords, og_image, canonical_url, no_index, no_follow, updated_at) VALUES
(UUID(), 'home', '/', 'Olbrox Tech | Desarrollo de Software Profesional', 'Empresa especializada en desarrollo web, aplicaciones móviles, automatización e inteligencia artificial', '["desarrollo software", "apps móviles", "automatización", "ecuad"]', '/images/og-home.jpg', 'https://olbrox.tech/', 0, 0, NOW()),
(UUID(), 'services', '/servicios', 'Servicios de Desarrollo de Software | Olbrox Tech', 'Descubre nuestros servicios: desarrollo web, apps, automatización, AI y soluciones personalizadas', '["servicios software", "desarrollo web", "aplicaciones"]', '/images/og-services.jpg', 'https://olbrox.tech/servicios', 0, 0, NOW()),
(UUID(), 'projects', '/proyectos', 'Portafolio de Proyectos | Olbrox Tech', 'Explora nuestros proyectos exitosos en desarrollo web, mobile y automatización', '["portafolio", "proyectos", "casos de éxito"]', '/images/og-projects.jpg', 'https://olbrox.tech/proyectos', 0, 0, NOW());

-- Datos de prueba: Leads (para testing)
INSERT INTO leads (id, full_name, email, phone, company, message, source, status, notes, created_at, updated_at) VALUES
(UUID(), 'Test Lead 1', 'lead1@example.com', '+593 999 000 001', 'Company A', 'Interesado en desarrollo web', 'website', 'new', 'Lead de prueba', NOW(), NOW()),
(UUID(), 'Test Lead 2', 'lead2@example.com', '+593 999 000 002', 'Company B', 'Requiere app móvil', 'contact-form', 'contacted', 'Lead de prueba', NOW(), NOW());

-- Datos de prueba: Blog (opcional)
INSERT INTO blog_posts (id, slug, title_es, title_en, content_es, content_en, excerpt_es, excerpt_en, is_published, author_id, category, tags, views, published_at, created_at, updated_at) VALUES
(UUID(), 'introduccion-mysql', 'Introducción a MySQL', 'Introduction to MySQL', '<p>Contenido del artículo...</p>', '<p>Article content...</p>', 'Aprende los conceptos básicos de MySQL', 'Learn MySQL basics', 1, NULL, 'Bases de Datos', '["mysql", "database", "sql"]', 0, NOW(), NOW(), NOW());

-- Datos de prueba: Bloques de Contenido
INSERT INTO content_blocks (id, block_identifier, block_name, block_type, content_es, content_en, metadata, is_published, created_at, updated_at) VALUES
(UUID(), 'hero-section', 'Sección Hero', 'json', '{"title": "Bienvenido", "subtitle": "Desarrollamos tu futuro digital"}', '{"title": "Welcome", "subtitle": "We develop your digital future"}', '{}', 1, NOW(), NOW()),
(UUID(), 'cta-primary', 'Botón CTA Principal', 'text', 'Comienza tu proyecto hoy', 'Start your project today', '{}', 1, NOW(), NOW());

-- Verificación
SELECT COUNT(*) as total_servicios FROM services;
SELECT COUNT(*) as total_proyectos FROM projects;
SELECT COUNT(*) as total_testimonios FROM testimonials;
SELECT COUNT(*) as total_faqs FROM faq;
SELECT COUNT(*) as total_configuraciones FROM website_settings;

COMMIT;
