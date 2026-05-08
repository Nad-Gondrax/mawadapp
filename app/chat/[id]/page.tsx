"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shield, Send, AlertTriangle, ChevronLeft, Info } from "lucide-react"
import { MOCK_CONVERSATIONS, MOCK_PROFILES, CURRENT_USER } from "@/lib/mock-data"

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

export default function ChatPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const conversation = MOCK_CONVERSATIONS.find(c => c.id === params.id) || MOCK_CONVERSATIONS[0]
  const partner = MOCK_PROFILES.find(p => p.id === conversation.user2Id)!

  const [messages, setMessages] = useState(conversation.messages)
  const [input, setInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return

    if (checkForbidden(text)) {
      setError("Ce message ne respecte pas les règles de la plateforme. Le partage de coordonnées personnelles est interdit.")
      setTimeout(() => setError(null), 5000)
      return
    }

    setError(null)
    const newMsg = {
      id: `m${Date.now()}`,
      senderId: "me",
      senderName: CURRENT_USER.prenom,
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, newMsg])
    setInput("")
  }

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  }

  const getSenderColor = (senderId: string) => {
    if (senderId === "me") return "primary"
    if (senderId === "mahram") return "amber"
    return "secondary"
  }

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
          {partner.photo && <img src={partner.photo} alt={partner.prenom} className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground">{partner.prenom}</h2>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <span className="text-xs text-muted-foreground">En ligne</span>
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
        <span className="text-primary text-xs font-semibold">Discussion supervisée par le mahram</span>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Participants */}
        <div className="flex items-center justify-center">
          <div className="bg-secondary text-muted-foreground text-xs px-4 py-2 rounded-full flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span>3 participants : vous, {partner.prenom} et {partner.mahram?.nom} (Mahram)</span>
          </div>
        </div>

        {messages.map(msg => {
          const isMe = msg.senderId === "me"
          const isMahram = msg.senderId === "mahram"

          if (isMahram) {
            return (
              <div key={msg.id} className="flex justify-center">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 max-w-xs text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700">{msg.senderName}</span>
                  </div>
                  <p className="text-sm text-amber-900">{msg.content}</p>
                  <p className="text-xs text-amber-600 mt-1">{formatTime(msg.timestamp)}</p>
                </div>
              </div>
            )
          }

          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              {!isMe && (
                <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden shrink-0 mr-2 mt-auto">
                  {partner.photo && <img src={partner.photo} alt={partner.prenom} className="w-full h-full object-cover" />}
                </div>
              )}
              <div className={`max-w-xs lg:max-w-sm ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {!isMe && <span className="text-xs text-muted-foreground ml-1">{msg.senderName}</span>}
                <div className={`px-4 py-3 rounded-2xl ${
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border text-foreground rounded-bl-md"
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
                <span className={`text-xs text-muted-foreground ${isMe ? "mr-1" : "ml-1"}`}>
                  {formatTime(msg.timestamp)}
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
            placeholder="Votre message..."
            className="flex-1 px-4 py-3 bg-secondary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring border border-border"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
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
