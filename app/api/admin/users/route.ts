import { isUserAdmin } from "@/lib/supabase/admin"
import { createAdminClient } from "@/lib/supabase/admin-client"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const isAdmin = await isUserAdmin()
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Accès non autorisé" },
      { status: 403 }
    )
  }

  const supabase = createAdminClient()

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 20
  const offset = (page - 1) * limit

  const { data, error, count } = await supabase
    .from("profiles")
    .select("id, prenom, age, genre, ville, niveau_pratique, statut, onboarding_complete, mahram_statut, mahram_email, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ users: data, total: count ?? 0, page, limit })
}

export async function PATCH(request: Request) {
  const isAdmin = await isUserAdmin()
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Accès non autorisé" },
      { status: 403 }
    )
  }

  const supabase = createAdminClient()

  const { id, statut } = await request.json()
  if (!id || !statut) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
  if (!["actif", "suspendu", "banni", "verifie"].includes(statut)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
  }

  const { error } = await supabase
    .from("profiles")
    .update({ statut })
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
