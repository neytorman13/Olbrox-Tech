"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Globe, ChevronDown } from "lucide-react"
import { usePathname } from "next/navigation"
import { useLanguage, supportedLanguages } from "@/lib/i18n"
import { useTheme } from "@/components/theme-provider"
import { ThemeToggle } from "./theme-toggle"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { language, setLanguage, t } = useLanguage()
  const { resolvedTheme } = useTheme()
  const pathname = usePathname()
  const isHome = pathname === "/"

  const homeHref = (anchor: string) => (isHome ? anchor : `/${anchor}`)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { href: homeHref("#inicio"), label: t("nav.home") },
    { href: homeHref("#servicios"), label: t("nav.services") },
    { href: homeHref("#proyectos"), label: t("nav.projects") },
    { href: homeHref("#nosotros"), label: t("nav.about") },
    { href: homeHref("#contacto"), label: t("nav.contact") },
  ]

  const currentLang = supportedLanguages.find((l) => l.code === language) || supportedLanguages[0]

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? "glass shadow-lg shadow-primary/5" 
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.a
            href={homeHref("#inicio")}
            className="flex items-center gap-3 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative w-10 h-10">
              <Image
                src="/images/olbrox-logo.png"
                alt="Olbrox logo"
                fill
                className="object-contain"
                sizes="40px"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground tracking-tight">OLBROX</span>
              <span className="text-[10px] font-semibold text-primary tracking-[0.3em]">TECH</span>
            </div>
          </motion.a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item, index) => (
              <motion.a
                key={item.href}
                href={item.href}
                className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </motion.a>
            ))}
          </div>

          {/* Theme Toggle, Language Selector & CTA */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Language Selector */}
            <div className="relative">
              <motion.button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-sm font-medium transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Globe className="w-4 h-4 text-primary" />
                <span>{currentLang.flag}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isLangMenuOpen ? "rotate-180" : ""}`} />
              </motion.button>

              <AnimatePresence>
                {isLangMenuOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setIsLangMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-2 w-40 py-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      {supportedLanguages.map((lang) => (
                        <motion.button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code)
                            setIsLangMenuOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 ${
                            language === lang.code 
                              ? "bg-primary/10 text-primary" 
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                          whileHover={{ x: 4 }}
                        >
                          <span className="font-medium">{lang.flag}</span>
                          <span>{lang.nativeName}</span>
                          {language === lang.code && (
                            <motion.div
                              layoutId="activeLang"
                              className="ml-auto w-2 h-2 rounded-full bg-primary"
                            />
                          )}
                        </motion.button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* CTA Button */}
            <motion.a
              href={homeHref("#contacto")}
              className="relative px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm overflow-hidden group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10">{t("hero.cta.quote")}</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary via-blue-400 to-primary"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{ opacity: 0.3 }}
              />
            </motion.a>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle />
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-secondary/80 border border-border text-foreground"
              whileTap={{ scale: 0.9 }}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass border-t border-border"
          >
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
              {navItems.map((item, index) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {item.label}
                </motion.a>
              ))}
              
              {/* Mobile Language Selector */}
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">Idioma / Language</p>
                <div className="flex gap-2 flex-wrap">
                  {supportedLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        language === lang.code 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {lang.flag}
                    </button>
                  ))}
                </div>
              </div>

              <motion.a
                href={homeHref("#contacto")}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center px-6 py-3 mt-4 rounded-xl bg-primary text-primary-foreground font-semibold"
                whileTap={{ scale: 0.98 }}
              >
                {t("hero.cta.quote")}
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
