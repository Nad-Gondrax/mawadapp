"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Bell, Filter, Loader2, X, Sparkles } from "lucide-react"
import { ProfileCard } from "@/components/dashboard/profile-card"
import { FiltersModal, DEFAULT_FILTERS, type Filters } from "@/components/dashboard/filters-modal"
import { discoverProfiles, getLikedProfileIds, getMyProfile, getPhotoUnblurStatuses } from "@/lib/supabase-queries"
import { mapDbProfile, type DbPublicProfile } from "@/lib/profile-mappers"
import { getSavedPreferences, savePreferences } from "@/lib/preferences"
import type { UserProfile } from "@/lib/types"

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

export default function DashboardPage() {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [savingFilters, setSavingFilters] = useState(false)
  const [filtersError, setFiltersError] = useState<string | null>(null)
  const [currentProfile, setCurrentProfile] = useState<DbPublicProfile | null>(null)
  const [remoteProfiles, setRemoteProfiles] = useState<UserProfile[]>([])
  const [likedProfileIds, setLikedProfileIds] = useState<string[]>([])
  const [photoAccessProfileIds, setPhotoAccessProfileIds] = useState<string[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [profilesError, setProfilesError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadProfiles() {
      setLoadingProfiles(true)
      setProfilesError(null)

      try {
        const [myProfile, discovered, likedIds, preferences] = await Promise.all([
          getMyProfile(),
          discoverProfiles(),
          getLikedProfileIds(),
          getSavedPreferences(),
        ])

        if (cancelled) return
        const discoveredProfiles = discovered as unknown as DbPublicProfile[]
        const photoStatuses = await getPhotoUnblurStatuses(discoveredProfiles.map(profile => profile.id))
        if (cancelled) return

        setCurrentProfile(myProfile as DbPublicProfile)
        setRemoteProfiles(discoveredProfiles.map(mapDbProfile))
        setLikedProfileIds(likedIds)
        setPhotoAccessProfileIds(
          discoveredProfiles
            .filter(profile => photoStatuses.get(profile.id) === "approved")
            .map(profile => profile.id),
        )
        setFilters(preferences.filters)
        if (preferences.setupRequired) {
          setFiltersError("Les préférences ne sont pas encore installées dans Supabase.")
        }
      } catch {
        if (!cancelled) {
          setProfilesError("Impossible de charger les profils pour le moment.")
          setRemoteProfiles([])
        }
      } finally {
        if (!cancelled) setLoadingProfiles(false)
      }
    }

    loadProfiles()

    return () => {
      cancelled = true
    }
  }, [])

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
    return count
  }, [filters])

  const currentGenre = currentProfile?.genre

  // Filter profiles
  const profiles = useMemo(() => {
    let result = currentGenre
      ? remoteProfiles.filter(p => p.genre !== currentGenre)
      : remoteProfiles

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

    return result
  }, [currentGenre, filters, remoteProfiles])

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setFiltersError(null)
    savePreferences(DEFAULT_FILTERS).catch(() => {
      setFiltersError("Impossible de sauvegarder la réinitialisation pour le moment.")
    })
  }

  const applyFilters = async (nextFilters: Filters) => {
    setSavingFilters(true)
    setFiltersError(null)

    try {
      const data = await savePreferences(nextFilters)
      setFilters(data.filters)
      setFiltersOpen(false)
    } catch (error) {
      setFiltersError(error instanceof Error ? error.message : "Impossible de sauvegarder les préférences.")
    } finally {
      setSavingFilters(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 lg:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">
              Salam, {currentProfile?.prenom || "bienvenue"}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {profiles.length} profil{profiles.length > 1 ? "s" : ""} correspond{profiles.length > 1 ? "ent" : ""} à vos critères
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => setNotificationsOpen(open => !open)}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#E7F7F4] hover:bg-[#D0E8E4] transition-colors"
                aria-expanded={notificationsOpen}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-foreground" />
              </motion.button>
              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-40 w-72 rounded-2xl border border-border bg-white p-4 shadow-premium">
                  <p className="font-semibold text-foreground">Notifications</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Vous n&apos;avez pas encore de notification.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-5">
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
        </div>

        {/* Grid */}
        {loadingProfiles ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm">Chargement des profils...</p>
          </div>
        ) : profilesError ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[#E7F7F4] rounded-full flex items-center justify-center mx-auto mb-5">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-serif font-bold text-xl text-foreground mb-2">
              Chargement impossible
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {profilesError}
            </p>
          </div>
        ) : profiles.length > 0 ? (
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid sm:grid-cols-2 gap-5"
          >
            {profiles.map(p => (
              <ProfileCard
                key={p.id}
                profile={p}
                initiallyLiked={likedProfileIds.includes(p.id)}
                photoAccessApproved={photoAccessProfileIds.includes(p.id)}
              />
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
        onApply={applyFilters}
        saving={savingFilters}
        error={filtersError}
      />
    </div>
  )
}
