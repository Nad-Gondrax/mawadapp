"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Heart, MessageCircle, Clock, CheckCircle, Loader2, Sparkles, XCircle } from "lucide-react"
import { addLike, getIncomingLikes, getMutualMatches, getPhotoUnblurStatuses } from "@/lib/supabase-queries"
import { mapDbProfile, type DbPublicProfile } from "@/lib/profile-mappers"
import { getUserFacingError } from "@/lib/user-facing-errors"
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

type IncomingLikeRow = {
  profileId: string
  date: string
  profile: DbPublicProfile
}

function getMahramStatus(match: MatchRow) {
  return match.conversation?.mahram_status || "pending"
}

export default function MatchsPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<Array<MatchRow & { mappedProfile: UserProfile }>>([])
  const [incomingLikes, setIncomingLikes] = useState<Array<IncomingLikeRow & { mappedProfile: UserProfile }>>([])
  const [photoAccessProfileIds, setPhotoAccessProfileIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [likeBackSavingId, setLikeBackSavingId] = useState<string | null>(null)
  const [likeBackError, setLikeBackError] = useState<string | null>(null)

  const hydrateRows = async (matchRows: MatchRow[], incomingRows: IncomingLikeRow[]) => {
    const photoStatuses = await getPhotoUnblurStatuses([
      ...matchRows.map(match => match.profileId),
      ...incomingRows.map(like => like.profileId),
    ])

    setPhotoAccessProfileIds(
      [...matchRows, ...incomingRows]
        .filter(item => photoStatuses.get(item.profileId) === "approved")
        .map(item => item.profileId),
    )
    setIncomingLikes(incomingRows.map(like => ({
      ...like,
      mappedProfile: mapDbProfile(like.profile),
    })))
    setMatches(matchRows.map(match => ({
      ...match,
      mappedProfile: mapDbProfile(match.profile),
    })))
  }

  useEffect(() => {
    let cancelled = false

    async function loadMatches() {
      setLoading(true)
      setError(null)

      try {
        const [mutualMatches, receivedLikes] = await Promise.all([
          getMutualMatches(),
          getIncomingLikes(),
        ])
        if (cancelled) return

        await hydrateRows(mutualMatches as unknown as MatchRow[], receivedLikes as IncomingLikeRow[])
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

  const handleLikeBack = async (profileId: string) => {
    setLikeBackSavingId(profileId)
    setLikeBackError(null)

    try {
      await addLike(profileId)
      const [mutualMatches, receivedLikes] = await Promise.all([
        getMutualMatches(),
        getIncomingLikes(),
      ])

      await hydrateRows(mutualMatches as unknown as MatchRow[], receivedLikes as IncomingLikeRow[])
    } catch (likeError) {
      setLikeBackError(getUserFacingError(likeError, "like"))
    } finally {
      setLikeBackSavingId(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="font-serif text-xl font-bold text-foreground">Mes Matchs</h1>
        <p className="text-muted-foreground text-xs">
          {incomingLikes.length} like(s) reçu(s) · {matches.length} match(s) mutuel(s)
        </p>
      </header>

      <div className="p-4 space-y-5">
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
        ) : incomingLikes.length === 0 && matches.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-foreground font-semibold">Aucun match pour l&apos;instant</p>
            <p className="text-muted-foreground text-sm">
              Ici apparaîtront les personnes qui ont liké votre profil et vos matchs mutuels.
            </p>
          </div>
        ) : (
          <>
            {incomingLikes.length > 0 && (
              <section className="space-y-3">
                <div>
                  <h2 className="font-serif text-lg font-bold text-foreground">Likes reçus</h2>
                  <p className="text-sm text-muted-foreground">
                    Ces personnes ont liké votre profil. Likez en retour pour créer un match.
                  </p>
                </div>

                {likeBackError && (
                  <p className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {likeBackError}
                  </p>
                )}

                {incomingLikes.map(like => {
                  const profile = like.mappedProfile
                  const photoHidden = Boolean(profile.photoBlurred) && !photoAccessProfileIds.includes(profile.id)

                  return (
                    <div key={like.profileId} className="bg-card rounded-2xl border border-[#FF6B6B]/20 shadow-sm overflow-hidden">
                      <div className="bg-[#FF6B6B]/10 border-b border-[#FF6B6B]/20 px-4 py-2 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-[#FF6B6B] fill-[#FF6B6B]" />
                        <span className="text-[#D94F4F] text-sm font-semibold">
                          {profile.prenom} a liké votre profil
                        </span>
                      </div>

                      <div className="p-4 flex gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-secondary overflow-hidden shrink-0">
                          <img
                            src={profile.photo || (profile.genre === "femme" ? "/profil_femme.png" : "/profil_homme.png")}
                            alt={profile.prenom}
                            className={`w-full h-full object-cover ${photoHidden ? "blur-sm" : ""}`}
                          />
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <div>
                            <h3 className="font-semibold text-foreground">{profile.prenom}, {profile.age} ans</h3>
                            <p className="text-sm text-muted-foreground">{profile.ville} · {profile.paysOrigine}</p>
                          </div>

                          <p className="text-sm text-muted-foreground">
                            Si vous likez aussi ce profil, un match sera créé et le Mahram sera informé.
                          </p>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => router.push(`/profil/${profile.id}`)}
                              className="px-3 py-2 bg-secondary border border-border rounded-xl text-xs font-semibold hover:bg-border transition-colors"
                            >
                              Voir le profil
                            </button>
                            <button
                              onClick={() => handleLikeBack(profile.id)}
                              disabled={likeBackSavingId === profile.id}
                              className="flex items-center gap-1.5 px-3 py-2 bg-[#FF6B6B] text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                            >
                              {likeBackSavingId === profile.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Heart className="w-3.5 h-3.5" />
                              )}
                              Liker en retour
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </section>
            )}

            {matches.length > 0 && (
              <section className="space-y-3">
                <div>
                  <h2 className="font-serif text-lg font-bold text-foreground">Matchs mutuels</h2>
                  <p className="text-sm text-muted-foreground">
                    Un match mutuel est créé quand vous vous likez tous les deux.
                  </p>
                </div>

                {matches.map(match => {
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
                })}
              </section>
            )}
          </>
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
