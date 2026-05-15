"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getUserFacingError } from "@/lib/user-facing-errors"

interface AuthModalProps {
  open: boolean
  onClose: () => void
  defaultMode?: "login" | "register"
}

export function AuthModal({ open, onClose, defaultMode = "register" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">(defaultMode)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const emailAlreadyUsed = mode === "register" && error?.toLowerCase().includes("déjà utilisé")

  useEffect(() => {
    setMode(defaultMode)
    setError(null)
    setSuccess(null)
  }, [defaultMode, open])

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })

    if (error) {
      setError(getUserFacingError(error, "passwordReset"))
    } else {
      setSuccess("Un email de réinitialisation vous a été envoyé. Vérifiez votre boîte mail.")
    }
    setLoading(false)
  }

  const switchMode = (nextMode: "login" | "register" | "forgot") => {
    setMode(nextMode)
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    const supabase = createClient()

    if (mode === "register") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setError(getUserFacingError(error, "signup"))
      } else if (data.session) {
        // Confirmation email désactivée : session créée directement
        onClose()
        router.push("/onboarding")
        router.refresh()
      } else {
        // Confirmation email activée
        setSuccess("Un email de confirmation vous a été envoyé. Vérifiez votre boîte mail.")
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(getUserFacingError(error, "login"))
      } else {
        onClose()
        router.push("/dashboard")
        router.refresh()
      }
    }
    setLoading(false)
  }

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
        },
      })
      if (error) setError(getUserFacingError(error, "login"))
    } catch (error) {
      setError(getUserFacingError(error, "login"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:flex sm:items-center sm:justify-center sm:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#102A2A]/50 backdrop-blur-sm" 
            onClick={onClose} 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative my-3 bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden sm:my-0"
          >
            {/* Header with gradient */}
            <div className="gradient-mawada px-6 py-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-xl" />
              </div>
              <div className="relative z-10">
                <Image 
                  src="/logo-taym.png" 
                  alt="Taym" 
                  width={56} 
                  height={56}
                  className="mx-auto mb-4 brightness-0 invert"
                />
                <h2 className="font-serif text-2xl font-bold text-white">
                  {mode === "register" ? "Créer un compte" : mode === "forgot" ? "Mot de passe oublié" : "Bon retour"}
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  {mode === "register" ? "Rejoignez la communauté Taym" : mode === "forgot" ? "Recevez un lien de réinitialisation" : "Connectez-vous pour continuer"}
                </p>
              </div>
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Social Buttons - hidden in forgot mode */}
              {mode !== "forgot" && <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSocialLogin("google")}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-border rounded-2xl hover:bg-[#E7F7F4] hover:border-primary/20 transition-all text-sm font-medium"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuer avec Google
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSocialLogin("apple")}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#102A2A] text-white rounded-2xl hover:bg-[#1a3a3a] transition-all text-sm font-medium"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Continuer avec Apple
                </motion.button>
              </div>}

              {mode !== "forgot" && (
                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-muted-foreground text-xs font-medium">ou par email</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}

              {/* Erreur / Succès */}
              {error && (
                <div className="space-y-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  <p>{error}</p>
                  {emailAlreadyUsed && (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => switchMode("login")}
                        className="font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        Se connecter
                      </button>
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                  )}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
                  {success}
                </div>
              )}

              {/* Form */}
              <form onSubmit={mode === "forgot" ? handleForgotPassword : handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="Votre email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-border rounded-2xl text-sm bg-[#F8FFFC] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    required
                  />
                </div>
                
                {mode !== "forgot" && (
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mot de passe"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 border border-border rounded-2xl text-sm bg-[#F8FFFC] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                )}
                
                {mode === "login" && (
                  <div className="text-right">
                    <button 
                      type="button" 
                      onClick={() => switchMode("forgot")}
                      className="text-sm text-primary hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                )}
                
                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full gradient-mawada text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {mode === "register" ? "Créer mon compte" : mode === "forgot" ? "Envoyer le lien" : "Me connecter"}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                {mode === "register" ? (
                  <>
                    Déjà inscrit ?{" "}
                    <button onClick={() => switchMode("login")} className="text-primary font-semibold hover:underline">
                      Connexion
                    </button>
                  </>
                ) : mode === "forgot" ? (
                  <>
                    <button onClick={() => switchMode("login")} className="text-primary font-semibold hover:underline">
                      Retour à la connexion
                    </button>
                  </>
                ) : (
                  <>
                    Pas encore inscrit ?{" "}
                    <button onClick={() => switchMode("register")} className="text-primary font-semibold hover:underline">
                      Créer un compte
                    </button>
                  </>
                )}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
