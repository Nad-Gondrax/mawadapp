"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Heart, MessageCircle, Clock, CheckCircle, XCircle } from "lucide-react"
import { MOCK_PROFILES } from "@/lib/mock-data"

interface Match {
  profileId: string
  mahramStatut: "en_attente" | "approuve" | "refuse"
  date: string
}

const MOCK_MATCHES: Match[] = [
  { profileId: "u4", mahramStatut: "approuve", date: "2025-01-10" },
  { profileId: "u5", mahramStatut: "en_attente", date: "2025-01-12" },
]

export default function MatchsPage() {
  const router = useRouter()

  return (
    <div className="max-w-2xl mx-auto">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="font-serif text-xl font-bold text-foreground">Mes Matchs</h1>
        <p className="text-muted-foreground text-xs">{MOCK_MATCHES.length} match(s) mutuel(s)</p>
      </header>

      <div className="p-4 space-y-4">
        {MOCK_MATCHES.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-foreground font-semibold">Aucun match pour l&apos;instant</p>
            <p className="text-muted-foreground text-sm">Continuez à explorer les profils</p>
          </div>
        )}

        {MOCK_MATCHES.map(match => {
          const profile = MOCK_PROFILES.find(p => p.id === match.profileId)
          if (!profile) return null

          return (
            <div key={match.profileId} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              {/* Match banner */}
              <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary fill-primary" />
                <span className="text-primary text-sm font-semibold">Match mutuel détecté !</span>
              </div>

              <div className="p-4 flex gap-4">
                {/* Photo */}
                <div className="w-20 h-20 rounded-2xl bg-secondary overflow-hidden shrink-0">
                  {profile.photo && (
                    <img
                      src={profile.photo}
                      alt={profile.prenom}
                      className={`w-full h-full object-cover ${match.mahramStatut !== "approuve" ? "blur-sm" : ""}`}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{profile.prenom}, {profile.age} ans</h3>
                    <p className="text-sm text-muted-foreground">{profile.ville} · {profile.paysOrigine}</p>
                  </div>

                  {/* Mahram status */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium w-fit ${
                    match.mahramStatut === "approuve"
                      ? "bg-emerald-100 text-emerald-700"
                      : match.mahramStatut === "refuse"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {match.mahramStatut === "approuve" && <><CheckCircle className="w-3.5 h-3.5" /> Discussion autorisée</>}
                    {match.mahramStatut === "en_attente" && <><Clock className="w-3.5 h-3.5 animate-pulse" /> Validation mahram requise</>}
                    {match.mahramStatut === "refuse" && <><XCircle className="w-3.5 h-3.5" /> Refusé par le mahram</>}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {match.mahramStatut === "approuve" && (
                      <button
                        onClick={() => router.push(`/chat/conv1`)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Discuter
                      </button>
                    )}
                    {match.mahramStatut === "en_attente" && (
                      <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                        <Shield className="w-3.5 h-3.5" />
                        En attente du mahram
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Info block */}
        <div className="bg-secondary rounded-2xl p-4 border border-border">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Validation obligatoire du mahram</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Lorsqu&apos;un match mutuel est détecté, votre mahram et celui de votre match reçoivent une notification pour approuver ou refuser la mise en relation. Aucune discussion n&apos;est possible sans leur accord.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
