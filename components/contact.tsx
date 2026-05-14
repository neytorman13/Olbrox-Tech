"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { Send, Mail, Phone, MapPin, MessageCircle, Loader2, CheckCircle2 } from "lucide-react"
import { useLanguage } from "@/lib/i18n"
import { saveLead, saveFormSubmission, trackWhatsAppClick } from "@/lib/public/tracking"
import { useSiteSettings } from "@/lib/public/use-site-settings"

export function Contact() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { t } = useLanguage()
  const { settings } = useSiteSettings()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "sent" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitState("sending")

    const { id: leadId } = await saveLead({
      full_name: formData.name,
      email: formData.email,
      phone: formData.phone,
      message: formData.message,
      source: "contact_form",
    })

    await saveFormSubmission("contact_form", { ...formData }, leadId)

    const whatsappPhone = settings.whatsapp_number || "593985532437"
    const whatsappMessage = `Hola, soy ${formData.name}.\n\nEmail: ${formData.email}\nTelefono: ${formData.phone}\n\nMensaje: ${formData.message}`
    await trackWhatsAppClick({
      phone: whatsappPhone,
      message: whatsappMessage,
      sourceButton: "contact_form_submit",
      contactName: formData.name,
      leadId,
    })

    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`
    window.open(whatsappUrl, "_blank")

    setSubmitState("sent")
    setFormData({ name: "", email: "", phone: "", message: "" })
    setTimeout(() => setSubmitState("idle"), 4000)
  }

  const contactInfo = [
    {
      icon: MessageCircle,
      title: "WhatsApp",
      value: settings.contact_phone,
      href: settings.whatsapp_number ? `https://wa.me/${settings.whatsapp_number}` : "#",
    },
    {
      icon: Mail,
      title: "Email",
      value: settings.contact_email,
      href: `mailto:${settings.contact_email}`,
    },
    {
      icon: MapPin,
      title: "Ubicacion",
      value: settings.address,
      href: "#",
    },
  ]

  return (
    <section id="contacto" className="py-24 relative overflow-hidden" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-card/30 to-background" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      {/* Animated orbs */}
      <motion.div 
        className="absolute bottom-20 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
            {t("nav.contact")}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            {t("contact.title").split(" ")[0]}{" "}
            <span className="gradient-text">{t("contact.title").split(" ").slice(1).join(" ") || ""}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {t("contact.subtitle")}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    {t("contact.name")}
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder={t("contact.placeholder.name")}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      {t("contact.email")}
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder={t("contact.placeholder.email")}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-2">
                      {t("contact.phone")}
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder={t("contact.placeholder.phone")}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    {t("contact.message")}
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    placeholder={t("contact.placeholder.message")}
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={submitState === "sending"}
                  whileHover={{ scale: submitState === "sending" ? 1 : 1.02 }}
                  whileTap={{ scale: submitState === "sending" ? 1 : 0.98 }}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-semibold flex items-center justify-center gap-2 relative overflow-hidden group disabled:opacity-70"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {submitState === "sending" ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
                    ) : submitState === "sent" ? (
                      <><CheckCircle2 className="w-5 h-5" /> Mensaje enviado</>
                    ) : (
                      <>{t("contact.send")}<Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 via-primary to-blue-600"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    style={{ opacity: 0.3 }}
                  />
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-4">{t("contact.info.title")}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t("contact.info.desc")}
                </p>
              </div>

              <div className="space-y-4">
                {contactInfo.map((info, index) => (
                  <motion.a
                    key={info.title}
                    href={info.href}
                    target={info.href.startsWith("http") ? "_blank" : undefined}
                    rel={info.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                    whileHover={{ x: 10, scale: 1.02 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <info.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{info.title}</div>
                      <div className="font-semibold group-hover:text-primary transition-colors">{info.value}</div>
                    </div>
                  </motion.a>
                ))}
              </div>

              {/* Quick WhatsApp CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="p-6 rounded-xl bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20"
              >
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  {t("contact.whatsapp.title")}
                </h4>
                <p className="text-muted-foreground text-sm mb-4">
                  {t("whatsapp.tooltip")}
                </p>
                <motion.a
                  href={`https://wa.me/${settings.whatsapp_number || "593985532437"}?text=${encodeURIComponent(t("whatsapp.greeting"))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    void trackWhatsAppClick({
                      phone: settings.whatsapp_number || "593985532437",
                      message: t("whatsapp.greeting"),
                      sourceButton: "contact_whatsapp_card",
                    })
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {t("whatsapp.buttonText")}
                </motion.a>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

