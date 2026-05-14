export type ServiceRecord = {
  id: string
  name_es?: string | null
  name_en?: string | null
  name_pt?: string | null
  title_es?: string | null
  title_en?: string | null
  title_pt?: string | null
  description_es: string | null
  description_en?: string | null
  description_pt?: string | null
  icon: string | null
  features?: string[] | string | null
  is_published?: boolean | number | null
  is_featured?: boolean | number | null
  display_order?: number | null
  slug?: string | null
  hero_title?: string | null
  hero_description?: string | null
  detail_content?: string | null
  process_steps?: string[] | string | null
  deliverables?: string[] | string | null
  use_cases?: string[] | string | null
}

export function slugifyService(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean)
      }
    } catch {}

    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

export function getServiceTitle(service: ServiceRecord, language: string) {
  if (language === "en") return service.name_en || service.title_en || service.name_es || service.title_es || ""
  if (language === "pt") return service.name_pt || service.title_pt || service.name_es || service.title_es || ""
  return service.name_es || service.title_es || ""
}

export function getServiceDescription(service: ServiceRecord, language: string) {
  if (language === "en") return service.description_en || service.description_es || ""
  if (language === "pt") return service.description_pt || service.description_es || ""
  return service.description_es || ""
}

export function normalizeService(service: ServiceRecord) {
  const baseTitle = service.name_es || service.title_es || "servicio"
  const features = normalizeStringArray(service.features)
  const processSteps = normalizeStringArray(service.process_steps)
  const deliverables = normalizeStringArray(service.deliverables)
  const useCases = normalizeStringArray(service.use_cases)

  return {
    ...service,
    name_es: service.name_es || service.title_es || "",
    name_en: service.name_en || service.title_en || "",
    name_pt: service.name_pt || service.title_pt || "",
    icon: service.icon || "code",
    slug: service.slug || slugifyService(baseTitle),
    description_es: service.description_es || "",
    description_en: service.description_en || "",
    description_pt: service.description_pt || "",
    hero_title: service.hero_title || baseTitle,
    hero_description: service.hero_description || service.description_es || "",
    detail_content: service.detail_content || service.description_es || "",
    features,
    process_steps: processSteps,
    deliverables,
    use_cases: useCases,
  }
}
