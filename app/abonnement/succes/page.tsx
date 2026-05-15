"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, Loader2 } from "lucide-react"

function AbonnementSuccesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      setState("error")
      setError("Session de paiement manquante.")
      return
    }

    fetch(`/api/subscription/confirm?session_id=${encodeURIComponent(sessionId)}`)
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Confirmation impossible.")
        setState("success")
      })
      .catch(err => {
        setState("error")
        setError(err instanceof Error ? err.message : "Confirmation impossible.")
      })
  }, [searchParams])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-premium">
        {state === "loading" && (
          <>
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
            <h1 className="font-serif text-2xl font-bold text-foreground">Confirmation du paiement</h1>
            <p className="mt-2 text-sm text-muted-foreground">Votre abonnement est en cours d&apos;activation.</p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
              <Check className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Abonnement activé</h1>
            <p className="mt-2 text-sm text-muted-foreground">Bienvenue dans Taym.</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-6 w-full rounded-2xl bg-primary px-6 py-3 font-semibold text-white"
            >
              Aller au dashboard
            </button>
          </>
        )}

        {state === "error" && (
          <>
            <h1 className="font-serif text-2xl font-bold text-foreground">Vérification à reprendre</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => router.push("/abonnement")}
              className="mt-6 w-full rounded-2xl bg-primary px-6 py-3 font-semibold text-white"
            >
              Retour à l&apos;abonnement
            </button>
          </>
        )}
      </div>
    </main>
  )
}

export default function AbonnementSuccesPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <AbonnementSuccesContent />
    </Suspense>
  )
}
