"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowRight, Eye, EyeOff, Loader2, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getUserFacingError } from "@/lib/user-facing-errors"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.")
      return
    }

    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(getUserFacingError(error, "passwordReset"))
      setLoading(false)
      return
    }

    setSuccess("Votre mot de passe a bien été modifié.")
    setLoading(false)
    setTimeout(() => {
      router.push("/dashboard")
      router.refresh()
    }, 900)
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md bg-white border border-border rounded-3xl shadow-2xl overflow-hidden">
        <div className="gradient-mawada px-6 py-8 text-center">
          <Image
            src="/logo-taym.png"
            alt="Taym"
            width={56}
            height={56}
            className="mx-auto mb-4 brightness-0 invert"
          />
          <h1 className="font-serif text-2xl font-bold text-white">
            Nouveau mot de passe
          </h1>
          <p className="mt-1 text-sm text-white/80">
            Choisissez un mot de passe sécurisé pour votre compte Taym.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
              {success}
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="w-full pl-12 pr-12 py-4 border border-border rounded-2xl text-sm bg-[#F8FFFC] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(value => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-border rounded-2xl text-sm bg-[#F8FFFC] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-mawada text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Modifier mon mot de passe"}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/" className="text-primary font-semibold hover:underline">
              Retour à la connexion
            </Link>
          </p>
        </form>
      </section>
    </main>
  )
}
