"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Bell, Search, Filter, X, Sparkles } from "lucide-react"
import { ProfileCard } from "@/components/dashboard/profile-card"
import { FiltersModal, DEFAULT_FILTERS, type Filters } from "@/components/dashboard/filters-modal"
import { MOCK_PROFILES, CURRENT_USER } from "@/lib/mock-data"

const TABS = ["Pour vous", "Nouveaux", "Recommandés"]

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.ageMin !== 18 || filters.ageMax !== 60) count++
    if (filters.departement !== "Tous") count++
    if (filters.niveauEtude !== "tous") count++
    if (filters.niveauPratique !== "tous") count++
    if (filters.paysOrigine !== "Tous") count++
    if (filters.avecEnfants !== "tous") count++
    if (filters.projetMariage !== "tous") count++
    if (filters.mahramValide) count++
    return count
  }, [filters])

  // Filter profiles
  const profiles = useMemo(() => {
    let result = MOCK_PROFILES.filter(p => p.genre !== CURRENT_USER.genre)

    // Age filter
    result = result.filter(p => p.age >= filters.ageMin && p.age <= filters.ageMax)

    // Département filter
    if (filters.departement !== "Tous") {
      const deptNum = filters.departement.split(" - ")[0]
      result = result.filter(p => {
        if (deptNum === "75" && p.ville.toLowerCase().includes("paris")) return true
        if (deptNum === "69" && p.ville.toLowerCase().includes("lyon")) return true
        if (deptNum === "13" && p.ville.toLowerCase().includes("marseille")) return true
        return false
      })
    }

    // Niveau pratique filter
    if (filters.niveauPratique !== "tous") {
      result = result.filter(p => p.niveauPratique === filters.niveauPratique)
    }

    // Pays origine filter
    if (filters.paysOrigine !== "Tous") {
      result = result.filter(p => p.paysOrigine === filters.paysOrigine)
    }

    // Projet mariage filter
    if (filters.projetMariage !== "tous") {
      result = result.filter(p => p.projetMariage === filters.projetMariage)
    }

    // Mahram validé filter
    if (filters.mahramValide) {
      result = result.filter(p => p.mahram?.statut === "valide")
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.prenom.toLowerCase().includes(q) ||
        p.ville.toLowerCase().includes(q) ||
        p.paysOrigine.toLowerCase().includes(q) ||
        p.traits.some(t => t.toLowerCase().includes(q))
      )
    }

    return result
  }, [filters, searchQuery])

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 lg:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">
              Salam, {CURRENT_USER.prenom}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {profiles.length} profil{profiles.length > 1 ? "s" : ""} correspond{profiles.length > 1 ? "ent" : ""} à vos critères
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSearchOpen(!searchOpen)}
              className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all ${
                searchOpen ? "bg-primary text-white shadow-lg shadow-primary/25" : "bg-[#E7F7F4] hover:bg-[#D0E8E4] text-foreground"
              }`}
            >
              <Search className="w-5 h-5" />
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#E7F7F4] hover:bg-[#D0E8E4] transition-colors relative"
            >
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#FF6B6B] rounded-full border-2 border-white" />
            </motion.button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-5">
        {/* Search bar */}
        {searchOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par prénom, ville, origine..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-4 border border-border rounded-2xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-[#E7F7F4] hover:bg-[#D0E8E4] transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </motion.div>
        )}

        {/* Mahram alert */}
        {CURRENT_USER.mahram?.statut !== "valide" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-amber-600 text-lg">!</span>
            </div>
            <div>
              <p className="font-semibold text-amber-800">Mahram en attente</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Validez votre mahram pour accéder aux discussions et aux matchs complets.
              </p>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-[#E7F7F4] p-1.5 rounded-2xl">
          {TABS.map((t, i) => (
            <motion.button
              key={t}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeTab === i 
                  ? "bg-white text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </motion.button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 gradient-mawada text-white rounded-2xl text-sm font-semibold shrink-0 relative shadow-lg shadow-primary/20"
          >
            <Filter className="w-4 h-4" />
            Recherche
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#FF6B6B] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {activeFiltersCount}
              </span>
            )}
          </motion.button>
          
          {activeFiltersCount > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-[#FF6B6B]/10 text-[#FF6B6B] rounded-2xl text-sm font-medium shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              Effacer
            </motion.button>
          )}
          
          {/* Quick filters */}
          {filters.niveauPratique !== "tous" && (
            <span className="px-3 py-2 bg-white border border-primary/20 rounded-2xl text-xs text-primary font-medium shrink-0">
              {filters.niveauPratique === "tres_pratiquant" ? "Très pratiquant(e)" : filters.niveauPratique}
            </span>
          )}
          {filters.departement !== "Tous" && (
            <span className="px-3 py-2 bg-white border border-primary/20 rounded-2xl text-xs text-primary font-medium shrink-0">
              {filters.departement}
            </span>
          )}
          {filters.paysOrigine !== "Tous" && (
            <span className="px-3 py-2 bg-white border border-primary/20 rounded-2xl text-xs text-primary font-medium shrink-0">
              {filters.paysOrigine}
            </span>
          )}
          {filters.mahramValide && (
            <span className="px-3 py-2 bg-white border border-[#2ECC71]/30 rounded-2xl text-xs text-[#2ECC71] font-medium shrink-0">
              Mahram validé
            </span>
          )}
        </div>

        {/* Grid */}
        {profiles.length > 0 ? (
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid sm:grid-cols-2 gap-5"
          >
            {profiles.map(p => (
              <ProfileCard key={p.id} profile={p} />
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-[#E7F7F4] rounded-full flex items-center justify-center mx-auto mb-5">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-serif font-bold text-xl text-foreground mb-2">
              Aucun profil trouvé
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Essayez de modifier vos critères de recherche pour découvrir plus de profils
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={clearFilters}
              className="px-6 py-3 gradient-mawada text-white rounded-2xl font-semibold shadow-lg shadow-primary/25"
            >
              Réinitialiser les filtres
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Filters Modal */}
      <FiltersModal
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onApply={setFilters}
      />
    </div>
  )
}
