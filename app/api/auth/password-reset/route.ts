import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin-client"

function getAppOrigin(request: Request) {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configuredOrigin) return configuredOrigin.replace(/\/$/, "")

  return new URL(request.url).origin
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

async function sendResetEmail(email: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY
  const from = (process.env.TAYM_EMAIL_FROM || process.env.MAWADA_EMAIL_FROM || "").replace(/^Mawada\b/, "Taym")

  if (!apiKey || !from) {
    throw new Error("Email provider not configured")
  }

  const safeResetUrl = escapeHtml(resetUrl)
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Taym - Réinitialisation du mot de passe",
      text: [
        "Salam alaykoum,",
        "",
        "Vous avez demandé à réinitialiser votre mot de passe Taym.",
        `Choisir un nouveau mot de passe : ${resetUrl}`,
        "",
        "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;color:#102a27;line-height:1.6">
          <p>Salam alaykoum,</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe Taym.</p>
          <p>
            <a href="${safeResetUrl}" style="display:inline-block;background:#059669;color:white;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">
              Choisir un nouveau mot de passe
            </a>
          </p>
          <p style="color:#64748b;font-size:13px">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur : ${safeResetUrl}</p>
          <p style="color:#64748b;font-size:13px">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Email send failed")
  }
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : ""

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 })
    }

    const redirectTo = `${getAppOrigin(request)}/auth/callback?type=recovery`
    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: normalizedEmail,
      options: { redirectTo },
    })

    if (error) {
      console.error("[Taym] Password reset link error", error.message)
      return NextResponse.json({ success: true })
    }

    const resetUrl = data.properties?.action_link
    if (resetUrl) {
      await sendResetEmail(normalizedEmail, resetUrl)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Taym] Password reset email error", error)
    return NextResponse.json(
      { error: "Impossible d'envoyer l'email de réinitialisation pour le moment." },
      { status: 500 },
    )
  }
}
