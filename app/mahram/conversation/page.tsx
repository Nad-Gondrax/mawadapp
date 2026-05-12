"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AlertTriangle, CheckCircle, Loader2, Lock, Shield } from "lucide-react"

type PublicProfile = {
  id: string
  prenom: string | null
  age: number | null
  genre: string | null
  ville: string | null
  pays_origine: string | null
  photo: string | null
}

type SupervisedMessage = {
  id: string
  sender_id: string
  content: string
  created_at: string
  flagged: boolean
  flag_reason: string | null
}

type SupervisedConversation = {
  request: {
    id: string
    mahram_name: string | null
    status: "pending" | "approved" | "refused"
  }
  protectedProfile: PublicProfile
  matchProfile: PublicProfile
  messages: SupervisedMessage[]
}

export default function MahramConversationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <MahramConversationContent />
    </Suspense>
  )
}

function MahramConversationContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [details, setDetails] = useState<SupervisedConversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true

    async function loadConversation() {
      if (!token) {
        setLoading(false)
        setError("Lien de supervision invalide.")
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/mahram/conversation?token=${token}`)
        const data = await response.json()

        if (!response.ok) throw new Error(data.error || "Chargement impossible")
        if (!active) return

        setDetails(data)
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Impossible de charger cette conversation.")
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadConversation()

    return () => {
      active = false
    }
  }, [token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [details?.messages.length])

  const profileById = useMemo(() => {
    if (!details) return new Map<string, PublicProfile>()
    return new Map([
      [details.protectedProfile.id, details.protectedProfile],
      [details.matchProfile.id, details.matchProfile],
    ])
  }, [details])

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <p className="font-semibold text-red-800">{error || "Conversation introuvable."}</p>
        </div>
      </div>
    )
  }

  const protectedProfile = details.protectedProfile
  const matchProfile = details.matchProfile

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif font-bold text-foreground">Conversation supervisée</h1>
            <p className="text-muted-foreground text-xs truncate">
              {protectedProfile.prenom} et {matchProfile.prenom}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Accès Mahram en lecture seule</p>
              <p className="text-sm text-emerald-800 mt-1 leading-relaxed">
                Vous pouvez consulter l&apos;échange. Vous ne pouvez pas envoyer de message depuis cette interface.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[protectedProfile, matchProfile].map(profile => (
            <div key={profile.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-secondary overflow-hidden shrink-0">
                <img
                  src={profile.photo || (profile.genre === "femme" ? "/profil_femme.png" : "/profil_homme.png")}
                  alt={profile.prenom || "Profil"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{profile.prenom || "Profil"}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile.age ? `${profile.age} ans` : "Age non indiqué"} · {profile.ville || "Ville non indiquée"}
                </p>
              </div>
            </div>
          ))}
        </div>

        <section className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="border-b border-border px-4 py-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Messages</p>
          </div>

          <div className="min-h-[360px] max-h-[65vh] overflow-y-auto p-4 space-y-4">
            {details.messages.length === 0 ? (
              <div className="h-72 flex flex-col items-center justify-center text-center">
                <Shield className="w-10 h-10 text-primary mb-3" />
                <p className="font-semibold text-foreground">Aucun message pour le moment</p>
                <p className="text-sm text-muted-foreground mt-1">
                  La conversation apparaîtra ici dès qu&apos;ils commenceront à échanger.
                </p>
              </div>
            ) : (
              details.messages.map(message => {
                const sender = profileById.get(message.sender_id)
                const isProtected = message.sender_id === protectedProfile.id

                return (
                  <div key={message.id} className={`flex ${isProtected ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[82%] flex flex-col gap-1 ${isProtected ? "items-start" : "items-end"}`}>
                      <span className="text-xs text-muted-foreground px-1">
                        {sender?.prenom || "Utilisateur"} · {formatTime(message.created_at)}
                      </span>
                      <div className={`rounded-2xl px-4 py-3 ${
                        isProtected
                          ? "bg-secondary text-foreground rounded-bl-md"
                          : "bg-primary text-primary-foreground rounded-br-md"
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      </div>
                      {message.flagged && (
                        <span className="text-xs text-red-600 px-1">
                          Message marqué : {message.flag_reason || "à vérifier"}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>
        </section>
      </main>
    </div>
  )
}
