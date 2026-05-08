"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Globe, BookOpen, Heart, X, MessageCircle, CheckCircle } from "lucide-react"
import type { UserProfile } from "@/lib/types"
import { NIVEAUX_PRATIQUE_LABELS, PROJET_MARIAGE_LABELS } from "@/lib/mock-data"
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder"

interface LikeModalProps {
  profile: UserProfile
  onClose: () => void
  onLike: (type: "mosque" | "phrase") => void
}

function LikeModal({ profile, onClose, onLike }: LikeModalProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-[#102A2A]/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-bold text-foreground">
              Envoyer un like
            </h3>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#E7F7F4] flex items-center justify-center hover:bg-[#D0E8E4] transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Montrez votre intérêt à <strong className="text-foreground">{profile.prenom}</strong>
          </p>
          
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onLike("mosque")}
              className="w-full flex items-center gap-4 p-4 border-2 border-border rounded-2xl hover:border-primary hover:bg-[#E7F7F4] transition-all"
            >
              <span className="text-3xl">🕌</span>
              <div className="text-left">
                <p className="font-semibold text-sm text-foreground">Envoyer un symbole</p>
                <p className="text-xs text-muted-foreground">Un geste simple et respectueux</p>
              </div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onLike("phrase")}
              className="w-full flex items-center gap-4 p-4 border-2 border-border rounded-2xl hover:border-[#FF6B6B] hover:bg-[#FF6B6B]/5 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FF6B6B]/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-[#FF6B6B]" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm text-foreground">Envoyer un message</p>
                <p className="text-xs text-muted-foreground italic">&ldquo;Votre profil m&apos;inspire confiance&rdquo;</p>
              </div>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface ProfileCardProps {
  profile: UserProfile
  showFullInfo?: boolean
}

export function ProfileCard({ profile, showFullInfo = false }: ProfileCardProps) {
  const [showLikeModal, setShowLikeModal] = useState(false)
  const [liked, setLiked] = useState(false)
  const router = useRouter()

  const mahramValidated = profile.mahram?.statut === "valide"

  const handleLike = () => {
    setLiked(true)
    setShowLikeModal(false)
  }

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-3xl border border-border shadow-premium overflow-hidden hover:shadow-premium-lg transition-all duration-300"
      >
        {/* Photo */}
        <div className="relative aspect-[4/3] bg-[#E7F7F4] overflow-hidden">
          <img
            src={profile.photo || (profile.genre === "femme" ? "/profil_femme.png" : "/profil_homme.png")}
            alt={`Profil de ${profile.prenom}`}
            className={`w-full h-full object-cover transition-all duration-500 ${!mahramValidated ? "blur-md scale-105" : ""}`}
          />
          
          {!mahramValidated && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#102A2A]/10">
              <div className="glass-card rounded-2xl px-4 py-2.5 flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-foreground">En attente du mahram</span>
              </div>
            </div>
          )}
          
          {mahramValidated && (
            <div className="absolute top-3 right-3">
              <div className="bg-[#2ECC71] text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                <CheckCircle className="w-3.5 h-3.5" />
                Vérifié
              </div>
            </div>
          )}
          
          {/* Project tag */}
          <div className="absolute bottom-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
              {PROJET_MARIAGE_LABELS[profile.projetMariage] || "Projet zawaj"}
            </span>
          </div>

          {/* Compatibility score */}
          <div className="absolute top-3 left-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
              <span className="text-xs font-bold text-primary">87% compatible</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <h3 className="font-serif font-bold text-xl text-foreground">
              {profile.prenom}, {profile.age} ans
            </h3>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{profile.ville}</span>
              <span className="text-border">•</span>
              <Globe className="w-3.5 h-3.5" />
              <span>{profile.paysOrigine}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm bg-[#E7F7F4] rounded-xl px-3 py-2">
            <BookOpen className="w-4 h-4 text-primary shrink-0" />
            <span className="text-foreground font-medium">
              {NIVEAUX_PRATIQUE_LABELS[profile.niveauPratique] || "Pratiquant(e)"}
            </span>
          </div>

          {/* Traits */}
          <div className="flex flex-wrap gap-2">
            {profile.traits.slice(0, 3).map(t => (
              <span key={t} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
                {t}
              </span>
            ))}
            {profile.traits.length > 3 && (
              <span className="text-xs bg-[#E7F7F4] text-muted-foreground px-3 py-1.5 rounded-full font-medium">
                +{profile.traits.length - 3}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowLikeModal(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all ${
                liked
                  ? "bg-[#FF6B6B]/10 text-[#FF6B6B] border-2 border-[#FF6B6B]/30"
                  : "bg-[#FF6B6B] text-white hover:bg-[#FF6B6B]/90 shadow-lg shadow-[#FF6B6B]/25"
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-[#FF6B6B]" : ""}`} />
              {liked ? "Liké !" : "J'aime"}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/profil/${profile.id}`)}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-primary text-white hover:bg-[#006B61] transition-colors shadow-lg shadow-primary/25"
            >
              Voir le profil
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showLikeModal && (
          <LikeModal
            profile={profile}
            onClose={() => setShowLikeModal(false)}
            onLike={handleLike}
          />
        )}
      </AnimatePresence>
    </>
  )
}
