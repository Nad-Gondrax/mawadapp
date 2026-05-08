"use client"

import { useState } from "react"
import { Shield, CheckCircle, XCircle, MapPin, Globe, BookOpen, Heart, Users } from "lucide-react"
import { MOCK_PROFILES, NIVEAUX_PRATIQUE_LABELS, PROJET_MARIAGE_LABELS, SITUATION_MARITALE_LABELS } from "@/lib/mock-data"

const USER = MOCK_PROFILES.find(p => p.id === "u4")!  // Fatima
const MATCH = MOCK_PROFILES.find(p => p.id === "u1")!  // Youssef

type Decision = "approuve" | "refuse" | null

export default function MahramInterfacePage() {
  const [decision, setDecision] = useState<Decision>(null)

  if (decision) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${decision === "approuve" ? "bg-emerald-100" : "bg-red-100"}`}>
            {decision === "approuve"
              ? <CheckCircle className="w-10 h-10 text-emerald-600" />
              : <XCircle className="w-10 h-10 text-red-600" />
            }
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
              {decision === "approuve" ? "Discussion autorisée" : "Match refusé"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {decision === "approuve"
                ? `Barak Allahu fikoum. Vous avez approuvé la mise en relation entre ${USER.prenom} et ${MATCH.prenom}. La discussion supervisée est maintenant accessible.`
                : `Vous avez refusé ce match. ${USER.prenom} sera informé(e) de votre décision.`
              }
            </p>
          </div>
          {decision === "approuve" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <span className="text-emerald-800 font-semibold text-sm">Discussion supervisée activée</span>
              </div>
              <p className="text-sm text-emerald-700">
                Vous participerez automatiquement à la conversation en tant que superviseur. Tous les messages vous seront visibles.
              </p>
            </div>
          )}
          <button
            onClick={() => setDecision(null)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Retour à l&apos;examen
          </button>
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
            <p className="text-muted-foreground text-xs">Mawada — Validation de mise en relation</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Intro */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-900 font-semibold text-sm">Demande de validation</p>
              <p className="text-amber-800 text-sm mt-1 leading-relaxed">
                Un match mutuel a été détecté entre <strong>{USER.prenom}</strong> et <strong>{MATCH.prenom}</strong>. 
                En tant que mahram de {USER.prenom}, votre approbation est requise avant toute discussion.
                Veuillez examiner les profils ci-dessous.
              </p>
            </div>
          </div>
        </div>

        {/* Profiles comparison */}
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { profile: USER, label: "Votre protégé(e)", color: "primary" },
            { profile: MATCH, label: "Le / La prétendant(e)", color: "accent" },
          ].map(({ profile, label, color }) => (
            <div key={profile.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className={`px-4 py-3 border-b border-border flex items-center gap-2 ${color === "primary" ? "bg-primary/10" : "bg-accent/10"}`}>
                <Users className={`w-4 h-4 ${color === "primary" ? "text-primary" : "text-accent"}`} />
                <span className={`text-sm font-semibold ${color === "primary" ? "text-primary" : "text-accent"}`}>{label}</span>
              </div>
              <div className="p-5 space-y-4">
                {/* Photo + name */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-secondary overflow-hidden">
                    {profile.photo && (
                      <img src={profile.photo} alt={profile.prenom} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-foreground">{profile.prenom}</h3>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <span>{profile.age} ans</span>
                    </div>
                  </div>
                </div>

                {/* Info grid */}
                <div className="space-y-2">
                  <InfoRow icon={<MapPin className="w-4 h-4" />} label="Ville" value={profile.ville} />
                  <InfoRow icon={<Globe className="w-4 h-4" />} label="Origine" value={profile.paysOrigine} />
                  <InfoRow icon={<BookOpen className="w-4 h-4" />} label="Pratique" value={NIVEAUX_PRATIQUE_LABELS[profile.niveauPratique]} />
                  <InfoRow icon={<Users className="w-4 h-4" />} label="Situation" value={SITUATION_MARITALE_LABELS[profile.situationMaritale]} />
                  <InfoRow icon={<Heart className="w-4 h-4" />} label="Projet zawaj" value={PROJET_MARIAGE_LABELS[profile.projetMariage]} />
                </div>

                {/* Traits */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Traits de caractère</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.traits.slice(0, 5).map(t => (
                      <span key={t} className="text-xs bg-secondary px-2.5 py-1 rounded-full text-foreground border border-border">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Presentation */}
                <div className="bg-secondary rounded-xl p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Présentation</p>
                  <p className="text-sm text-foreground leading-relaxed">{profile.presentation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Raisons du match */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            Raisons de compatibilité
          </h3>
          <div className="space-y-2">
            {[
              "Même ville (Paris) — compatibilité géographique",
              "Même pays d'origine (Maroc) — proximité culturelle",
              "Les deux très pratiquants — alignement religieux",
              "Les deux prêts pour le mariage maintenant",
              "Souhaitent tous les deux des enfants",
            ].map((reason, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decision buttons */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Votre décision</h3>
          <p className="text-sm text-muted-foreground">
            En approuvant, vous permettrez une discussion supervisée à trois. Vous aurez accès à tous les messages échangés.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setDecision("refuse")}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition-colors"
            >
              <XCircle className="w-5 h-5" />
              Refuser
            </button>
            <button
              onClick={() => setDecision("approuve")}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-md"
            >
              <CheckCircle className="w-5 h-5" />
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
