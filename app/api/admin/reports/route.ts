import { NextResponse } from "next/server"
import { isUserAdmin } from "@/lib/supabase/admin"
import { createAdminClient } from "@/lib/supabase/admin-client"

type ReportRow = {
  id: string
  reporter_id: string
  reported_user_id: string
  reason: string
  details: string | null
  status: "open" | "reviewed" | "dismissed" | "actioned"
  created_at: string
}

type ProfileRow = {
  id: string
  prenom: string | null
  age: number | null
  genre: string | null
  ville: string | null
  statut: string | null
}

function isMissingReportsTable(message: string) {
  return message.includes("profile_reports") || message.includes("does not exist")
}

export async function GET() {
  const isAdmin = await isUserAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
  }

  const supabase = createAdminClient()

  const { data: reportsData, error } = await supabase
    .from("profile_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    if (isMissingReportsTable(error.message)) {
      return NextResponse.json({ reports: [], setupRequired: true })
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const reports = (reportsData || []) as ReportRow[]
  const profileIds = Array.from(new Set(
    reports.flatMap(report => [report.reporter_id, report.reported_user_id]).filter(Boolean),
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

  return NextResponse.json({
    reports: reports.map(report => ({
      ...report,
      reporter: profilesById.get(report.reporter_id) || null,
      reportedUser: profilesById.get(report.reported_user_id) || null,
    })),
    setupRequired: false,
  })
}

export async function PATCH(request: Request) {
  const isAdmin = await isUserAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
  }

  const { id, status } = await request.json()
  if (!id || !["open", "reviewed", "dismissed", "actioned"].includes(status)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("profile_reports")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
