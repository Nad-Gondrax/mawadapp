import { isUserAdmin } from "@/lib/supabase/admin"
import { createAdminClient } from "@/lib/supabase/admin-client"
import { NextResponse } from "next/server"

export async function GET() {
  const isAdmin = await isUserAdmin()
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Accès non autorisé" },
      { status: 403 }
    )
  }

  const supabase = createAdminClient()

  // Total inscrits
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  // Onboarding complété
  const { count: profilsComplets } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("onboarding_complete", true)

  // Hommes / Femmes
  const { count: hommes } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("genre", "homme")

  const { count: femmes } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("genre", "femme")

  // Mahrams en attente
  const { count: mahramEnAttente } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("mahram_statut", "en_attente")

  // Mahrams validés
  const { count: mahramValide } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("mahram_statut", "valide")

  const { count: demandesMahramEnAttente } = await supabase
    .from("mahram_match_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  const { count: demandesMahramValidees } = await supabase
    .from("mahram_match_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved")

  let signalementsOuverts = 0
  const { count: reportsCount, error: reportsError } = await supabase
    .from("profile_reports")
    .select("*", { count: "exact", head: true })
    .eq("status", "open")

  if (!reportsError) signalementsOuverts = reportsCount ?? 0

  // Nouveaux cette semaine (7 jours)
  const since7Days = new Date()
  since7Days.setDate(since7Days.getDate() - 7)
  const { count: nouveauxSemaine } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since7Days.toISOString())

  // Nouveaux aujourd'hui
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count: nouveauxAujourdhui } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString())

  // Inscrits par jour sur 7 jours
  const inscriptionsParJour: { jour: string; total: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const start = new Date()
    start.setDate(start.getDate() - i)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setHours(23, 59, 59, 999)

    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())

    inscriptionsParJour.push({
      jour: start.toLocaleDateString("fr-FR", { weekday: "short" }),
      total: count ?? 0,
    })
  }

  // Répartition niveaux pratique
  const niveaux = ["debutant", "pratiquant", "pratiquant_engage", "hafidh"]
  const repartitionPratique: { niveau: string; total: number }[] = []
  for (const niveau of niveaux) {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("niveau_pratique", niveau)
    repartitionPratique.push({ niveau, total: count ?? 0 })
  }

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    profilsComplets: profilsComplets ?? 0,
    hommes: hommes ?? 0,
    femmes: femmes ?? 0,
    mahramEnAttente: mahramEnAttente ?? 0,
    mahramValide: mahramValide ?? 0,
    demandesMahramEnAttente: demandesMahramEnAttente ?? 0,
    demandesMahramValidees: demandesMahramValidees ?? 0,
    signalementsOuverts,
    nouveauxSemaine: nouveauxSemaine ?? 0,
    nouveauxAujourdhui: nouveauxAujourdhui ?? 0,
    inscriptionsParJour,
    repartitionPratique,
  })
}
