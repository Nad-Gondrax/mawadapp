import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin-client"

type ConversationRow = {
  id: string
  user_1_id: string
  user_2_id: string
  status: string
  mahram_status: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const profileIds: string[] = Array.isArray(body.profileIds)
      ? Array.from(new Set(body.profileIds.filter((id: unknown): id is string => typeof id === "string")))
      : []

    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin
      .from("conversations")
      .select("id, user_1_id, user_2_id, status, mahram_status")
      .eq("status", "active")
      .in("mahram_status", ["pending", "approved"])

    if (error) throw error

    const conversations = (data || []) as ConversationRow[]
    const activeProfileIds = new Set<string>()
    let currentActiveConversationId: string | null = null

    for (const conversation of conversations) {
      const participants: string[] = [conversation.user_1_id, conversation.user_2_id]

      if (participants.includes(user.id)) {
        currentActiveConversationId = conversation.id
      }

      for (const profileId of profileIds) {
        if (participants.includes(profileId)) {
          activeProfileIds.add(profileId)
        }
      }
    }

    return NextResponse.json({
      activeProfileIds: Array.from(activeProfileIds),
      currentUserHasActiveMatch: Boolean(currentActiveConversationId),
      currentActiveConversationId,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
