import { NextResponse } from "next/server"
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"

const PUBLIC_PROFILE_SELECT = [
  "id",
  "prenom",
  "age",
  "genre",
  "ville",
  "pays_origine",
  "photo",
].join(", ")

type PublicProfile = {
  id: string
  prenom: string | null
  photo: string | null
}

function getAdminClient() {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")
  if (!token) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 400 })
  }

  const supabaseAdmin = getAdminClient()

  const { data: matchRequest, error: requestError } = await supabaseAdmin
    .from("mahram_match_requests")
    .select("*")
    .eq("access_token", token)
    .maybeSingle()

  if (requestError) return NextResponse.json({ error: requestError.message }, { status: 500 })
  if (!matchRequest) {
    return NextResponse.json({ error: "Lien de supervision introuvable" }, { status: 404 })
  }
  if (matchRequest.status !== "approved") {
    return NextResponse.json(
      { error: "La conversation n'est accessible qu'après approbation du Mahram." },
      { status: 403 },
    )
  }

  const { data: conversation, error: conversationError } = await supabaseAdmin
    .from("conversations")
    .select("*")
    .eq("id", matchRequest.conversation_id)
    .maybeSingle()

  if (conversationError) return NextResponse.json({ error: conversationError.message }, { status: 500 })
  if (!conversation) {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 })
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles_public")
    .select(PUBLIC_PROFILE_SELECT)
    .in("id", [matchRequest.protected_user_id, matchRequest.match_user_id])

  if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 })

  const { data: messages, error: messagesError } = await supabaseAdmin
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at, flagged, flag_reason")
    .eq("conversation_id", matchRequest.conversation_id)
    .order("created_at", { ascending: true })

  if (messagesError) return NextResponse.json({ error: messagesError.message }, { status: 500 })

  const publicProfiles = (profiles || []) as unknown as PublicProfile[]

  return NextResponse.json({
    request: matchRequest,
    conversation,
    protectedProfile: publicProfiles.find(profile => profile.id === matchRequest.protected_user_id),
    matchProfile: publicProfiles.find(profile => profile.id === matchRequest.match_user_id),
    messages: messages || [],
  })
}
