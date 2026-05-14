"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, CreditCard, Loader2, Sparkles, TicketPercent } from "lucide-react"

type SubscriptionStatus = {
  active: boolean
  setupRequired?: boolean
  subscription?: {
    status: string
    source: string
    stripe_current_period_end: string | null
  } | null
}

function AbonnementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [promoCode, setPromoCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/subscription/status")
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(() => setStatus({ active: false }))
  }, [])

  const startCheckout = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: promoCode.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Paiement indisponible pour le moment.")
        return
      }

      if (data.freeAccess && data.redirectUrl) {
        router.push(data.redirectUrl)
        return
      }

      if (data.url) {
        window.location.href = data.url
        return
      }

      setError("Lien de paiement introuvable.")
    } finally {
      setLoading(false)
    }
  }

  const isCanceled = searchParams.get("paiement") === "annule"

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Abonnement Mawada</p>
          <h1 className="mt-2 font-serif text-4xl font-bold text-foreground">Accédez aux rencontres sérieuses</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Votre compte est prêt. L&apos;abonnement débloque la découverte, les matchs et les conversations supervisées.
          </p>
        </div>

        {isCanceled && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Paiement annulé. Vous pouvez reprendre quand vous voulez.
          </div>
        )}

        {status?.setupRequired && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Les tables d&apos;abonnement ne sont pas encore installées dans Supabase. Lancez le script <span className="font-semibold">scripts/09_subscriptions_promos.sql</span>.
          </div>
        )}

        {status?.active ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <Check className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
            <h2 className="font-serif text-2xl font-bold text-foreground">Abonnement actif</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Vous pouvez accéder à votre espace Mawada.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-5 rounded-2xl bg-primary px-6 py-3 font-semibold text-white shadow-lg shadow-primary/20"
            >
              Aller au dashboard
            </button>
          </div>
        ) : (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-premium">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Formule unique</p>
                <div className="mt-1 flex items-end gap-2">
                  <span className="font-serif text-5xl font-bold text-foreground">24,90€</span>
                  <span className="pb-2 text-muted-foreground">/ mois</span>
                </div>
              </div>
              <div className="rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
                Sans engagement. Géré par Stripe.
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-foreground md:grid-cols-2">
              {[
                "Découverte des profils compatibles",
                "Likes et matchs mutuels",
                "Messages après validation Mahram",
                "Photo floutée et demandes de dévoilement",
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-background p-4">
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <TicketPercent className="h-4 w-4 text-primary" />
                Code promo
              </label>
              <input
                value={promoCode}
                onChange={event => setPromoCode(event.target.value)}
                placeholder="Exemple : BIENVENUE"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Vous pouvez aussi saisir un code promo directement sur la page Stripe.
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={startCheckout}
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
              Continuer vers le paiement
            </button>
          </section>
        )}
      </div>
    </main>
  )
}

export default function AbonnementPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <AbonnementContent />
    </Suspense>
  )
}
