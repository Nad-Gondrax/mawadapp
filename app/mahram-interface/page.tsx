"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Shield, CheckCircle, XCircle, MapPin, Globe, BookOpen, Heart, Users, Loader2, AlertTriangle, MessageCircle } from "lucide-react"
import { NIVEAUX_PRATIQUE_LABELS, PROJET_MARIAGE_LABELS, SITUATION_MARITALE_LABELS } from "@/lib/mock-data"

type PublicProfile = {
  id: string
  prenom: string
  age: number
  genre: string
  ville: string
  pays_origine: string
  photo: string | null
  niveau_pratique: string | null
  situation_maritale: string | null
  projet_mariage: string | null
  presentation: string | null
  traits: string[] | null
}

type MatchRequestDetails = {
  request: {
    id: string
    status: "pending" | "approved" | "refused"
    mahram_name: string | null
  }
  protectedProfile: PublicProfile
  matchProfile: PublicProfile
}

type Decision = "approved" | "refused" | null

export default function MahramInterfacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <MahramInterfaceContent />
    </Suspense>
  )
}

function MahramInterfaceContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [details, setDetails] = useState<MatchRequestDetails | null>(null)
  const [decision, setDecision] = useState<Decision>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadRequest() {
      if (!token) {
        setLoading(false)
        setError("Lien de validation invalide.")
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/mahram/match-request?token=${token}`)
        const data = await response.json()

        if (!response.ok) throw new Error(data.error || "Chargement impossible")
        if (!active) return

        setDetails(data)
        if (data.request.status !== "pending") {
          setDecision(data.request.status)
        }
      } catch {
        if (active) setError("Impossible de charger cette demande de validation.")
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRequest()

    return () => {
      active = false
    }
  }, [token])

  const submitDecision = async (nextDecision: Exclude<Decision, null>) => {
    if (!token) return

    try {
      setSaving(true)
      setError(null)
      const response = await fetch("/api/mahram/match-request", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, decision: nextDecision }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Decision impossible")

      setDecision(nextDecision)
      setDetails(prev => prev ? { ...prev, request: data.request } : prev)
    } catch {
      setError("Impossible d'enregistrer votre décision. Réessayez.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error && !details) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <p className="font-semibold text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  if (!details) return null

  const protectedProfile = details.protectedProfile
  const matchProfile = details.matchProfile

  if (decision) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${decision === "approved" ? "bg-emerald-100" : "bg-red-100"}`}>
            {decision === "approved"
              ? <CheckCircle className="w-10 h-10 text-emerald-600" />
              : <XCircle className="w-10 h-10 text-red-600" />
            }
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
              {decision === "approved" ? "Discussion autorisée" : "Match refusé"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {decision === "approved"
                ? `Vous avez approuvé la mise en relation entre ${protectedProfile.prenom} et ${matchProfile.prenom}. La discussion supervisée est maintenant accessible.`
                : `Vous avez refusé ce match. La discussion restera bloquée.`
              }
            </p>
          </div>
          {decision === "approved" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <span className="text-emerald-800 font-semibold text-sm">Discussion supervisée activée</span>
                </div>
                <p className="text-sm text-emerald-700">
                  Les messages peuvent maintenant être échangés sous supervision du Mahram.
                </p>
              </div>
              <a
                href={`/mahram/conversation?token=${token}`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Voir la conversation
              </a>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-foreground">Interface Mahram</h1>
            <p className="text-muted-foreground text-xs">Validation de mise en relation</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-900 font-semibold text-sm">Demande de validation</p>
              <p className="text-amber-800 text-sm mt-1 leading-relaxed">
                Un match mutuel a été détecté entre <strong>{protectedProfile.prenom}</strong> et <strong>{matchProfile.prenom}</strong>.
                Votre approbation est requise avant toute discussion.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            { profile: protectedProfile, label: "Votre protégé(e)", color: "primary" },
            { profile: matchProfile, label: "Le / La prétendant(e)", color: "accent" },
          ].map(({ profile, label, color }) => (
            <div key={profile.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className={`px-4 py-3 border-b border-border flex items-center gap-2 ${color === "primary" ? "bg-primary/10" : "bg-accent/10"}`}>
                <Users className={`w-4 h-4 ${color === "primary" ? "text-primary" : "text-accent"}`} />
                <span className={`text-sm font-semibold ${color === "primary" ? "text-primary" : "text-accent"}`}>{label}</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-secondary overflow-hidden">
                    {profile.photo && (
                      <img src={profile.photo} alt={profile.prenom} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-foreground">{profile.prenom}</h3>
                    <p className="text-muted-foreground text-sm">{profile.age} ans</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <InfoRow icon={<MapPin className="w-4 h-4" />} label="Ville" value={profile.ville} />
                  <InfoRow icon={<Globe className="w-4 h-4" />} label="Origine" value={profile.pays_origine} />
                  <InfoRow icon={<BookOpen className="w-4 h-4" />} label="Pratique" value={profile.niveau_pratique ? NIVEAUX_PRATIQUE_LABELS[profile.niveau_pratique] || profile.niveau_pratique : "-"} />
                  <InfoRow icon={<Users className="w-4 h-4" />} label="Situation" value={profile.situation_maritale ? SITUATION_MARITALE_LABELS[profile.situation_maritale] || profile.situation_maritale : "-"} />
                  <InfoRow icon={<Heart className="w-4 h-4" />} label="Projet" value={profile.projet_mariage ? PROJET_MARIAGE_LABELS[profile.projet_mariage] || profile.projet_mariage : "-"} />
                </div>

                {!!profile.traits?.length && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Traits</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.traits.slice(0, 5).map(t => (
                        <span key={t} className="text-xs bg-secondary px-2.5 py-1 rounded-full text-foreground border border-border">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.presentation && (
                  <div className="bg-secondary rounded-xl p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Présentation</p>
                    <p className="text-sm text-foreground leading-relaxed">{profile.presentation}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Votre décision</h3>
          <p className="text-sm text-muted-foreground">
            En approuvant, vous permettrez une discussion supervisée. Sans approbation, l&apos;échange reste bloqué.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => submitDecision("refused")}
              disabled={saving}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition-colors disabled:opacity-60"
            >
              <XCircle className="w-5 h-5" />
              Refuser
            </button>
            <button
              onClick={() => submitDecision("approved")}
              disabled={saving}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              Approuver
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground w-4">{icon}</span>
      <span className="text-muted-foreground w-16 shrink-0">{label} :</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  )
}
