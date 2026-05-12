"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Heart, MessageCircle, Clock, CheckCircle, Loader2, Sparkles, XCircle } from "lucide-react"
import { getMutualMatches, getPhotoUnblurStatuses } from "@/lib/supabase-queries"
import { mapDbProfile, type DbPublicProfile } from "@/lib/profile-mappers"
import type { UserProfile } from "@/lib/types"

type MatchRow = {
  profileId: string
  date: string
  profile: DbPublicProfile
  conversation?: {
    id: string
    mahram_status: "pending" | "approved" | "refused"
  } | null
}

function getMahramStatus(match: MatchRow) {
  return match.conversation?.mahram_status || "pending"
}

export default function MatchsPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<Array<MatchRow & { mappedProfile: UserProfile }>>([])
  const [photoAccessProfileIds, setPhotoAccessProfileIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadMatches() {
      setLoading(true)
      setError(null)

      try {
        const data = await getMutualMatches()
        if (cancelled) return
        const matchRows = data as unknown as MatchRow[]
        const photoStatuses = await getPhotoUnblurStatuses(matchRows.map(match => match.profileId))
        if (cancelled) return

        setPhotoAccessProfileIds(
          matchRows
            .filter(match => photoStatuses.get(match.profileId) === "approved")
            .map(match => match.profileId),
        )
        setMatches(matchRows.map(match => ({
          ...match,
          mappedProfile: mapDbProfile(match.profile),
        })))
      } catch {
        if (!cancelled) setError("Impossible de charger vos matchs pour le moment.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadMatches()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="max-w-2xl mx-auto">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="font-serif text-xl font-bold text-foreground">Mes Matchs</h1>
        <p className="text-muted-foreground text-xs">{matches.length} match(s) mutuel(s)</p>
      </header>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm">Chargement des matchs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="text-foreground font-semibold">Chargement impossible</p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-foreground font-semibold">Aucun match pour l&apos;instant</p>
            <p className="text-muted-foreground text-sm">Un match apparaît quand deux personnes se likent mutuellement.</p>
          </div>
        ) : (
          matches.map(match => {
            const profile = match.mappedProfile
            const mahramStatus = getMahramStatus(match)
            const photoHidden = Boolean(profile.photoBlurred) && !photoAccessProfileIds.includes(profile.id)

            return (
              <div key={match.profileId} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary fill-primary" />
                  <span className="text-primary text-sm font-semibold">Match mutuel détecté</span>
                </div>

                <div className="p-4 flex gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-secondary overflow-hidden shrink-0">
                    <img
                      src={profile.photo || (profile.genre === "femme" ? "/profil_femme.png" : "/profil_homme.png")}
                      alt={profile.prenom}
                      className={`w-full h-full object-cover ${mahramStatus !== "approved" || photoHidden ? "blur-sm" : ""}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{profile.prenom}, {profile.age} ans</h3>
                      <p className="text-sm text-muted-foreground">{profile.ville} · {profile.paysOrigine}</p>
                    </div>

                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium w-fit ${
                      mahramStatus === "approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : mahramStatus === "refused"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {mahramStatus === "approved" && <><CheckCircle className="w-3.5 h-3.5" /> Échange autorisé</>}
                      {mahramStatus === "pending" && <><Clock className="w-3.5 h-3.5 animate-pulse" /> Demande envoyée au Mahram</>}
                      {mahramStatus === "refused" && <><XCircle className="w-3.5 h-3.5" /> Refusé par le mahram</>}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => router.push(`/profil/${profile.id}`)}
                        className="px-3 py-2 bg-secondary border border-border rounded-xl text-xs font-semibold hover:bg-border transition-colors"
                      >
                        Voir le profil
                      </button>
                      {mahramStatus === "approved" && match.conversation?.id ? (
                        <button
                          onClick={() => router.push(`/chat/${match.conversation?.id}`)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Échanger
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                          <Shield className="w-3.5 h-3.5" />
                          En attente du Mahram
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}

        <div className="bg-secondary rounded-2xl p-4 border border-border">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Supervision du Mahram</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Un match est créé quand deux personnes se likent. L&apos;échange reste soumis à la supervision du Mahram.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
