import { NextResponse } from "next/server"
import { isUserAdmin } from "@/lib/supabase/admin"
import { createAdminClient } from "@/lib/supabase/admin-client"

type MatchRequestRow = {
  id: string
  conversation_id: string
  protected_user_id: string
  match_user_id: string
  access_token?: string | null
  mahram_email?: string | null
  mahram_name?: string | null
  status: "pending" | "approved" | "refused"
  email_status?: "pending" | "sent" | "failed" | null
  created_at?: string | null
}

type ProfileRow = {
  id: string
  prenom: string | null
  age: number | null
  genre: string | null
  ville: string | null
  statut: string | null
}

export async function GET() {
  const isAdmin = await isUserAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
  }

  const supabase = createAdminClient()

  const { data: requestsData, error } = await supabase
    .from("mahram_match_requests")
    .select("*")
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const requests = (requestsData || []) as MatchRequestRow[]
  const profileIds = Array.from(new Set(
    requests.flatMap(request => [request.protected_user_id, request.match_user_id]).filter(Boolean),
  ))

  const profilesById = new Map<string, ProfileRow>()

  if (profileIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, prenom, age, genre, ville, statut")
      .in("id", profileIds)

    if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 })

    for (const profile of (profiles || []) as ProfileRow[]) {
      profilesById.set(profile.id, profile)
    }
  }

  const sorted = [...requests].sort((a, b) =>
    new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
  )

  return NextResponse.json({
    requests: sorted.map(request => ({
      ...request,
      protectedProfile: profilesById.get(request.protected_user_id) || null,
      matchProfile: profilesById.get(request.match_user_id) || null,
    })),
  })
}
