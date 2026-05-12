"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Heart, MessageCircle, User, Shield, Compass, LogOut } from "lucide-react"
import { getMutualMatches, getMyProfile, signOut } from "@/lib/supabase-queries"

const NAV_ITEMS = [
  { href: "/dashboard", icon: Compass, label: "Découvrir" },
  { href: "/dashboard/matchs", icon: Heart, label: "Matchs" },
  { href: "/dashboard/messages", icon: MessageCircle, label: "Messages" },
  { href: "/profil/me", icon: User, label: "Profil" },
]

const SIDEBAR_EXTRA = [
  { href: "/profil/mahram", icon: Shield, label: "Mon mahram" },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [matchesCount, setMatchesCount] = useState(0)
  const [showMahramLink, setShowMahramLink] = useState(false)

  useEffect(() => {
    let cancelled = false

    Promise.all([getMutualMatches(), getMyProfile()])
      .then(([matches, profile]) => {
        if (!cancelled) {
          setMatchesCount(matches.length)
          setShowMahramLink(profile?.genre === "femme")
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMatchesCount(0)
          setShowMahramLink(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const sidebarExtraItems = showMahramLink ? SIDEBAR_EXTRA : []

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
    router.refresh()
  }

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
              {label === "Matchs" && matchesCount > 0 && (
                <span className="ml-auto bg-[#FF6B6B] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {matchesCount}
                </span>
              )}
            </Link>
          )
        })}
        
        {sidebarExtraItems.length > 0 && <div className="h-px bg-border my-4" />}
        
        {sidebarExtraItems.map(({ href, icon: Icon, label }) => {
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

      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-all text-left"
      >
        <LogOut className="w-5 h-5" />
        Se déconnecter
      </button>
    </aside>
  )
}

export function DashboardBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [matchesCount, setMatchesCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    getMutualMatches()
      .then(matches => {
        if (!cancelled) setMatchesCount(matches.length)
      })
      .catch(() => {
        if (!cancelled) setMatchesCount(0)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
    router.refresh()
  }

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
              {label === "Matchs" && matchesCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6B6B] rounded-full" />
              )}
            </Link>
          )
        })}
        <button
          onClick={handleSignOut}
          className="relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all"
        >
          <motion.div whileTap={{ scale: 0.9 }} className="p-2 rounded-xl">
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </motion.div>
          <span className="text-[10px] font-medium text-muted-foreground">
            Sortir
          </span>
        </button>
      </div>
    </nav>
  )
}
