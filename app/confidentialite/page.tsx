import Link from "next/link"

export default function ConfidentialitePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-primary hover:underline">
          Retour à l&apos;accueil
        </Link>
        <h1 className="mt-6 font-serif text-4xl font-bold text-foreground">Confidentialité</h1>
        <p className="mt-4 text-muted-foreground">
          Cette page sera complétée prochainement avec la politique de confidentialité de Taym.
        </p>
      </div>
    </main>
  )
}
