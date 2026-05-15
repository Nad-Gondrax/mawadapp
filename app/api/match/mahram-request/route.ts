import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin-client"

type ProfileRow = {
  id: string
  prenom: string | null
  genre: string | null
  mahram_email: string | null
  mahram_nom: string | null
}

async function sendMahramEmail(params: {
  to: string
  protectedName: string
  matchName: string
  approvalUrl: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  const from = (process.env.TAYM_EMAIL_FROM || process.env.MAWADA_EMAIL_FROM || "").replace(/^Mawada\b/, "Taym")

  if (!apiKey || !from) {
    console.log("[Taym] Email Mahram à envoyer", params)
    return { sent: false, reason: "Email provider not configured" }
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: `Taym - Validation d'un match pour ${params.protectedName}`,
      text: [
        "Salam alaykoum,",
        "",
        `Un match mutuel a été détecté entre ${params.protectedName} et ${params.matchName}.`,
        "Votre validation est requise avant toute discussion supervisée.",
        "",
        `Examiner et valider le match : ${params.approvalUrl}`,
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;color:#102a27;line-height:1.6">
          <p>Salam alaykoum,</p>
          <p>Un match mutuel a été détecté entre <strong>${params.protectedName}</strong> et <strong>${params.matchName}</strong>.</p>
          <p>Votre validation est requise avant toute discussion supervisée.</p>
          <p>
            <a href="${params.approvalUrl}" style="display:inline-block;background:#059669;color:white;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">
              Examiner et valider le match
            </a>
          </p>
          <p style="color:#64748b;font-size:13px">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur : ${params.approvalUrl}</p>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Email send failed")
  }

  return { sent: true }
}

function getAppOrigin(request: Request) {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configuredOrigin) return configuredOrigin

  return new URL(request.url).origin
}

export async function POST(request: Request) {
  try {
    const { conversationId } = await request.json()
    if (!conversationId) {
      return NextResponse.json({ error: "Conversation manquante" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    const { data: conversation, error: conversationError } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .maybeSingle()

    if (conversationError) throw conversationError
    if (!conversation) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 })
    }

    const isParticipant = conversation.user_1_id === user.id || conversation.user_2_id === user.id
    if (!isParticipant) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const participantIds = [conversation.user_1_id, conversation.user_2_id]
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, prenom, genre, mahram_email, mahram_nom")
      .in("id", participantIds)

    if (profilesError) throw profilesError

    const profiles = (profilesData || []) as ProfileRow[]
    const protectedProfile = profiles.find(profile => profile.genre === "femme")
      || profiles.find(profile => profile.mahram_email)

    if (!protectedProfile) {
      return NextResponse.json({ error: "Profil protégé introuvable" }, { status: 400 })
    }

    const matchProfile = profiles.find(profile => profile.id !== protectedProfile.id)
    if (!matchProfile) {
      return NextResponse.json({ error: "Profil du match introuvable" }, { status: 400 })
    }

    const { data: existingRequest, error: existingRequestError } = await supabaseAdmin
      .from("mahram_match_requests")
      .select("*")
      .eq("conversation_id", conversation.id)
      .maybeSingle()

    if (existingRequestError) throw existingRequestError

    let matchRequest = existingRequest

    if (!matchRequest) {
      const { data: insertedRequest, error: requestError } = await supabaseAdmin
        .from("mahram_match_requests")
        .insert({
          conversation_id: conversation.id,
          protected_user_id: protectedProfile.id,
          match_user_id: matchProfile.id,
          mahram_email: protectedProfile.mahram_email,
          mahram_name: protectedProfile.mahram_nom,
          status: "pending",
          email_status: "pending",
        })
        .select("*")
        .single()

      if (requestError) throw requestError
      matchRequest = insertedRequest
    }

    let emailResult: { sent: boolean; reason?: string } = { sent: false, reason: "No mahram email" }

    if (protectedProfile.mahram_email && matchRequest.email_status !== "sent") {
      const approvalUrl = new URL(
        `/mahram-interface?token=${matchRequest.access_token}`,
        getAppOrigin(request),
      ).toString()

      try {
        emailResult = await sendMahramEmail({
          to: protectedProfile.mahram_email,
          protectedName: protectedProfile.prenom || "votre proche",
          matchName: matchProfile.prenom || "un profil",
          approvalUrl,
        })

        if (emailResult.sent) {
          await supabaseAdmin
            .from("mahram_match_requests")
            .update({
              email_status: "sent",
            })
            .eq("id", matchRequest.id)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Email failed"
        await supabaseAdmin
          .from("mahram_match_requests")
          .update({
            email_status: "failed",
          })
          .eq("id", matchRequest.id)
        emailResult = { sent: false, reason: message }
      }
    }

    return NextResponse.json({
      request: matchRequest,
      email: emailResult,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
