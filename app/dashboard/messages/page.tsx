"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Clock, MessageCircle, Shield, XCircle } from "lucide-react"
import { getConversationThreads, getPhotoUnblurStatuses } from "@/lib/supabase-queries"

type ConversationThread = Awaited<ReturnType<typeof getConversationThreads>>[number]

function formatTime(value?: string) {
  if (!value) return ""
  return new Date(value).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

function isThreadUnread(thread: ConversationThread) {
  if (!thread.lastIncomingMessage) return false

  const lastReadAt = window.localStorage.getItem(
    `mawada-conversation-read:${thread.currentUserId}:${thread.conversation.id}`,
  )

  return !lastReadAt || new Date(thread.lastIncomingMessage.created_at).getTime() > new Date(lastReadAt).getTime()
}

function markThreadRead(thread: ConversationThread) {
  const readAt = thread.lastMessage?.created_at || thread.conversation.updated_at
  window.localStorage.setItem(
    `mawada-conversation-read:${thread.currentUserId}:${thread.conversation.id}`,
    readAt,
  )
}

export default function MessagesPage() {
  const router = useRouter()
  const [threads, setThreads] = useState<ConversationThread[]>([])
  const [photoAccessProfileIds, setPhotoAccessProfileIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadThreads() {
      try {
        setLoading(true)
        setError(null)
        const data = await getConversationThreads()
        const photoStatuses = await getPhotoUnblurStatuses(data.map(thread => thread.partner.id))
        if (active) {
          setPhotoAccessProfileIds(
            data
              .filter(thread => photoStatuses.get(thread.partner.id) === "approved")
              .map(thread => thread.partner.id),
          )
          setThreads(data)
        }
      } catch (err) {
        console.error(err)
        if (active) {
          setError("Impossible de charger vos messages pour le moment.")
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadThreads()

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="max-w-2xl mx-auto">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="font-serif text-xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground text-xs">Discussions supervisées</p>
      </header>

      <div className="p-4 space-y-3">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(item => (
              <div key={item} className="h-24 bg-secondary rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && threads.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-foreground font-semibold">Aucune conversation</p>
            <p className="text-muted-foreground text-sm">
              Vos discussions apparaîtront ici après un like réciproque.
            </p>
          </div>
        )}

        {!loading && !error && threads.map(thread => {
          const { conversation, partner, lastMessage } = thread
          const ended = conversation.status === "archived"
          const approved = conversation.mahram_status === "approved" && !ended
          const refused = conversation.mahram_status === "refused"
          const photoHidden = Boolean(partner.photo_blurred) && !photoAccessProfileIds.includes(partner.id)
          const unread = isThreadUnread(thread)

          return (
            <button
              key={conversation.id}
              onClick={() => {
                markThreadRead(thread)
                router.push(`/chat/${conversation.id}`)
              }}
              className={`relative w-full bg-card rounded-2xl border p-4 flex items-center gap-4 hover:shadow-md transition-shadow text-left ${
                unread ? "border-[#FF6B6B]/40 bg-[#FF6B6B]/5" : "border-border"
              }`}
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-secondary overflow-hidden">
                  {partner.photo && <img src={partner.photo} alt={partner.prenom} className={`w-full h-full object-cover ${photoHidden ? "blur-sm scale-105" : ""}`} />}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-card flex items-center justify-center ${
                  ended ? "bg-slate-500" : approved ? "bg-emerald-500" : refused ? "bg-red-500" : "bg-amber-500"
                }`}>
                  {ended ? (
                    <XCircle className="w-2.5 h-2.5 text-white" />
                  ) : approved ? (
                    <Shield className="w-2.5 h-2.5 text-white" />
                  ) : (
                    <Clock className="w-2.5 h-2.5 text-white" />
                  )}
                  </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold text-foreground">
                    {partner.prenom}
                    {unread && (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FF6B6B]" aria-label="Message non lu" />
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(lastMessage?.created_at || conversation.updated_at)}
                  </span>
                </div>
                <p className={`text-sm truncate mt-0.5 ${unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                  {ended ? "Match terminé." : lastMessage?.content || "Match créé. Demande envoyée au Mahram."}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {ended ? (
                    <>
                      <XCircle className="w-3 h-3 text-slate-500" />
                      <span className="text-xs text-slate-600 font-medium">Match terminé</span>
                    </>
                  ) : approved ? (
                    <>
                      <Shield className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-medium">Échange autorisé</span>
                    </>
                  ) : refused ? (
                    <>
                      <Shield className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-red-600 font-medium">Refusé par le mahram</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-amber-600 font-medium">Demande envoyée au Mahram</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          )
        })}

        <div className="bg-secondary border border-border rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Après un match, le Mahram reçoit une demande de validation. L&apos;échange s&apos;ouvre dès son accord.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
