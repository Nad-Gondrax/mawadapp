"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Shield, CheckCircle, Clock, Send, ChevronRight } from "lucide-react"

type MahramStatus = "idle" | "sent" | "pending" | "validated"

export default function MahramPage() {
  const [status, setStatus] = useState<MahramStatus>("idle")
  const [form, setForm] = useState({ nom: "", relation: "", email: "", telephone: "" })
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("sent")
    setTimeout(() => setStatus("pending"), 1200)
    setTimeout(() => setStatus("validated"), 3500)
  }

  if (status === "validated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Mahram validé !</h1>
            <p className="text-muted-foreground leading-relaxed">
              {form.nom} a accepté son rôle de mahram. Votre profil est maintenant complet et vous pouvez accéder aux matchs.
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left space-y-2">
            <p className="text-sm font-semibold text-emerald-800">Mahram : {form.nom}</p>
            <p className="text-sm text-emerald-700">Relation : {form.relation}</p>
            <p className="text-sm text-emerald-700">{form.email}</p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/30"
          >
            Accéder à mon espace
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Image src="/logo-mawada.png" alt="Mawada" width={28} height={28} className="rounded-lg" />
          <span className="font-serif font-bold text-foreground">Mawada</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header card */}
        <div className="bg-primary rounded-2xl p-6 text-primary-foreground">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-primary-foreground/20 rounded-2xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold">Ajoutez votre mahram</h1>
              <p className="text-primary-foreground/80 text-sm">Étape obligatoire</p>
            </div>
          </div>
          <p className="text-primary-foreground/90 text-sm leading-relaxed">
            Aucune discussion privée ne sera possible sans validation du mahram. C&apos;est une protection pour vous et pour vos échanges.
          </p>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-2">
          {[
            { s: "sent", icon: <Send className="w-4 h-4" />, label: "Invitation envoyée" },
            { s: "pending", icon: <Clock className="w-4 h-4" />, label: "En attente" },
            { s: "validated", icon: <CheckCircle className="w-4 h-4" />, label: "Mahram validé" },
          ].map((item, idx) => {
            const steps = ["idle", "sent", "pending", "validated"]
            const isActive = steps.indexOf(status) >= steps.indexOf(item.s)
            return (
              <div key={item.s} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {item.icon}
                  <span className="hidden sm:block">{item.label}</span>
                </div>
                {idx < 2 && <div className={`flex-1 h-px ${isActive ? "bg-primary" : "bg-border"}`} />}
              </div>
            )
          })}
        </div>

        {/* Form or status */}
        {(status === "idle" || status === "sent") && (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h2 className="font-semibold text-foreground mb-4">Informations du mahram</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nom complet *</label>
                <input
                  required
                  type="text"
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  placeholder="Nom et prénom"
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Relation *</label>
                <select
                  required
                  value={form.relation}
                  onChange={e => setForm({ ...form, relation: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Sélectionner une relation</option>
                  <option>Père</option>
                  <option>Frère</option>
                  <option>Oncle</option>
                  <option>Tuteur</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Adresse email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="email@exemple.com"
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Téléphone</label>
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={e => setForm({ ...form, telephone: e.target.value })}
                  placeholder="06 XX XX XX XX"
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {status === "sent" ? (
                <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
                  <p className="text-sm text-amber-800">Invitation envoyée... En attente de la réponse du mahram.</p>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
                >
                  <Send className="w-4 h-4" />
                  Envoyer l&apos;invitation au mahram
                </button>
              )}
            </form>
          </div>
        )}

        {status === "pending" && (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-lg">En attente de validation</h2>
              <p className="text-muted-foreground text-sm mt-1">
                {form.nom} a reçu l&apos;invitation. Dès qu&apos;il/elle accepte, vous pourrez accéder aux matchs.
              </p>
            </div>
            <div className="bg-secondary rounded-xl p-4 text-left space-y-1.5">
              <p className="text-sm text-foreground font-medium">Invitation envoyée à :</p>
              <p className="text-sm text-muted-foreground">{form.nom} ({form.relation})</p>
              <p className="text-sm text-muted-foreground">{form.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => router.push("/dashboard")}
          className="w-full py-3 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          Ignorer pour l&apos;instant
        </button>
      </div>
    </div>
  )
}
