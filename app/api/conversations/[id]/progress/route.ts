import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin-client"
import { createClient } from "@/lib/supabase/server"

type RouteContext = {
  params: Promise<{ id: string }> | { id: string }
}

type ConversationRow = {
  id: string
  user_1_id: string
  user_2_id: string
  status: "active" | "blocked" | "archived"
  mahram_status: "pending" | "approved" | "refused"
  user_1_go_further_at: string | null
  user_2_go_further_at: string | null
  mahram_contacts_revealed_at: string | null
  ended_at: string | null
  ended_by: string | null
  updated_at: string
}

type MahramRequestRow = {
  protected_user_id: string
  mahram_email: string | null
  mahram_name: string | null
}

type ProtectedProfileRow = {
  mahram_nom: string | null
  mahram_relation: string | null
  mahram_email: string | null
  mahram_telephone: string | null
}

async function getRouteId(context: RouteContext) {
  const params = await context.params
  return params.id
}

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null
  return user
}

function isParticipant(conversation: ConversationRow, userId: string) {
  return conversation.user_1_id === userId || conversation.user_2_id === userId
}

async function buildPayload(admin: ReturnType<typeof createAdminClient>, conversation: ConversationRow, userId: string) {
  const isUser1 = conversation.user_1_id === userId
  const currentUserReady = Boolean(isUser1 ? conversation.user_1_go_further_at : conversation.user_2_go_further_at)
  const partnerReady = Boolean(isUser1 ? conversation.user_2_go_further_at : conversation.user_1_go_further_at)
  const bothReady = currentUserReady && partnerReady
  let mahramContact = null

  if (bothReady) {
    const { data: request } = await admin
      .from("mahram_match_requests")
      .select("protected_user_id, mahram_email, mahram_name")
      .eq("conversation_id", conversation.id)
      .maybeSingle()

    const mahramRequest = request as MahramRequestRow | null

    if (mahramRequest?.protected_user_id) {
      const { data: protectedProfile } = await admin
        .from("profiles")
        .select("mahram_nom, mahram_relation, mahram_email, mahram_telephone")
        .eq("id", mahramRequest.protected_user_id)
        .maybeSingle()

      const profile = protectedProfile as ProtectedProfileRow | null
      mahramContact = {
        nom: profile?.mahram_nom || mahramRequest.mahram_name || "Mahram",
        relation: profile?.mahram_relation || "Mahram",
        email: profile?.mahram_email || mahramRequest.mahram_email || "",
        telephone: profile?.mahram_telephone || "",
      }
    }
  }

  return {
    conversation,
    currentUserReady,
    partnerReady,
    bothReady,
    mahramContact,
  }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const conversationId = await getRouteId(context)
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 })

    const conversation = data as ConversationRow
    if (!isParticipant(conversation, user.id)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    return NextResponse.json(await buildPayload(admin, conversation, user.id))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const conversationId = await getRouteId(context)
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const action = typeof body.action === "string" ? body.action : ""

    if (!["go_further", "end_match"].includes(action)) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 })

    const conversation = data as ConversationRow
    if (!isParticipant(conversation, user.id)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    if (action === "end_match") {
      const { data: archived, error: archiveError } = await admin
        .from("conversations")
        .update({
          status: "archived",
          ended_at: new Date().toISOString(),
          ended_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversation.id)
        .select("*")
        .single()

      if (archiveError) throw archiveError

      await admin
        .from("likes")
        .delete()
        .or(
          `and(from_user_id.eq.${conversation.user_1_id},to_user_id.eq.${conversation.user_2_id}),` +
            `and(from_user_id.eq.${conversation.user_2_id},to_user_id.eq.${conversation.user_1_id})`,
        )

      return NextResponse.json(await buildPayload(admin, archived as ConversationRow, user.id))
    }

    if (conversation.status !== "active" || conversation.mahram_status !== "approved") {
      return NextResponse.json(
        { error: "La discussion doit être active et validée avant d'aller plus loin." },
        { status: 400 },
      )
    }

    const now = new Date().toISOString()
    const readyColumn = conversation.user_1_id === user.id ? "user_1_go_further_at" : "user_2_go_further_at"
    const updatePayload: Record<string, string> = { updated_at: now }
    const alreadyReady = readyColumn === "user_1_go_further_at"
      ? Boolean(conversation.user_1_go_further_at)
      : Boolean(conversation.user_2_go_further_at)

    if (!alreadyReady) {
      updatePayload[readyColumn] = now
    }

    const { data: updated, error: updateError } = await admin
      .from("conversations")
      .update(updatePayload)
      .eq("id", conversation.id)
      .select("*")
      .single()

    if (updateError) throw updateError

    let nextConversation = updated as ConversationRow
    if (
      nextConversation.user_1_go_further_at &&
      nextConversation.user_2_go_further_at &&
      !nextConversation.mahram_contacts_revealed_at
    ) {
      const { data: revealed, error: revealError } = await admin
        .from("conversations")
        .update({
          mahram_contacts_revealed_at: now,
          updated_at: now,
        })
        .eq("id", conversation.id)
        .select("*")
        .single()

      if (revealError) throw revealError
      nextConversation = revealed as ConversationRow
    }

    return NextResponse.json(await buildPayload(admin, nextConversation, user.id))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
