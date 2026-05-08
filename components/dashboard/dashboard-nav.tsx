"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, Star, Heart, MessageCircle, User, Shield, Settings, Compass } from "lucide-react"

const NAV_ITEMS = [
  { href: "/dashboard", icon: Compass, label: "Découvrir" },
  { href: "/dashboard/nouveaux", icon: Star, label: "Nouveaux" },
  { href: "/dashboard/matchs", icon: Heart, label: "Matchs" },
  { href: "/dashboard/messages", icon: MessageCircle, label: "Messages" },
  { href: "/profil/me", icon: User, label: "Profil" },
]

const SIDEBAR_EXTRA = [
  { href: "/profil/mahram", icon: Shield, label: "Mon mahram" },
  { href: "/preferences", icon: Settings, label: "Préférences" },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-72 min-h-screen bg-white border-r border-border p-5 gap-1">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-3 py-4 mb-4">
        <Image src="/logo-mawada.png" alt="Mawada" width={36} height={36} />
        <span className="font-serif font-bold text-foreground text-xl">Mawada</span>
      </Link>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href} 
              href={href}
              className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-sm font-medium ${
                active 
                  ? "bg-primary text-white shadow-lg shadow-primary/25" 
                  : "text-muted-foreground hover:bg-[#E7F7F4] hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "" : ""}`} />
              {label}
              {label === "Matchs" && (
                <span className="ml-auto bg-[#FF6B6B] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  3
                </span>
              )}
            </Link>
          )
        })}
        
        <div className="h-px bg-border my-4" />
        
        {SIDEBAR_EXTRA.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href} 
              href={href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-sm font-medium ${
                active 
                  ? "bg-primary text-white shadow-lg shadow-primary/25" 
                  : "text-muted-foreground hover:bg-[#E7F7F4] hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User card */}
      <div className="mt-auto">
        <div className="bg-gradient-to-br from-[#E7F7F4] to-[#F8FFFC] rounded-2xl p-4 border border-primary/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="font-serif font-bold text-primary">M</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Mon compte</p>
              <p className="text-xs text-muted-foreground">Profil complété à 85%</p>
            </div>
          </div>
          <div className="w-full bg-primary/20 rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: "85%" }} />
          </div>
        </div>
      </div>

      {/* Admin link */}
      <Link
        href="/admin"
        className="flex items-center gap-3 px-4 py-3 mt-4 rounded-2xl text-sm font-medium text-muted-foreground hover:bg-[#E7F7F4] hover:text-foreground transition-all"
      >
        <Settings className="w-5 h-5" />
        Administration
      </Link>
    </aside>
  )
}

export function DashboardBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2 pb-safe">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href} 
              href={href}
              className="relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-xl ${active ? "bg-primary/10" : ""}`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
              </motion.div>
              <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </span>
              {label === "Matchs" && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6B6B] rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
