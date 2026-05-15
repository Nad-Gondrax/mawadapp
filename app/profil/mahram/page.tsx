"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, Shield, CheckCircle, Clock, Mail, Phone } from "lucide-react"
import { CURRENT_USER } from "@/lib/mock-data"

export default function MonMahramPage() {
  const router = useRouter()
  const mahram = CURRENT_USER.mahram

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="font-serif font-bold text-foreground">Mon mahram</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Status banner */}
        <div className={`rounded-2xl p-5 flex items-center gap-4 ${mahram?.statut === "valide" ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${mahram?.statut === "valide" ? "bg-emerald-100" : "bg-amber-100"}`}>
            {mahram?.statut === "valide"
              ? <CheckCircle className="w-7 h-7 text-emerald-600" />
              : <Clock className="w-7 h-7 text-amber-600 animate-pulse" />
            }
          </div>
          <div>
            <p className={`font-semibold ${mahram?.statut === "valide" ? "text-emerald-800" : "text-amber-800"}`}>
              {mahram?.statut === "valide" ? "Mahram validé" : "En attente de validation"}
            </p>
            <p className={`text-sm mt-0.5 ${mahram?.statut === "valide" ? "text-emerald-700" : "text-amber-700"}`}>
              {mahram?.statut === "valide"
                ? "Vous pouvez accéder aux discussions supervisées."
                : "Votre mahram n'a pas encore accepté l'invitation."
              }
            </p>
          </div>
        </div>

        {/* Mahram info */}
        {mahram && (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="bg-primary/5 border-b border-border px-5 py-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{mahram.nom}</h2>
                <p className="text-sm text-muted-foreground">{mahram.relation}</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{mahram.email}</span>
              </div>
              {mahram.telephone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{mahram.telephone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info card */}
        <div className="bg-secondary rounded-2xl border border-border p-5 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Rôle du mahram
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              "Valide chaque nouveau match mutuel avant toute discussion",
              "Supervise toutes les conversations à trois",
              "Peut approuver ou refuser une mise en relation",
              "Reçoit des notifications pour chaque nouveau match",
            ].map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Mahram interface info */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-2">Interface du mahram</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Il n&apos;y a pas de lien permanent vers l&apos;interface Mahram. Pour des raisons de sécurité,
            Taym envoie automatiquement un lien unique par email au Mahram quand un match mutuel doit être validé.
          </p>
        </div>

        <button
          onClick={() => router.push("/mahram")}
          className="w-full py-3 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          Changer de mahram
        </button>
      </div>
    </div>
  )
}
