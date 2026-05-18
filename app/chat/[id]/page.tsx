"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle, ChevronLeft, HeartHandshake, Info, Loader2, Mail, Phone, Send, Shield, XCircle } from "lucide-react"
import {
  getConversationDetails,
  getConversationProgress,
  getMessages,
  getPhotoUnblurStatuses,
  sendMessage,
  updateConversationProgress,
  type ConversationProgress,
} from "@/lib/supabase-queries"
import { getUserFacingError } from "@/lib/user-facing-errors"

const FORBIDDEN_PATTERNS = [
  /\b0[67]\d{8}\b/,            // French phone numbers
  /\b\+33\s?[67]\d{8}\b/,     // International format
  /\d{10,}/,                    // Any 10+ digit string
  /[\w.+%-]+@[\w-]+\.[a-z]+/i, // Email addresses
  /whatsapp/i,
  /instagram/i,
  /snapchat/i,
  /telegram/i,
  /facebook/i,
  /\btel\b/i,
  /\bappel\b.*\bappeler\b/i,
]

function checkForbidden(text: string): boolean {
  return FORBIDDEN_PATTERNS.some(p => p.test(text))
}

type ConversationDetails = Awaited<ReturnType<typeof getConversationDetails>>
type ChatMessage = Awaited<ReturnType<typeof getMessages>>[number]

export default function ChatPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const conversationId = params.id
  const [details, setDetails] = useState<ConversationDetails | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState<ConversationProgress | null>(null)
  const [progressSaving, setProgressSaving] = useState<"go_further" | "end_match" | null>(null)
  const [photoAccessApproved, setPhotoAccessApproved] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true

    async function loadChat() {
      try {
        setLoading(true)
        setError(null)
        const [conversationDetails, conversationMessages, conversationProgress] = await Promise.all([
          getConversationDetails(conversationId),
          getMessages(conversationId),
          getConversationProgress(conversationId),
        ])
        const photoStatuses = await getPhotoUnblurStatuses([conversationDetails.partner.id])
        if (!active) return
        setDetails(conversationDetails)
        setMessages(conversationMessages)
        setProgress(conversationProgress)
        setPhotoAccessApproved(photoStatuses.get(conversationDetails.partner.id) === "approved")
        window.localStorage.setItem(
          `mawada-conversation-read:${conversationDetails.currentUserId}:${conversationId}`,
          conversationMessages.at(-1)?.created_at || conversationDetails.conversation.updated_at,
        )
      } catch (error) {
        console.error(error)
        if (active) {
          setError(getUserFacingError(error, "chatLoad"))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    if (conversationId) {
      loadChat()
    }

    return () => {
      active = false
    }
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return

    if (checkForbidden(text)) {
      setError("Ce message ne respecte pas les règles de la plateforme. Le partage de coordonnées personnelles est interdit.")
      setTimeout(() => setError(null), 5000)
      return
    }

    if (details?.conversation.mahram_status !== "approved" || details?.conversation.status !== "active") {
      setError(
        details?.conversation.status === "archived"
          ? "Ce match est terminé. Vous ne pouvez plus envoyer de message dans cette discussion."
          : "Le Mahram a reçu la demande. Vous pourrez échanger après sa validation.",
      )
      setTimeout(() => setError(null), 5000)
      return
    }

    try {
      setSending(true)
      setError(null)
      const newMsg = await sendMessage(conversationId, text)
      setMessages(prev => [...prev, newMsg])
      setInput("")
    } catch (error) {
      console.error(error)
      setError(getUserFacingError(error, "chatSend"))
    } finally {
      setSending(false)
    }
  }

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  }

  const handleProgressAction = async (action: "go_further" | "end_match") => {
    if (action === "end_match") {
      const confirmed = window.confirm(
        "Terminer ce match ? La discussion sera fermée et vous pourrez matcher avec une autre personne.",
      )
      if (!confirmed) return
    }

    try {
      setProgressSaving(action)
      setError(null)
      const nextProgress = await updateConversationProgress(conversationId, action)
      setProgress(nextProgress)
      setDetails(previous => {
        if (!previous) return previous
        return {
          ...previous,
          conversation: {
            ...previous.conversation,
            ...nextProgress.conversation,
          },
        }
      })
    } catch (error) {
      console.error(error)
      setError(action === "end_match"
        ? "Impossible de terminer ce match pour le moment."
        : "Impossible d'enregistrer votre choix pour le moment.")
    } finally {
      setProgressSaving(null)
    }
  }

  const partner = details?.partner
  const conversation = details?.conversation
  const currentUserId = details?.currentUserId
  const isEnded = conversation?.status === "archived"
  const canSend = conversation?.mahram_status === "approved" && conversation?.status === "active"
  const partnerPhotoHidden = Boolean(partner?.photo_blurred) && !photoAccessApproved

  return (
    <div className="flex flex-col h-screen bg-background max-w-2xl mx-auto">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden">
          {partner?.photo && <img src={partner.photo} alt={partner.prenom} className={`w-full h-full object-cover ${partnerPhotoHidden ? "blur-sm scale-105" : ""}`} />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground">{partner?.prenom || "Conversation"}</h2>
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${
              isEnded ? "bg-slate-400" : canSend ? "bg-emerald-500" : "bg-amber-500"
            }`} />
            <span className="text-xs text-muted-foreground">
              {isEnded ? "Match terminé" : canSend ? "Échange autorisé" : "En attente du Mahram"}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
        >
          <Info className="w-4 h-4 text-muted-foreground" />
        </button>
      </header>

      {/* Supervised badge */}
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-primary text-xs font-semibold">
          {isEnded
            ? "Match terminé"
            : canSend
              ? "Discussion supervisée par le Mahram"
              : "Demande envoyée au Mahram avant échange"}
        </span>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Le partage de coordonnées personnelles (numéro de téléphone, email, réseaux sociaux) ou tout contenu inapproprié est strictement interdit et bloqué automatiquement.
            </p>
          </div>
        </div>
      )}

      {!loading && conversation && (
        <div className="border-b border-border bg-card px-4 py-3">
          {isEnded ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start gap-2">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Match terminé</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    La discussion est fermée. Vous pouvez maintenant poursuivre une autre demande de match.
                  </p>
                </div>
              </div>
            </div>
          ) : canSend ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 space-y-3">
              <div className="flex items-start gap-2">
                <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Aller plus loin</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Si vous souhaitez avancer sérieusement, cliquez sur “Aller plus loin”. Les coordonnées du Mahram seront visibles uniquement si vous cliquez tous les deux.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`rounded-xl px-3 py-2 font-semibold ${
                  progress?.currentUserReady ? "bg-emerald-50 text-emerald-700" : "bg-secondary text-muted-foreground"
                }`}>
                  Vous : {progress?.currentUserReady ? "prêt(e)" : "en attente"}
                </div>
                <div className={`rounded-xl px-3 py-2 font-semibold ${
                  progress?.partnerReady ? "bg-emerald-50 text-emerald-700" : "bg-secondary text-muted-foreground"
                }`}>
                  {partner?.prenom || "L'autre profil"} : {progress?.partnerReady ? "prêt(e)" : "en attente"}
                </div>
              </div>

              {progress?.bothReady && progress.mahramContact && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                  <p className="flex items-center gap-2 font-semibold">
                    <CheckCircle className="h-4 w-4" />
                    Coordonnées du Mahram débloquées
                  </p>
                  <div className="mt-2 space-y-1 text-xs">
                    <p>{progress.mahramContact.nom} · {progress.mahramContact.relation}</p>
                    {progress.mahramContact.email && (
                      <p className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {progress.mahramContact.email}
                      </p>
                    )}
                    {progress.mahramContact.telephone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {progress.mahramContact.telephone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleProgressAction("end_match")}
                  disabled={Boolean(progressSaving)}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-60"
                >
                  {progressSaving === "end_match" ? "..." : "Fin du match"}
                </button>
                <button
                  type="button"
                  onClick={() => handleProgressAction("go_further")}
                  disabled={Boolean(progressSaving) || Boolean(progress?.currentUserReady)}
                  className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {progressSaving === "go_further" ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Envoi
                    </span>
                  ) : progress?.currentUserReady ? (
                    "Choix enregistré"
                  ) : (
                    "Aller plus loin"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-900">Validation du Mahram en attente</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                La discussion s’ouvrira quand le Mahram aura validé ce match.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Participants */}
        <div className="flex items-center justify-center">
          <div className="bg-secondary text-muted-foreground text-xs px-4 py-2 rounded-full flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span>Échange entre vous, {partner?.prenom || "ce profil"}, sous supervision du Mahram</span>
          </div>
        </div>

        {loading && (
          <div className="space-y-3">
            <div className="h-16 bg-secondary rounded-2xl animate-pulse" />
            <div className="h-16 bg-secondary rounded-2xl animate-pulse ml-12" />
            <div className="h-16 bg-secondary rounded-2xl animate-pulse mr-12" />
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="text-center py-14">
            <p className="text-sm font-medium text-foreground">Aucun message pour le moment</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isEnded
                ? "Ce match est terminé."
                : canSend
                ? "Vous pouvez commencer l'échange."
                : "Le chat sera disponible après validation du Mahram."}
            </p>
          </div>
        )}

        {messages.map(msg => {
          const isMe = msg.sender_id === currentUserId
          const isMahram = false

          if (isMahram) {
            return (
              <div key={msg.id} className="flex justify-center">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 max-w-xs text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700">Mahram</span>
                  </div>
                  <p className="text-sm text-amber-900">{msg.content}</p>
                  <p className="text-xs text-amber-600 mt-1">{formatTime(msg.created_at)}</p>
                </div>
              </div>
            )
          }

          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              {!isMe && (
                <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden shrink-0 mr-2 mt-auto">
                  {partner?.photo && <img src={partner.photo} alt={partner.prenom} className={`w-full h-full object-cover ${partnerPhotoHidden ? "blur-sm scale-105" : ""}`} />}
                </div>
              )}
              <div className={`max-w-xs lg:max-w-sm ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {!isMe && <span className="text-xs text-muted-foreground ml-1">{partner?.prenom}</span>}
                <div className={`px-4 py-3 rounded-2xl ${
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border text-foreground rounded-bl-md"
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
                <span className={`text-xs text-muted-foreground ${isMe ? "mr-1" : "ml-1"}`}>
                  {formatTime(msg.created_at)}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-in slide-in-from-bottom">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="bg-card border-t border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={isEnded ? "Match terminé" : canSend ? "Votre message..." : "En attente du Mahram..."}
            disabled={!canSend || loading}
            className="flex-1 px-4 py-3 bg-secondary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring border border-border"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !canSend || loading || sending}
            className="w-11 h-11 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0 shadow-md shadow-primary/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Tout message inapproprié est automatiquement détecté et bloqué
        </p>
      </div>
    </div>
  )
}
