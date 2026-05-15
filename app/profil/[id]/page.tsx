"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  ChevronLeft, MapPin, Globe, BookOpen, Users, Heart, Pencil, 
  GraduationCap, Briefcase, Ruler, Shirt, Home, Baby, Sparkles, CircleUserRound,
  HeartHandshake, Flame, MessageCircle, UserCheck, Loader2, PersonStanding, UserRound,
  Camera, Trash2, Eye, EyeOff, Lock, CheckCircle, XCircle
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { addLike } from "@/lib/supabase-queries"
import { getUserFacingError } from "@/lib/user-facing-errors"
import {
  NIVEAUX_PRATIQUE_LABELS, NIVEAUX_ETUDES_LABELS,
  PROJET_MARIAGE_LABELS, SITUATION_MARITALE_LABELS
} from "@/lib/mock-data"

// Labels pour les nouveaux champs
const SILHOUETTE_LABELS: Record<string, string> = {
  mince: "Mince",
  normal: "Normal",
  atheltique: "Athlétique",
  ronde: "Ronde",
  forte: "Forte",
}

const HIJAB_LABELS: Record<string, string> = {
  oui_jilbab: "Jilbab",
  oui_turban: "Turban / Hijab classique",
  non: "Ne porte pas le voile",
}

const AVEC_QUI_LABELS: Record<string, string> = {
  seul: "Seul(e)",
  parents: "Chez mes parents",
  colocataires: "En colocation",
  enfants: "Avec mes enfants",
}

const RELATION_SEXE_LABELS: Record<string, string> = {
  aucune: "Aucune relation",
  quelques_amis: "Quelques ami(e)s",
  travail: "Uniquement au travail",
  amicale: "Relations amicales",
  mixte: "Environnement mixte",
}

const ACCEPTE_LABELS: Record<string, string> = {
  oui: "Oui",
  non: "Non",
  peut_etre: "Peut-être",
}

interface Profile {
  id: string
  prenom: string
  age: number
  genre: string
  ville: string
  pays_origine: string
  photo: string | null
  photo_blurred?: boolean | null
  taille: number | null
  silhouette: string | null
  barbe: boolean | null
  hijab: string | null
  style_vestimentaire: string[]
  traits: string[]
  profession: string | null
  niveau_etudes: string | null
  niveau_etudes_autre: string | null
  situation_pro: string | null
  niveau_pratique: string | null
  pratique_priere: string | null
  situation_maritale: string | null
  avec_qui: string | null
  projet_mariage: string | null
  souhaite_enfants: string | null
  nombre_enfants: number | null
  origine_pere_pays1: string | null
  origine_pere_pays2: string | null
  origine_mere_pays1: string | null
  origine_mere_pays2: string | null
  relation_sexe_oppose: string | null
  accepte_enfants: string | null
  accepte_divorce: string | null
  style_amour: string[]
  style_vie: string[]
  gestion_conflits: string[]
  attraits: string[]
  repoussants: string[]
  presentation: string | null
  onboarding_complete: boolean
  mahram_statut?: string
}

type PhotoUnblurStatus = "pending" | "approved" | "refused"

type IncomingPhotoRequest = {
  id: string
  requester_id: string
  status: PhotoUnblurStatus
  created_at: string
  requester?: {
    id: string
    prenom: string | null
    age: number | null
    ville: string | null
  } | null
}

export default function ProfilPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMe, setIsMe] = useState(false)
  const [resolvedId, setResolvedId] = useState<string | null>(null)
  const [photoSaving, setPhotoSaving] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeSaving, setLikeSaving] = useState(false)
  const [likeError, setLikeError] = useState<string | null>(null)
  const [matched, setMatched] = useState(false)
  const [matchWarning, setMatchWarning] = useState<string | null>(null)
  const [photoRequestStatus, setPhotoRequestStatus] = useState<PhotoUnblurStatus | null>(null)
  const [incomingPhotoRequests, setIncomingPhotoRequests] = useState<IncomingPhotoRequest[]>([])
  const [photoPrivacySaving, setPhotoPrivacySaving] = useState(false)
  const [photoPrivacyError, setPhotoPrivacyError] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadProfile = async () => {
      const { id } = await params
      setResolvedId(id)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (id === "me" && user) {
        setIsMe(true)
        setLiked(false)
        // Charger son propre profil complet depuis profiles
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        setProfile(data)
        await loadIncomingPhotoRequests(supabase, user.id)
      } else {
        // Charger un autre profil depuis profiles_public
        const { data } = await supabase
          .from("profiles_public")
          .select("*")
          .eq("id", id)
          .single()
        setProfile(data)
        const viewingOwnProfile = user?.id === id
        setIsMe(viewingOwnProfile)

        if (user && !viewingOwnProfile) {
          const [likeResponse, photoRequestResponse] = await Promise.all([
            supabase
              .from("likes")
              .select("id")
              .eq("from_user_id", user.id)
              .eq("to_user_id", id)
              .maybeSingle(),
            supabase
              .from("photo_unblur_requests")
              .select("status")
              .eq("requester_id", user.id)
              .eq("requested_user_id", id)
              .maybeSingle(),
          ])

          setLiked(Boolean(likeResponse.data))
          setPhotoRequestStatus((photoRequestResponse.data?.status as PhotoUnblurStatus | undefined) || null)
        } else {
          setLiked(false)
          setPhotoRequestStatus(null)
        }
      }
      setLoading(false)
    }

    async function loadIncomingPhotoRequests(supabase: ReturnType<typeof createClient>, userId: string) {
      const { data: requests } = await supabase
        .from("photo_unblur_requests")
        .select("id, requester_id, status, created_at")
        .eq("requested_user_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      const requestRows = (requests || []) as IncomingPhotoRequest[]
      const requesterIds = requestRows.map(request => request.requester_id)

      if (requesterIds.length === 0) {
        setIncomingPhotoRequests([])
        return
      }

      const { data: requesterProfiles } = await supabase
        .from("profiles_public")
        .select("id, prenom, age, ville")
        .in("id", requesterIds)

      setIncomingPhotoRequests(
        requestRows.map(request => ({
          ...request,
          requester: requesterProfiles?.find(requester => requester.id === request.requester_id) || null,
        })),
      )
    }

    loadProfile()
  }, [params])

  useEffect(() => {
    if (!matched) return
    const timeout = window.setTimeout(() => setMatched(false), 4500)
    return () => window.clearTimeout(timeout)
  }, [matched])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Profil introuvable</p>
        <button onClick={() => router.back()} className="text-primary hover:underline">
          Retour
        </button>
      </div>
    )
  }

  // Construire les origines
  const originesPere = [profile.origine_pere_pays1, profile.origine_pere_pays2].filter(Boolean).join(" / ")
  const originesMere = [profile.origine_mere_pays1, profile.origine_mere_pays2].filter(Boolean).join(" / ")

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !profile) return

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Format non supporté. Utilisez JPEG, PNG ou WebP.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("La photo ne doit pas dépasser 5 MB.")
      return
    }

    setPhotoSaving(true)
    setPhotoError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id !== profile.id) throw new Error("Non autorisé")

      const ext = file.name.split(".").pop() || "jpg"
      const filePath = `${user.id}/avatar-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)

      const { data, error } = await supabase
        .from("profiles")
        .update({ photo: urlData.publicUrl })
        .eq("id", user.id)
        .select("*")
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      setPhotoError(getUserFacingError(error, "photoUpload"))
    } finally {
      setPhotoSaving(false)
    }
  }

  const handlePhotoDelete = async () => {
    if (!profile?.photo) return

    setPhotoSaving(true)
    setPhotoError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id !== profile.id) throw new Error("Non autorisé")

      const { data, error } = await supabase
        .from("profiles")
        .update({ photo: null })
        .eq("id", user.id)
        .select("*")
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      setPhotoError(getUserFacingError(error, "photoDelete"))
    } finally {
      setPhotoSaving(false)
    }
  }

  const handlePhotoBlurToggle = async () => {
    if (!profile || !isMe) return

    setPhotoPrivacySaving(true)
    setPhotoPrivacyError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id !== profile.id) throw new Error("Non autorisé")

      const { data, error } = await supabase
        .from("profiles")
        .update({ photo_blurred: !profile.photo_blurred })
        .eq("id", user.id)
        .select("*")
        .single()

      if (error) throw error
      setProfile(data)
    } catch {
      setPhotoPrivacyError("Impossible de modifier la confidentialité de la photo.")
    } finally {
      setPhotoPrivacySaving(false)
    }
  }

  const handlePhotoUnblurRequest = async () => {
    if (!profile || isMe || photoRequestStatus) return

    setPhotoPrivacySaving(true)
    setPhotoPrivacyError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Non authentifié")

      const { error } = await supabase
        .from("photo_unblur_requests")
        .insert({
          requester_id: user.id,
          requested_user_id: profile.id,
          status: "pending",
        })

      if (error) throw error
      setPhotoRequestStatus("pending")
    } catch {
      setPhotoPrivacyError("Impossible d'envoyer la demande de défloutage.")
    } finally {
      setPhotoPrivacySaving(false)
    }
  }

  const handlePhotoUnblurDecision = async (requestId: string, status: "approved" | "refused") => {
    setPhotoPrivacySaving(true)
    setPhotoPrivacyError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("photo_unblur_requests")
        .update({ status })
        .eq("id", requestId)

      if (error) throw error
      setIncomingPhotoRequests(prev => prev.filter(request => request.id !== requestId))
    } catch {
      setPhotoPrivacyError("Impossible d'enregistrer la décision.")
    } finally {
      setPhotoPrivacySaving(false)
    }
  }

  const handleLike = async () => {
    if (!profile || isMe || liked) return

    setLikeSaving(true)
    setLikeError(null)
    setMatchWarning(null)

    try {
      const result = await addLike(profile.id)
      const mahramRequest = result.mahramRequest as { email?: { sent?: boolean; reason?: string } } | null
      const mahramEmailFailed = mahramRequest?.email?.sent === false && mahramRequest.email.reason !== "No mahram email"

      setLiked(true)
      setMatched(result.matched)
      setMatchWarning(result.matched && (!mahramRequest || mahramEmailFailed) ? getUserFacingError(new Error("mahram request failed"), "match") : null)
    } catch (error) {
      setLikeError(getUserFacingError(error, "like"))
    } finally {
      setLikeSaving(false)
    }
  }

  const hasPhotoAccess = isMe || !profile.photo_blurred || photoRequestStatus === "approved"
  const shouldBlurProfilePhoto = Boolean(profile.photo_blurred) && !hasPhotoAccess

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="font-serif font-bold text-foreground flex-1">
          {isMe ? "Mon profil" : `Profil de ${profile.prenom}`}
        </h1>
        {isMe && (
          <button
            onClick={() => router.push("/onboarding?edit=1")}
            className="flex items-center gap-1.5 px-3 py-2 bg-secondary border border-border rounded-xl text-sm font-medium hover:bg-border transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Modifier
          </button>
        )}
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Hero photo */}
        <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
          {isMe && (
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
            />
          )}
          <img
            src={profile.photo || (profile.genre === "femme" ? "/profil_femme.png" : "/profil_homme.png")}
            alt={`Photo de ${profile.prenom}`}
            className={`w-full h-full object-cover transition-all ${shouldBlurProfilePhoto ? "blur-md scale-105" : ""}`}
          />
          {shouldBlurProfilePhoto && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#102A2A]/10">
              <div className="rounded-2xl bg-white/90 px-4 py-2 text-sm font-semibold text-foreground shadow">
                Photo privée
              </div>
            </div>
          )}
          {isMe && (
            <div className="absolute left-4 bottom-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={photoSaving}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/95 text-foreground rounded-xl text-xs font-semibold shadow hover:bg-white disabled:opacity-60 transition-colors"
              >
                {photoSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                Changer
              </button>
              <button
                type="button"
                onClick={handlePhotoDelete}
                disabled={!profile.photo || photoSaving}
                title={profile.photo ? "Supprimer la photo" : "Aucune photo personnelle à supprimer"}
                className={`flex items-center gap-1.5 px-3 py-2 bg-white/95 rounded-xl text-xs font-semibold shadow transition-colors ${
                  profile.photo
                    ? "text-destructive hover:bg-white"
                    : "text-muted-foreground cursor-not-allowed opacity-70"
                } disabled:opacity-60`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer
              </button>
              <button
                type="button"
                onClick={handlePhotoBlurToggle}
                disabled={photoPrivacySaving}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/95 text-foreground rounded-xl text-xs font-semibold shadow hover:bg-white disabled:opacity-60 transition-colors"
              >
                {profile.photo_blurred ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {profile.photo_blurred ? "Rendre visible" : "Flouter"}
              </button>
            </div>
          )}
        </div>
        {isMe && photoError && (
          <div className="mx-4 mt-3 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {photoError}
          </div>
        )}
        {photoPrivacyError && (
          <div className="mx-4 mt-3 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {photoPrivacyError}
          </div>
        )}

        <div className="px-4 py-6 space-y-6">
          {/* Nom et infos de base */}
          <div>
            <h2 className="font-serif text-3xl font-bold text-foreground">{profile.prenom}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-muted-foreground text-sm">
              <span className="font-semibold text-foreground text-lg">{profile.age} ans</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.ville}</span>
              <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{profile.pays_origine}</span>
            </div>
          </div>

          {!isMe && (
            <div className="space-y-2">
              {profile.photo_blurred && (
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">Photo floutée volontairement</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Vous pouvez demander à {profile.prenom} l’autorisation de voir sa photo nette.
                      </p>
                    </div>
                  </div>
                  {photoRequestStatus === "approved" ? (
                    <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                      Demande acceptée : la photo est visible pour vous.
                    </p>
                  ) : photoRequestStatus === "pending" ? (
                    <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                      Demande envoyée. En attente de réponse.
                    </p>
                  ) : photoRequestStatus === "refused" ? (
                    <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                      Demande refusée.
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePhotoUnblurRequest}
                      disabled={photoPrivacySaving}
                      className="w-full rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/15 disabled:opacity-60"
                    >
                      Demander à voir la photo
                    </button>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={handleLike}
                disabled={liked || likeSaving}
                className={`w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg transition-all disabled:opacity-80 ${
                  liked
                    ? "border-2 border-[#FF6B6B]/30 bg-[#FF6B6B]/10 text-[#FF6B6B] shadow-none"
                    : "bg-[#FF6B6B] text-white shadow-[#FF6B6B]/20 hover:bg-[#FF6B6B]/90"
                }`}
              >
                {likeSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Heart className={`w-4 h-4 ${liked ? "fill-[#FF6B6B]" : ""}`} />
                )}
                {liked ? "Profil liké" : "J'aime ce profil"}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                Si la personne vous like aussi, vous pourrez échanger, sous supervision du Mahram.
              </p>
              {likeError && (
                <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {likeError}
                </p>
              )}
            </div>
          )}

          {isMe && incomingPhotoRequests.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">Demandes de défloutage</h3>
              </div>
              {incomingPhotoRequests.map(request => (
                <div key={request.id} className="rounded-xl border border-border p-3 space-y-3">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{request.requester?.prenom || "Un profil"}</span>
                    {request.requester?.age ? `, ${request.requester.age} ans` : ""}
                    {request.requester?.ville ? ` · ${request.requester.ville}` : ""} souhaite voir votre photo nette.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePhotoUnblurDecision(request.id, "refused")}
                      disabled={photoPrivacySaving}
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
                    >
                      <XCircle className="w-4 h-4" />
                      Refuser
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePhotoUnblurDecision(request.id, "approved")}
                      disabled={photoPrivacySaving}
                      className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accepter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Presentation */}
          {profile.presentation && (
            <div className="bg-secondary rounded-2xl p-4">
              <p className="text-foreground leading-relaxed italic">{`"${profile.presentation}"`}</p>
            </div>
          )}

          {/* SECTION: Pratique religieuse */}
          <Section title="Pratique religieuse">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard
                icon={<BookOpen className="w-4 h-4" />}
                label="Niveau"
                value={profile.niveau_pratique ? NIVEAUX_PRATIQUE_LABELS[profile.niveau_pratique] || profile.niveau_pratique : "-"}
              />
              <InfoCard
                icon={<Sparkles className="w-4 h-4" />}
                label="Prière"
                value={profile.pratique_priere || "-"}
              />
            </div>
            {profile.relation_sexe_oppose && (
              <div className="mt-3 bg-card rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">Relation avec le sexe opposé</p>
                <p className="text-sm font-medium text-foreground">{RELATION_SEXE_LABELS[profile.relation_sexe_oppose] || profile.relation_sexe_oppose}</p>
              </div>
            )}
          </Section>

          {/* SECTION: Situation */}
          <Section title="Situation">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard
                icon={<Users className="w-4 h-4" />}
                label="Situation"
                value={profile.situation_maritale ? SITUATION_MARITALE_LABELS[profile.situation_maritale] || profile.situation_maritale : "-"}
              />
              <InfoCard
                icon={<Heart className="w-4 h-4" />}
                label="Projet"
                value={profile.projet_mariage ? PROJET_MARIAGE_LABELS[profile.projet_mariage] || profile.projet_mariage : "-"}
              />
              <InfoCard
                icon={<Home className="w-4 h-4" />}
                label="Vit"
                value={profile.avec_qui ? AVEC_QUI_LABELS[profile.avec_qui] || profile.avec_qui : "-"}
              />
              <InfoCard
                icon={<Baby className="w-4 h-4" />}
                label="Souhaite enfants"
                value={
                  profile.souhaite_enfants === "oui" 
                    ? "Oui" 
                    : profile.souhaite_enfants === "non" 
                    ? "Non" 
                    : profile.souhaite_enfants === "sais_pas"
                    ? "Ne sait pas"
                    : profile.souhaite_enfants || "-"
                }
              />
            </div>
            {/* A des enfants */}
            {profile.nombre_enfants !== null && profile.nombre_enfants > 0 && (
              <div className="mt-3 bg-card rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">A des enfants</p>
                <p className="text-sm font-medium text-foreground">Oui ({profile.nombre_enfants} enfant{profile.nombre_enfants > 1 ? "s" : ""})</p>
              </div>
            )}

            {/* Ouverture */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              {profile.accepte_divorce && (
                <div className="bg-card rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">Accepte une personne divorcée</p>
                  <p className="text-sm font-medium text-foreground">{ACCEPTE_LABELS[profile.accepte_divorce] || profile.accepte_divorce}</p>
                </div>
              )}
              {profile.accepte_enfants && (
                <div className="bg-card rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">Accepte enfants du conjoint</p>
                  <p className="text-sm font-medium text-foreground">{ACCEPTE_LABELS[profile.accepte_enfants] || profile.accepte_enfants}</p>
                </div>
              )}
            </div>
          </Section>

          {/* SECTION: Education & Profession */}
          <Section title="Parcours">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard
                icon={<GraduationCap className="w-4 h-4" />}
                label="Études"
                value={profile.niveau_etudes ? (NIVEAUX_ETUDES_LABELS[profile.niveau_etudes] || profile.niveau_etudes) + (profile.niveau_etudes_autre ? ` (${profile.niveau_etudes_autre})` : "") : "-"}
              />
              <InfoCard
                icon={<Briefcase className="w-4 h-4" />}
                label="Profession"
                value={profile.profession || "-"}
              />
            </div>
            {profile.situation_pro && (
              <div className="mt-3 bg-card rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">Situation professionnelle</p>
                <p className="text-sm font-medium text-foreground">{profile.situation_pro}</p>
              </div>
            )}
          </Section>

          {/* SECTION: Origines */}
          {(originesPere || originesMere) && (
            <Section title="Origines familiales">
              <div className="grid grid-cols-2 gap-3">
                {originesPere && (
                  <div className="bg-card rounded-xl border border-border p-3">
                    <p className="text-xs text-muted-foreground">Origines du pere</p>
                    <p className="text-sm font-medium text-foreground">{originesPere}</p>
                  </div>
                )}
                {originesMere && (
                  <div className="bg-card rounded-xl border border-border p-3">
                    <p className="text-xs text-muted-foreground">Origines de la mère</p>
                    <p className="text-sm font-medium text-foreground">{originesMere}</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* SECTION: Apparence */}
          <Section title="Apparence">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {profile.taille && (
                <div className="bg-card rounded-xl border border-border p-3 text-center">
                  <Ruler className="w-4 h-4 mx-auto text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">Taille</p>
                  <p className="text-sm font-semibold text-foreground">{profile.taille} cm</p>
                </div>
              )}
              {profile.silhouette && (
                <div className="bg-card rounded-xl border border-border p-3 text-center">
                  <PersonStanding className="w-4 h-4 mx-auto text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">Silhouette</p>
                  <p className="text-sm font-semibold text-foreground">{SILHOUETTE_LABELS[profile.silhouette] || profile.silhouette}</p>
                </div>
              )}
              {profile.genre === "homme" && profile.barbe !== null && (
                <div className="bg-card rounded-xl border border-border p-3 text-center">
                  <UserRound className="w-4 h-4 mx-auto text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">Barbe</p>
                  <p className="text-sm font-semibold text-foreground">{profile.barbe ? "Oui" : "Non"}</p>
                </div>
              )}
              {profile.genre === "femme" && profile.hijab && (
                <div className="bg-card rounded-xl border border-border p-3 text-center">
                  <CircleUserRound className="w-4 h-4 mx-auto text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">Hijab</p>
                  <p className="text-sm font-semibold text-foreground">{HIJAB_LABELS[profile.hijab] || profile.hijab}</p>
                </div>
              )}
            </div>
            {/* Style vestimentaire */}
            {profile.style_vestimentaire && profile.style_vestimentaire.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Shirt className="w-3.5 h-3.5" /> Style vestimentaire</p>
                <div className="flex flex-wrap gap-2">
                  {profile.style_vestimentaire.map(s => (
                    <span key={s} className="px-3 py-1.5 bg-secondary text-foreground text-sm rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* SECTION: Personnalite */}
          {profile.traits && profile.traits.length > 0 && (
            <Section title="Personnalite">
              <div className="flex flex-wrap gap-2">
                {profile.traits.map(t => (
                  <span key={t} className="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full font-medium border border-primary/20">
                    {t}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* SECTION: Style d'amour */}
          {profile.style_amour && profile.style_amour.length > 0 && (
            <Section title="En amour">
              <div className="flex flex-wrap gap-2">
                {profile.style_amour.map(s => (
                  <span key={s} className="px-3 py-1.5 bg-pink-100 text-pink-700 text-sm rounded-full flex items-center gap-1">
                    <HeartHandshake className="w-3.5 h-3.5" />{s}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* SECTION: Style de vie */}
          {profile.style_vie && profile.style_vie.length > 0 && (
            <Section title="Style de vie">
              <div className="flex flex-wrap gap-2">
                {profile.style_vie.map(s => (
                  <span key={s} className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-full flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />{s}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* SECTION: Gestion des conflits */}
          {profile.gestion_conflits && profile.gestion_conflits.length > 0 && (
            <Section title="En cas de conflit">
              <div className="flex flex-wrap gap-2">
                {profile.gestion_conflits.map(g => (
                  <span key={g} className="px-3 py-1.5 bg-amber-100 text-amber-700 text-sm rounded-full flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />{g}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* SECTION: Attraits & Repoussants */}
          <div className="grid sm:grid-cols-2 gap-4">
            {profile.attraits && profile.attraits.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-3 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" /> Ce qui m&apos;attire
                </p>
                <ul className="space-y-2">
                  {profile.attraits.map((a, i) => a && (
                    <li key={i} className="flex items-center gap-2 text-sm text-emerald-900">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {profile.repoussants && profile.repoussants.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-3">Ce qui me repousse</p>
                <ul className="space-y-2">
                  {profile.repoussants.map((r, i) => r && (
                    <li key={i} className="flex items-center gap-2 text-sm text-red-900">
                      <span className="w-3.5 h-3.5 text-red-400 shrink-0 font-bold text-base leading-none">x</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      {matched && (
        <div className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-sm rounded-2xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground shadow-lg">
          {matchWarning || "Match réciproque détecté. Retrouvez-le dans vos matchs."}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  )
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-3">
      <div className="flex items-center gap-1.5 text-primary mb-1">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
      <p className="text-sm font-semibold text-foreground leading-tight">{value}</p>
    </div>
  )
}
