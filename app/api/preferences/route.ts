import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const DEFAULT_FILTERS = {
  ageMin: 18,
  ageMax: 60,
  departement: "Tous",
  niveauEtude: "tous",
  niveauPratique: "tous",
  paysOrigine: "Tous",
  avecEnfants: "tous",
  projetMariage: "tous",
}

type PreferenceRow = {
  age_min: number
  age_max: number
  departement: string
  niveau_etude: string
  niveau_pratique: string
  pays_origine: string
  avec_enfants: string
  projet_mariage: string
}

function rowToFilters(row: PreferenceRow | null) {
  if (!row) return DEFAULT_FILTERS

  return {
    ageMin: row.age_min,
    ageMax: row.age_max,
    departement: row.departement,
    niveauEtude: row.niveau_etude,
    niveauPratique: row.niveau_pratique,
    paysOrigine: row.pays_origine,
    avecEnfants: row.avec_enfants,
    projetMariage: row.projet_mariage,
  }
}

function normalizeFilters(filters: Record<string, unknown>, userId: string) {
  const ageMin = Math.max(18, Math.min(99, Number(filters.ageMin) || DEFAULT_FILTERS.ageMin))
  const rawAgeMax = Math.max(18, Math.min(99, Number(filters.ageMax) || DEFAULT_FILTERS.ageMax))
  const ageMax = Math.max(ageMin, rawAgeMax)

  return {
    user_id: userId,
    age_min: ageMin,
    age_max: ageMax,
    departement: String(filters.departement || DEFAULT_FILTERS.departement),
    niveau_etude: String(filters.niveauEtude || DEFAULT_FILTERS.niveauEtude),
    niveau_pratique: String(filters.niveauPratique || DEFAULT_FILTERS.niveauPratique),
    pays_origine: String(filters.paysOrigine || DEFAULT_FILTERS.paysOrigine),
    avec_enfants: ["tous", "oui", "non"].includes(String(filters.avecEnfants))
      ? String(filters.avecEnfants)
      : DEFAULT_FILTERS.avecEnfants,
    projet_mariage: String(filters.projetMariage || DEFAULT_FILTERS.projetMariage),
    updated_at: new Date().toISOString(),
  }
}

function isMissingPreferencesTable(message: string) {
  return message.includes("user_preferences") || message.includes("does not exist")
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("user_preferences")
    .select("age_min, age_max, departement, niveau_etude, niveau_pratique, pays_origine, avec_enfants, projet_mariage")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    if (isMissingPreferencesTable(error.message)) {
      return NextResponse.json({ filters: DEFAULT_FILTERS, setupRequired: true })
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ filters: rowToFilters(data as PreferenceRow | null), setupRequired: false })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const filters = await request.json()
  const payload = normalizeFilters(filters, user.id)

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select("age_min, age_max, departement, niveau_etude, niveau_pratique, pays_origine, avec_enfants, projet_mariage")
    .single()

  if (error) {
    if (isMissingPreferencesTable(error.message)) {
      return NextResponse.json(
        { error: "Table user_preferences absente. Lance scripts/05_user_preferences.sql dans Supabase." },
        { status: 409 },
      )
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ filters: rowToFilters(data as PreferenceRow) })
}
