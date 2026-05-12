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
  "niveau_pratique",
  "situation_maritale",
  "projet_mariage",
  "presentation",
  "traits",
].join(", ")

type PublicProfile = {
  id: string
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
    return NextResponse.json({ error: "Token manquant" }, { status: 400 })
  }

  const supabaseAdmin = getAdminClient()

  const { data: matchRequest, error: requestError } = await supabaseAdmin
    .from("mahram_match_requests")
    .select("*")
    .eq("access_token", token)
    .maybeSingle()

  if (requestError) return NextResponse.json({ error: requestError.message }, { status: 500 })
  if (!matchRequest) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 })
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles_public")
    .select(PUBLIC_PROFILE_SELECT)
    .in("id", [matchRequest.protected_user_id, matchRequest.match_user_id])

  if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 })

  const publicProfiles = (profiles || []) as unknown as PublicProfile[]

  return NextResponse.json({
    request: matchRequest,
    protectedProfile: publicProfiles.find(profile => profile.id === matchRequest.protected_user_id),
    matchProfile: publicProfiles.find(profile => profile.id === matchRequest.match_user_id),
  })
}

export async function PATCH(request: Request) {
  const { token, decision } = await request.json()
  if (!token || !["approved", "refused"].includes(decision)) {
    return NextResponse.json({ error: "Parametres invalides" }, { status: 400 })
  }

  const supabaseAdmin = getAdminClient()

  const { data: matchRequest, error: findError } = await supabaseAdmin
    .from("mahram_match_requests")
    .select("*")
    .eq("access_token", token)
    .maybeSingle()

  if (findError) return NextResponse.json({ error: findError.message }, { status: 500 })
  if (!matchRequest) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 })
  }

  const { data: updatedRequest, error: updateRequestError } = await supabaseAdmin
    .from("mahram_match_requests")
    .update({
      status: decision,
    })
    .eq("id", matchRequest.id)
    .select("*")
    .single()

  if (updateRequestError) {
    return NextResponse.json({ error: updateRequestError.message }, { status: 500 })
  }

  const { error: updateConversationError } = await supabaseAdmin
    .from("conversations")
    .update({
      mahram_status: decision,
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchRequest.conversation_id)

  if (updateConversationError) {
    return NextResponse.json({ error: updateConversationError.message }, { status: 500 })
  }

  return NextResponse.json({ request: updatedRequest })
}
