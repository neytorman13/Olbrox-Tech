export type DefaultContentBlock = {
  block_identifier: string
  block_name: string
  block_type: "hero" | "text" | "cta" | "stats" | "features" | "custom"
  content: Record<string, unknown>
  is_published: boolean
}

export type DefaultProjectRecord = {
  title: string
  description_es: string
  description_en: string
  description_pt: string
  image_url: string
  project_url: string
  tags: string[]
  gradient: string
  is_featured: boolean
  is_published: boolean
  display_order: number
}

export type DefaultServiceRecord = {
  name_es: string
  name_en: string
  name_pt: string
  description_es: string
  description_en: string
  description_pt: string
  icon: string
  features: string[]
  is_featured: boolean
  is_published: boolean
  display_order: number
  slug: string
  hero_title: string
  hero_description: string
  detail_content: string
  process_steps: string[]
  deliverables: string[]
  use_cases: string[]
}

export const defaultContentBlocks: DefaultContentBlock[] = [
  {
    block_identifier: "hero",
    block_name: "Hero Section",
    block_type: "hero",
    content: {
      title: "Soluciones Tecnologicas a tu medida",
      subtitle: "Disenamos y desarrollamos soluciones tecnologicas personalizadas para cada negocio o empresa.",
      cta_text: "Solicitar Cotizacion",
      cta_link: "#contacto",
      image_url: "/images/hero-bg.jpg",
      tagline: "Innovacion Tecnologica",
    },
    is_published: true,
  },
  {
    block_identifier: "about",
    block_name: "About Section",
    block_type: "text",
    content: {
      title: "Quienes Somos",
      description:
        "Somos un equipo especializado en desarrollo web, automatizacion, inteligencia artificial y experiencias digitales enfocadas en resultados reales para empresas.",
    },
    is_published: true,
  },
  {
    block_identifier: "cta",
    block_name: "Call To Action",
    block_type: "cta",
    content: {
      title: "Listo para impulsar tu proyecto?",
      description: "Convirtamos tu idea en una solucion digital clara, moderna y escalable.",
      subtitle: "Hablemos hoy mismo sobre tu negocio.",
      button_text: "Solicitar Cotizacion",
      button_link: "#contacto",
    },
    is_published: true,
  },
]

export const defaultProjects: DefaultProjectRecord[] = [
  {
    title: "Hack Evans",
    description_es:
      "Plataforma educativa #1 para docentes en Ecuador. Simuladores actualizados, evaluaciones personalizadas y seguimiento en tiempo real del progreso.",
    description_en:
      "Educational platform #1 for teachers in Ecuador. Updated simulators, personalized evaluations and real-time progress tracking.",
    description_pt:
      "Plataforma educacional #1 para professores no Equador. Simuladores atualizados, avaliacoes personalizadas e acompanhamento em tempo real.",
    image_url: "/images/projects/hack-evans.jpg",
    project_url: "https://hack-evans.netlify.app/",
    tags: ["Next.js", "Panel", "Educacion", "IA"],
    gradient: "from-red-500 to-orange-500",
    is_featured: true,
    is_published: true,
    display_order: 1,
  },
  {
    title: "ManaCacao - ASO PROCANAM",
    description_es:
      "Sistema web para la Asociacion de Produccion Agricola de Cacao Nacional La Mana. Gestion completa de socios, productos y comercializacion.",
    description_en:
      "Web system for the Agricultural Production Association of National Cacao La Mana. Complete management of partners, products and marketing.",
    description_pt:
      "Sistema web para a Associacao de Producao Agricola de Cacau Nacional La Mana. Gestao completa de socios, produtos e comercializacao.",
    image_url: "/images/projects/mana-cacao.png",
    project_url: "https://aso-procanam.vercel.app/",
    tags: ["Next.js", "Vercel", "Agricultura", "Gestion"],
    gradient: "from-green-500 to-emerald-500",
    is_featured: true,
    is_published: true,
    display_order: 2,
  },
  {
    title: "S.P.A. Talleres",
    description_es:
      "Plataforma web profesional para taller automotriz. Planchado y pintura al horno en Arequipa con acabado garantizado y resultados duraderos.",
    description_en:
      "Professional web platform for automotive workshop. Professional bodywork and paint in Arequipa with guaranteed finish and lasting results.",
    description_pt:
      "Plataforma web profissional para oficina automotiva. Funilaria e pintura profissional em Arequipa com acabamento garantido e resultados duradouros.",
    image_url: "/images/projects/spa-talleres.png",
    project_url: "https://spatalleres.netlify.app/",
    tags: ["React", "Sitio Web", "Automotriz", "UI/UX"],
    gradient: "from-lime-400 to-green-500",
    is_featured: true,
    is_published: true,
    display_order: 3,
  },
]

export const defaultServices: DefaultServiceRecord[] = [
  {
    name_es: "Desarrollo Web Corporativo",
    name_en: "Corporate Web Development",
    name_pt: "Desenvolvimento Web Corporativo",
    description_es: "Sitios web modernos, rapidos y orientados a conversion para empresas y marcas.",
    description_en: "Modern, fast websites built for conversion and business growth.",
    description_pt: "Sites modernos, rapidos e orientados para conversao e crescimento.",
    icon: "globe",
    features: ["Diseno responsive", "SEO tecnico", "Panel administrable"],
    is_featured: true,
    is_published: true,
    display_order: 1,
    slug: "desarrollo-web-corporativo",
    hero_title: "Desarrollo web corporativo para marcas que necesitan presencia, autoridad y conversion",
    hero_description:
      "Creamos sitios web profesionales con arquitectura clara, imagen premium y enfoque comercial para que tu empresa proyecte confianza desde el primer segundo.",
    detail_content:
      "Esta solucion esta pensada para empresas que necesitan un sitio web institucional fuerte, moderno y administrable. Disenamos la experiencia, organizamos el mensaje comercial, construimos una interfaz alineada a tu marca y dejamos una base tecnica lista para posicionamiento, rendimiento y crecimiento.",
    process_steps: ["Diagnostico de marca y objetivos", "Arquitectura y prototipo visual", "Desarrollo optimizado y responsive", "Revision final, lanzamiento y soporte"],
    deliverables: ["Sitio institucional completo", "Panel de administracion", "Formulario de contacto y WhatsApp", "Base SEO y rendimiento optimizado"],
    use_cases: ["Empresas de servicios", "Consultoras", "Firmas profesionales", "Marcas corporativas en expansion"],
  },
  {
    name_es: "Aplicaciones Moviles",
    name_en: "Mobile Applications",
    name_pt: "Aplicativos Moveis",
    description_es: "Apps escalables para Android y iOS centradas en experiencia de usuario y rendimiento.",
    description_en: "Scalable Android and iOS apps focused on user experience and performance.",
    description_pt: "Apps escalaveis para Android e iOS focados em experiencia e desempenho.",
    icon: "smartphone",
    features: ["Android", "iOS", "Integracion API"],
    is_featured: true,
    is_published: true,
    display_order: 2,
    slug: "aplicaciones-moviles",
    hero_title: "Aplicaciones moviles funcionales, intuitivas y preparadas para escalar",
    hero_description:
      "Desarrollamos apps pensadas para usuarios reales, con flujos claros, interfaces atractivas y una arquitectura tecnica estable para crecer con tu negocio.",
    detail_content:
      "Construimos aplicaciones moviles que resuelven necesidades concretas de operacion, ventas o experiencia digital. Cada proyecto se trabaja con enfoque en rendimiento, facilidad de uso, integracion con sistemas existentes y consistencia visual en cada pantalla.",
    process_steps: ["Definicion funcional del producto", "Diseno UX/UI mobile first", "Desarrollo conectado a backend o APIs", "Pruebas, publicacion y mejora continua"],
    deliverables: ["Aplicacion Android o multiplataforma", "Panel o backend de soporte", "Integracion con notificaciones y servicios", "Acompanamiento de salida a produccion"],
    use_cases: ["Apps de reservas", "Aplicaciones internas", "Plataformas de clientes", "Herramientas de seguimiento y gestion"],
  },
  {
    name_es: "Automatizacion de Procesos",
    name_en: "Process Automation",
    name_pt: "Automacao de Processos",
    description_es: "Flujos automatizados para ahorrar tiempo, reducir errores y mejorar operaciones.",
    description_en: "Automated workflows that save time, reduce errors and improve operations.",
    description_pt: "Fluxos automatizados para economizar tempo, reduzir erros e melhorar operacoes.",
    icon: "settings",
    features: ["Integraciones", "Bots", "Alertas inteligentes"],
    is_featured: true,
    is_published: true,
    display_order: 3,
    slug: "automatizacion-de-procesos",
    hero_title: "Automatizacion inteligente para procesos repetitivos, lentos o costosos",
    hero_description:
      "Transformamos tareas manuales en flujos digitales conectados, medibles y mas eficientes para que tu equipo trabaje con mas foco y menos friccion.",
    detail_content:
      "Analizamos cuellos de botella, tareas repetitivas y puntos de fuga operativa para construir automatizaciones que reduzcan tiempo, errores y dependencia manual. El resultado es una operacion mas ordenada, trazable y lista para crecer.",
    process_steps: ["Mapeo del proceso actual", "Deteccion de oportunidades y reglas", "Implementacion de automatizaciones", "Monitoreo, ajustes y mejora continua"],
    deliverables: ["Bots y automatizaciones", "Integracion entre sistemas", "Alertas y seguimiento", "Tableros para control operativo"],
    use_cases: ["Gestion comercial", "Seguimiento de leads", "Procesos administrativos", "Operaciones internas repetitivas"],
  },
  {
    name_es: "Sistemas a Medida",
    name_en: "Custom Systems",
    name_pt: "Sistemas Sob Medida",
    description_es: "Soluciones internas adaptadas a procesos comerciales, operativos y administrativos.",
    description_en: "Internal tools tailored to your business, operations and admin processes.",
    description_pt: "Solucoes internas adaptadas aos processos comerciais e operacionais.",
    icon: "code",
    features: ["Modulos personalizados", "Roles", "Escalabilidad"],
    is_featured: true,
    is_published: true,
    display_order: 4,
    slug: "sistemas-a-medida",
    hero_title: "Sistemas a medida para centralizar, controlar y profesionalizar tu operacion",
    hero_description:
      "Desarrollamos plataformas internas que se adaptan a tus flujos reales, con modulos personalizados, permisos y una experiencia clara para tu equipo.",
    detail_content:
      "Cuando una empresa crece, las hojas de calculo y herramientas aisladas dejan de ser suficientes. Construimos sistemas a medida que ordenan informacion, automatizan tareas y mejoran el control sobre clientes, procesos, inventario, reportes o areas internas.",
    process_steps: ["Levantamiento de requerimientos", "Modelado funcional del sistema", "Desarrollo por modulos y pruebas", "Capacitacion y evolutivo continuo"],
    deliverables: ["Sistema web personalizado", "Panel por roles", "Reportes y filtros", "Base evolutiva para nuevas funciones"],
    use_cases: ["ERP ligero", "CRM interno", "Control de operaciones", "Gestion documental y administrativa"],
  },
  {
    name_es: "E-commerce",
    name_en: "E-commerce",
    name_pt: "E-commerce",
    description_es: "Tiendas en linea conectadas con pagos, inventario y estrategias de venta digital.",
    description_en: "Online stores connected to payments, inventory and digital sales flows.",
    description_pt: "Lojas online conectadas a pagamentos, estoque e vendas digitais.",
    icon: "shopping-cart",
    features: ["Catalogo", "Pagos", "Analitica comercial"],
    is_featured: false,
    is_published: true,
    display_order: 5,
    slug: "e-commerce",
    hero_title: "Tiendas online preparadas para vender con confianza, orden y escalabilidad",
    hero_description:
      "Creamos experiencias de compra claras y profesionales que conectan catalogo, pagos, inventario y marketing en una sola operacion digital.",
    detail_content:
      "Desarrollamos tiendas online que no solo se ven bien, sino que estan orientadas a conversión. Trabajamos arquitectura de producto, checkout, confianza visual, integracion con pagos y una base lista para campanas, promociones y analitica comercial.",
    process_steps: ["Planeacion comercial y estructura del catalogo", "Diseno orientado a conversion", "Configuracion de pagos e inventario", "Lanzamiento, seguimiento y optimizacion"],
    deliverables: ["Tienda online completa", "Pasarela de pago", "Administracion de productos y pedidos", "Base para SEO y campanas"],
    use_cases: ["Marcas de productos", "Catalogos con ventas directas", "Comercio especializado", "Tiendas en crecimiento"],
  },
  {
    name_es: "Soluciones con IA",
    name_en: "AI Solutions",
    name_pt: "Solucoes com IA",
    description_es: "Asistentes, analisis y automatizaciones impulsadas por inteligencia artificial.",
    description_en: "Assistants, analysis and automations powered by artificial intelligence.",
    description_pt: "Assistentes, analises e automacoes com inteligencia artificial.",
    icon: "zap",
    features: ["Asistentes", "Clasificacion", "Generacion de contenido"],
    is_featured: false,
    is_published: true,
    display_order: 6,
    slug: "soluciones-con-ia",
    hero_title: "Inteligencia artificial aplicada a problemas reales de negocio",
    hero_description:
      "Integramos IA para clasificar, asistir, responder, resumir y acelerar procesos con una implementacion util, controlada y alineada a objetivos concretos.",
    detail_content:
      "La IA tiene valor cuando mejora tiempos, calidad o capacidad operativa. Disenamos soluciones aterrizadas para asistencia interna, analisis de informacion, automatizacion de respuestas, clasificacion de datos o experiencias inteligentes de atencion y soporte.",
    process_steps: ["Deteccion del caso de uso", "Diseno del flujo inteligente", "Integracion con sistemas y datos", "Pruebas, control y ajustes operativos"],
    deliverables: ["Asistentes personalizados", "Automatizaciones con IA", "Clasificacion o analitica inteligente", "Implementacion conectada a tu operacion"],
    use_cases: ["Atencion interna", "Soporte al cliente", "Analisis documental", "Automatizacion asistida"],
  },
]
