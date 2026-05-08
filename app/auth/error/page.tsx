import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Une erreur est survenue
        </h1>
        <p className="text-muted-foreground text-sm">
          Le lien est invalide ou a expiré. Veuillez réessayer.
        </p>
        <Link
          href="/"
          className="inline-block mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
