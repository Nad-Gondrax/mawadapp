import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin-client"
import { createClient } from "@/lib/supabase/server"

type ConversationRow = {
  id: string
  user_1_id: string
  user_2_id: string
  status: "active" | "blocked" | "archived"
  mahram_status: "pending" | "approved" | "refused"
}

function hasMutualLike(
  likes: Array<{ from_user_id: string; to_user_id: string }>,
  userId: string,
  otherUserId: string,
) {
  return (
    likes.some(like => like.from_user_id === userId && like.to_user_id === otherUserId) &&
    likes.some(like => like.from_user_id === otherUserId && like.to_user_id === userId)
  )
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
    const otherUserId = typeof body.otherUserId === "string" ? body.otherUserId : ""

    if (!otherUserId || otherUserId === user.id) {
      return NextResponse.json({ error: "Profil invalide" }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const { data: likes, error: likesError } = await supabaseAdmin
      .from("likes")
      .select("from_user_id, to_user_id")
      .or(
        `and(from_user_id.eq.${user.id},to_user_id.eq.${otherUserId}),` +
          `and(from_user_id.eq.${otherUserId},to_user_id.eq.${user.id})`,
      )

    if (likesError) throw likesError

    if (!hasMutualLike((likes || []) as Array<{ from_user_id: string; to_user_id: string }>, user.id, otherUserId)) {
      return NextResponse.json({ error: "Like réciproque manquant" }, { status: 400 })
    }

    const [user1, user2] = [user.id, otherUserId].sort()
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .or(
        `and(user_1_id.eq.${user1},user_2_id.eq.${user2}),` +
          `and(user_1_id.eq.${user2},user_2_id.eq.${user1})`,
      )
      .maybeSingle()

    if (existingError) throw existingError

    if (existing) {
      const conversation = existing as ConversationRow

      if (conversation.status === "archived") {
        const { data: reopened, error: reopenError } = await supabaseAdmin
          .from("conversations")
          .update({
            status: "active",
            mahram_status: "pending",
            ended_at: null,
            ended_by: null,
            user_1_go_further_at: null,
            user_2_go_further_at: null,
            mahram_contacts_revealed_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", conversation.id)
          .select("*")
          .single()

        if (reopenError) throw reopenError

        await supabaseAdmin
          .from("mahram_match_requests")
          .update({
            status: "pending",
            email_status: "pending",
            email_sent_at: null,
            email_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("conversation_id", conversation.id)

        return NextResponse.json(reopened)
      }

      return NextResponse.json(conversation)
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("conversations")
      .insert({
        user_1_id: user1,
        user_2_id: user2,
        mahram_status: "pending",
        status: "active",
      })
      .select("*")
      .single()

    if (insertError) throw insertError
    return NextResponse.json(inserted)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
