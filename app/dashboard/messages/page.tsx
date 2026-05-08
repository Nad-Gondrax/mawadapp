"use client"

import { useRouter } from "next/navigation"
import { Shield, MessageCircle } from "lucide-react"
import { MOCK_PROFILES } from "@/lib/mock-data"

const CONVERSATIONS = [
  {
    id: "conv1",
    partnerId: "u4",
    lastMessage: "Pouvez-vous me parler de votre projet de mariage ?",
    lastTime: "10:15",
    unread: 1,
    mahramApprouve: true,
  },
]

export default function MessagesPage() {
  const router = useRouter()

  return (
    <div className="max-w-2xl mx-auto">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="font-serif text-xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground text-xs">Discussions supervisées</p>
      </header>

      <div className="p-4 space-y-3">
        {CONVERSATIONS.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-foreground font-semibold">Aucune conversation</p>
            <p className="text-muted-foreground text-sm">Vos discussions approuvées apparaîtront ici</p>
          </div>
        )}

        {CONVERSATIONS.map(conv => {
          const partner = MOCK_PROFILES.find(p => p.id === conv.partnerId)
          if (!partner) return null
          return (
            <button
              key={conv.id}
              onClick={() => router.push(`/chat/${conv.id}`)}
              className="w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-4 hover:shadow-md transition-shadow text-left"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-secondary overflow-hidden">
                  {partner.photo && <img src={partner.photo} alt={partner.prenom} className="w-full h-full object-cover" />}
                </div>
                {conv.mahramApprouve && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-card flex items-center justify-center">
                    <Shield className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{partner.prenom}</span>
                  <span className="text-xs text-muted-foreground">{conv.lastTime}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600 font-medium">Supervisée</span>
                </div>
              </div>
              {conv.unread > 0 && (
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                  {conv.unread}
                </div>
              )}
            </button>
          )
        })}

        <div className="bg-secondary border border-border rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Toutes vos discussions sont supervisées par votre mahram. Seuls les échanges approuvés apparaissent ici.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
