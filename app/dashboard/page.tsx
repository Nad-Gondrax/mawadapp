"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Bell, Filter, Loader2, X, Sparkles, Heart, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { ProfileCard } from "@/components/dashboard/profile-card"
import { FiltersModal, DEFAULT_FILTERS, type Filters } from "@/components/dashboard/filters-modal"
import { discoverProfiles, getConversationThreads, getIncomingLikes, getLikedProfileIds, getMutualMatches, getMyProfile, getPhotoUnblurStatuses } from "@/lib/supabase-queries"
import { mapDbProfile, type DbPublicProfile } from "@/lib/profile-mappers"
import { getSavedPreferences, savePreferences } from "@/lib/preferences"
import type { UserProfile } from "@/lib/types"

type NotificationMatch = {
  profileId: string
  date: string
  profile: DbPublicProfile
  conversation?: {
    id: string
    mahram_status: "pending" | "approved" | "refused"
  } | null
}

type NotificationItem = {
  id: string
  date: string
  title: string
  body: string
  href: string
  tone: "like" | "match" | "approved" | "refused" | "message"
}

type MessageNotification = {
  id: string
  conversationId: string
  date: string
  partnerName: string
}

function readStoredJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "") as T
  } catch {
    return fallback
  }
}

function writeStoredJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Local cache is optional.
  }
}

function withTimeout<T>(promise: Promise<T>, ms = 15000): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("La requête met trop de temps à répondre."))
    }, ms)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

export default function DashboardPage() {
  const router = useRouter()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [savingFilters, setSavingFilters] = useState(false)
  const [filtersError, setFiltersError] = useState<string | null>(null)
  const [currentProfile, setCurrentProfile] = useState<DbPublicProfile | null>(null)
  const [remoteProfiles, setRemoteProfiles] = useState<UserProfile[]>([])
  const [likedProfileIds, setLikedProfileIds] = useState<string[]>([])
  const [incomingLikes, setIncomingLikes] = useState<Array<{ profileId: string; date: string; profile: DbPublicProfile }>>([])
  const [mutualMatchAlerts, setMutualMatchAlerts] = useState<NotificationMatch[]>([])
  const [messageNotifications, setMessageNotifications] = useState<MessageNotification[]>([])
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([])
  const [notificationHistory, setNotificationHistory] = useState<NotificationItem[]>([])
  const [photoAccessProfileIds, setPhotoAccessProfileIds] = useState<string[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [profilesError, setProfilesError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let hasVisibleProfiles = false

    function buildMessageNotifications(
      conversationThreads: Awaited<ReturnType<typeof getConversationThreads>>,
      profileId: string,
    ) {
      return conversationThreads
        .filter(thread => {
          if (!thread.lastIncomingMessage) return false
          const lastReadAt = window.localStorage.getItem(`mawada-conversation-read:${profileId}:${thread.conversation.id}`)
          return !lastReadAt || new Date(thread.lastIncomingMessage.created_at).getTime() > new Date(lastReadAt).getTime()
        })
        .map(thread => ({
          id: `message:${thread.conversation.id}:${thread.lastIncomingMessage?.id}`,
          conversationId: thread.conversation.id,
          date: thread.lastIncomingMessage?.created_at || thread.conversation.updated_at,
          partnerName: thread.partner.prenom || "Un profil",
        }))
    }

    async function refreshNotifications() {
      try {
        const [myProfile, receivedLikes, mutualMatches, conversationThreads] = await Promise.all([
          getMyProfile(),
          getIncomingLikes(),
          getMutualMatches(),
          getConversationThreads(),
        ])

        if (cancelled) return

        setCurrentProfile(previous => previous || (myProfile as DbPublicProfile))
        setIncomingLikes(receivedLikes as Array<{ profileId: string; date: string; profile: DbPublicProfile }>)
        setMutualMatchAlerts(mutualMatches as NotificationMatch[])
        setMessageNotifications(buildMessageNotifications(conversationThreads, myProfile.id))
        setReadNotificationIds(readStoredJson<string[]>(`mawada-read-notifications:${myProfile.id}`, []))
        setNotificationHistory(readStoredJson<NotificationItem[]>(`mawada-notification-history:${myProfile.id}`, []))
      } catch {
        // Silent refresh: keep the dashboard stable if the network blips.
      }
    }

    async function loadProfiles() {
      setLoadingProfiles(true)
      setProfilesError(null)

      try {
        const myProfile = await getMyProfile()
        if (cancelled) return

        const cacheKey = `mawada-dashboard-profiles:${myProfile.id}`
        const cachedProfiles = readStoredJson<DbPublicProfile[]>(cacheKey, [])

        setCurrentProfile(myProfile as DbPublicProfile)
        setReadNotificationIds(readStoredJson<string[]>(`mawada-read-notifications:${myProfile.id}`, []))
        setNotificationHistory(readStoredJson<NotificationItem[]>(`mawada-notification-history:${myProfile.id}`, []))

        if (cachedProfiles.length > 0) {
          setRemoteProfiles(cachedProfiles.map(mapDbProfile))
          hasVisibleProfiles = true
          setLoadingProfiles(false)
        }

        const discovered = await withTimeout(discoverProfiles())

        if (cancelled) return
        const discoveredProfiles = discovered as unknown as DbPublicProfile[]

        setRemoteProfiles(discoveredProfiles.map(mapDbProfile))
        hasVisibleProfiles = discoveredProfiles.length > 0
        writeStoredJson(cacheKey, discoveredProfiles)
        setLoadingProfiles(false)

        void Promise.allSettled([
          withTimeout(getLikedProfileIds()),
          withTimeout(getIncomingLikes()),
          withTimeout(getMutualMatches()),
          withTimeout(getConversationThreads()),
          withTimeout(getSavedPreferences()),
          withTimeout(getPhotoUnblurStatuses(discoveredProfiles.map(profile => profile.id))),
        ]).then(results => {
          if (cancelled) return

          const [likedIds, receivedLikes, mutualMatches, conversationThreads, preferences, photoStatuses] = results

          if (likedIds.status === "fulfilled") {
            setLikedProfileIds(likedIds.value)
          }

          if (receivedLikes.status === "fulfilled") {
            setIncomingLikes(receivedLikes.value as Array<{ profileId: string; date: string; profile: DbPublicProfile }>)
          }

          if (mutualMatches.status === "fulfilled") {
            setMutualMatchAlerts(mutualMatches.value as NotificationMatch[])
          }

          if (conversationThreads.status === "fulfilled") {
            setMessageNotifications(buildMessageNotifications(conversationThreads.value, myProfile.id))
          }

          if (preferences.status === "fulfilled") {
            setFilters(preferences.value.filters)
            if (preferences.value.setupRequired) {
              setFiltersError("Les préférences ne sont pas encore installées dans Supabase.")
            }
          }

          if (photoStatuses.status === "fulfilled") {
            setPhotoAccessProfileIds(
              discoveredProfiles
                .filter(profile => photoStatuses.value.get(profile.id) === "approved")
                .map(profile => profile.id),
            )
          }
        })
      } catch {
        if (!cancelled) {
          if (!hasVisibleProfiles) {
            setProfilesError("Impossible de charger les profils pour le moment. Réessayez dans quelques secondes.")
            setRemoteProfiles([])
          }
        }
      } finally {
        if (!cancelled) setLoadingProfiles(false)
      }
    }

    const refreshWhenVisible = () => {
      if (document.visibilityState !== "hidden") {
        void refreshNotifications()
      }
    }

    loadProfiles()
    window.addEventListener("focus", refreshWhenVisible)
    document.addEventListener("visibilitychange", refreshWhenVisible)
    const intervalId = window.setInterval(refreshWhenVisible, 15000)

    return () => {
      cancelled = true
      window.removeEventListener("focus", refreshWhenVisible)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
      window.clearInterval(intervalId)
    }
  }, [])

  const notificationItems = useMemo<NotificationItem[]>(() => [
    ...mutualMatchAlerts.map(match => {
      const status = match.conversation?.mahram_status || "pending"
      const conversationId = match.conversation?.id || match.date

      if (status === "approved") {
        return {
          id: `match-approved-v2:${match.profileId}:${conversationId}`,
          date: match.date,
          title: `Match approuvé avec ${match.profile.prenom}`,
          body: "Le Mahram a validé. Vous pouvez maintenant échanger dans Messages.",
          href: "/dashboard/messages",
          tone: "approved" as const,
        }
      }

      if (status === "refused") {
        return {
          id: `match-refused:${match.profileId}:${conversationId}`,
          date: match.date,
          title: `Match refusé avec ${match.profile.prenom}`,
          body: "Le Mahram n'a pas validé cette mise en relation.",
          href: "/dashboard/matchs",
          tone: "refused" as const,
        }
      }

      return {
        id: `match-pending:${match.profileId}:${conversationId}`,
        date: match.date,
        title: `Nouveau match avec ${match.profile.prenom}`,
        body: "Le Mahram est informé. Retrouvez ce match dans votre espace Matchs.",
        href: "/dashboard/matchs",
        tone: "match" as const,
      }
    }),
    ...incomingLikes.map(like => ({
      id: `like:${like.profileId}:${like.date}`,
      date: like.date,
      title: `${like.profile.prenom} a liké votre profil`,
      body: "Vous pouvez matcher en likant son profil également.",
      href: `/profil/${like.profileId}`,
      tone: "like" as const,
    })),
    ...messageNotifications.map(message => ({
      id: message.id,
      date: message.date,
      title: `Nouveau message de ${message.partnerName}`,
      body: "Ouvrez la discussion pour lire son message.",
      href: `/chat/${message.conversationId}`,
      tone: "message" as const,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [incomingLikes, mutualMatchAlerts, messageNotifications])

  useEffect(() => {
    if (!currentProfile || notificationItems.length === 0) return

    const key = `mawada-notification-history:${currentProfile.id}`
    const storedHistory = readStoredJson<NotificationItem[]>(key, [])
    const merged = [
      ...notificationItems,
      ...storedHistory.filter(stored => !notificationItems.some(item => item.id === stored.id)),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50)

    setNotificationHistory(merged)
    window.localStorage.setItem(key, JSON.stringify(merged))
  }, [currentProfile, notificationItems])

  const unreadNotificationCount = useMemo(
    () => notificationHistory.filter(item => !readNotificationIds.includes(item.id)).length,
    [notificationHistory, readNotificationIds],
  )

  const markNotificationsAsRead = () => {
    if (!currentProfile) return
    const nextIds = Array.from(new Set([
      ...readNotificationIds,
      ...notificationHistory.map(item => item.id),
    ]))
    setReadNotificationIds(nextIds)
    window.localStorage.setItem(`mawada-read-notifications:${currentProfile.id}`, JSON.stringify(nextIds))
  }

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
                onClick={() => {
                  setNotificationsOpen(open => !open)
                  markNotificationsAsRead()
                }}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#E7F7F4] hover:bg-[#D0E8E4] transition-colors"
                aria-expanded={notificationsOpen}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-foreground" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#FF6B6B] text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadNotificationCount}
                  </span>
                )}
              </motion.button>
              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-40 w-80 rounded-2xl border border-border bg-white p-4 shadow-premium">
                  <p className="font-semibold text-foreground">Notifications</p>
                  {notificationHistory.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Vous n&apos;avez pas encore de notification.
                    </p>
                  ) : (
                    <div className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
                      {notificationHistory.map(item => {
                        const unread = !readNotificationIds.includes(item.id)
                        const isLike = item.tone === "like"
                        const isApproved = item.tone === "approved"
                        const isRefused = item.tone === "refused"
                        const isMessage = item.tone === "message"

                        return (
                        <button
                          key={item.id}
                          onClick={() => {
                            markNotificationsAsRead()
                            router.push(item.href)
                          }}
                          className={`relative w-full rounded-2xl border p-3 text-left transition-colors ${
                            isRefused
                              ? "border-destructive/20 bg-destructive/5 hover:bg-destructive/10"
                              : isMessage
                              ? "border-[#FF6B6B]/20 bg-[#FF6B6B]/5 hover:bg-[#FF6B6B]/10"
                              : isLike
                              ? "border-[#FF6B6B]/20 bg-[#FF6B6B]/5 hover:bg-[#FF6B6B]/10"
                              : isApproved
                              ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100/70"
                              : "border-primary/20 bg-primary/5 hover:bg-primary/10"
                          }`}
                        >
                          {unread && (
                            <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#FF6B6B]" />
                          )}
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              isRefused
                                ? "bg-destructive/10"
                                : isMessage
                                ? "bg-[#FF6B6B]/10"
                                : isLike
                                ? "bg-[#FF6B6B]/10"
                                : isApproved
                                ? "bg-emerald-100"
                                : "bg-primary/10"
                            }`}>
                              {isMessage ? (
                                <MessageCircle className="h-4 w-4 text-[#FF6B6B]" />
                              ) : (
                                <Heart className={`h-4 w-4 ${
                                  isRefused
                                    ? "text-destructive"
                                    : isLike
                                    ? "text-[#FF6B6B] fill-[#FF6B6B]"
                                    : isApproved
                                    ? "text-emerald-700 fill-emerald-700"
                                    : "text-primary fill-primary"
                                }`} />
                              )}
                            </div>
                            <div className="pr-3">
                              <p className="text-sm font-semibold text-foreground">{item.title}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {item.body}
                              </p>
                            </div>
                          </div>
                        </button>
                        )
                      })}
                      <button
                        onClick={() => {
                          markNotificationsAsRead()
                          router.push("/dashboard/matchs")
                        }}
                        className="w-full rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                      >
                        Voir dans Matchs
                      </button>
                    </div>
                  )}
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
