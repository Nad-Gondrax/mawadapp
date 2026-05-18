"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { ProfileCard } from "@/components/dashboard/profile-card"
import { discoverProfiles, getLikedProfileIds, getMyProfile, getPhotoUnblurStatuses, getProfilesAvailability } from "@/lib/supabase-queries"
import { mapDbProfile, type DbPublicProfile } from "@/lib/profile-mappers"
import type { UserProfile } from "@/lib/types"

export default function NouveauxPage() {
  const [currentProfile, setCurrentProfile] = useState<DbPublicProfile | null>(null)
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [likedProfileIds, setLikedProfileIds] = useState<string[]>([])
  const [photoAccessProfileIds, setPhotoAccessProfileIds] = useState<string[]>([])
  const [unavailableProfileIds, setUnavailableProfileIds] = useState<string[]>([])
  const [currentUserHasActiveMatch, setCurrentUserHasActiveMatch] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadProfiles() {
      setLoading(true)
      setError(null)

      try {
        const [myProfile, discovered, likedIds] = await Promise.all([
          getMyProfile(),
          discoverProfiles(),
          getLikedProfileIds(),
        ])

        if (cancelled) return
        const discoveredProfiles = discovered as unknown as DbPublicProfile[]
        const [photoStatuses, availability] = await Promise.all([
          getPhotoUnblurStatuses(discoveredProfiles.map(profile => profile.id)),
          getProfilesAvailability(discoveredProfiles.map(profile => profile.id)),
        ])
        if (cancelled) return

        setCurrentProfile(myProfile as DbPublicProfile)
        setProfiles(discoveredProfiles.map(mapDbProfile))
        setLikedProfileIds(likedIds)
        setPhotoAccessProfileIds(
          discoveredProfiles
            .filter(profile => photoStatuses.get(profile.id) === "approved")
            .map(profile => profile.id),
        )
        setUnavailableProfileIds(availability.activeProfileIds)
        setCurrentUserHasActiveMatch(availability.currentUserHasActiveMatch)
      } catch {
        if (!cancelled) setError("Impossible de charger les nouveaux profils.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProfiles()

    return () => {
      cancelled = true
    }
  }, [])

  const currentGenre = currentProfile?.genre
  const newestProfiles = useMemo(() => {
    return profiles
      .filter(profile => !currentGenre || profile.genre !== currentGenre)
      .sort((a, b) => new Date(b.dateInscription).getTime() - new Date(a.dateInscription).getTime())
  }, [currentGenre, profiles])

  return (
    <div className="max-w-4xl mx-auto">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="font-serif text-xl font-bold text-foreground">Nouveaux profils</h1>
        <p className="text-muted-foreground text-xs">{newestProfiles.length} nouveaux membres récemment inscrits</p>
      </header>

      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm">Chargement des nouveaux profils...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[#E7F7F4] rounded-full flex items-center justify-center mx-auto mb-5">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-serif font-bold text-xl text-foreground mb-2">Chargement impossible</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">{error}</p>
          </div>
        ) : newestProfiles.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {newestProfiles.map(profile => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                initiallyLiked={likedProfileIds.includes(profile.id)}
                photoAccessApproved={photoAccessProfileIds.includes(profile.id)}
                matchUnavailable={unavailableProfileIds.includes(profile.id)}
                currentUserHasActiveMatch={currentUserHasActiveMatch}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[#E7F7F4] rounded-full flex items-center justify-center mx-auto mb-5">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-serif font-bold text-xl text-foreground mb-2">Aucun nouveau profil</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">Les nouveaux profils apparaîtront ici.</p>
          </div>
        )}
      </div>
    </div>
  )
}
