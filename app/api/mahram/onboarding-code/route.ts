import { createHmac, randomInt, timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

const CODE_TTL_MS = 15 * 60 * 1000

type ChallengePayload = {
  email: string
  relation: string
  expiresAt: number
  codeMac: string
}

function getSecret() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.RESEND_API_KEY || "mawada-dev-secret"
}

function hmac(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url")
}

function signPayload(payload: ChallengePayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `${encodedPayload}.${hmac(encodedPayload)}`
}

function readPayload(token: string): ChallengePayload | null {
  const [encodedPayload, signature] = token.split(".")
  if (!encodedPayload || !signature) return null

  const expectedSignature = hmac(encodedPayload)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null
  }

  try {
    return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as ChallengePayload
  } catch {
    return null
  }
}

function getCodeMac(email: string, relation: string, code: string, expiresAt: number) {
  return hmac(`${email.toLowerCase()}|${relation}|${code}|${expiresAt}`)
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

async function sendCodeEmail(email: string, relation: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.MAWADA_EMAIL_FROM

  if (!apiKey || !from) {
    return { sent: false, reason: "Email provider not configured" }
  }

  const safeRelation = escapeHtml(relation)
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Mawada - Code de validation Mahram",
      text: [
        "Salam alaykoum,",
        "",
        `Votre code de validation Mahram est : ${code}`,
        "",
        `Relation indiquée : ${relation}`,
        "Ce code expire dans 15 minutes.",
        "",
        "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;color:#102a27;line-height:1.6">
          <p>Salam alaykoum,</p>
          <p>Votre code de validation Mahram est :</p>
          <p style="font-size:32px;font-weight:800;letter-spacing:8px;margin:18px 0;color:#009688">${code}</p>
          <p>Relation indiquée : <strong>${safeRelation}</strong></p>
          <p style="color:#64748b;font-size:13px">Ce code expire dans 15 minutes.</p>
          <p style="color:#64748b;font-size:13px">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    return { sent: false, reason: message || "Email send failed" }
  }

  return { sent: true }
}

export async function POST(request: Request) {
  const { email, relation } = await request.json()
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : ""
  const normalizedRelation = typeof relation === "string" ? relation.trim() : ""

  if (!isValidEmail(normalizedEmail) || !normalizedRelation) {
    return NextResponse.json({ error: "Email ou type de Mahram invalide" }, { status: 400 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userEmail = user?.email?.trim().toLowerCase()

  if (userEmail && userEmail === normalizedEmail) {
    return NextResponse.json(
      { error: "L'email du Mahram doit être différent de votre email de connexion." },
      { status: 400 },
    )
  }

  const code = String(randomInt(1000, 10000))
  const expiresAt = Date.now() + CODE_TTL_MS
  const token = signPayload({
    email: normalizedEmail,
    relation: normalizedRelation,
    expiresAt,
    codeMac: getCodeMac(normalizedEmail, normalizedRelation, code, expiresAt),
  })

  const emailResult = await sendCodeEmail(normalizedEmail, normalizedRelation, code)
  if (!emailResult.sent) {
    return NextResponse.json(
      { error: "Impossible d'envoyer le code au Mahram pour le moment." },
      { status: 502 },
    )
  }

  return NextResponse.json({ token, expiresAt })
}

export async function PATCH(request: Request) {
  const { token, code } = await request.json()
  const payload = typeof token === "string" ? readPayload(token) : null
  const normalizedCode = typeof code === "string" ? code.replace(/\D/g, "") : ""

  if (!payload || normalizedCode.length !== 4) {
    return NextResponse.json({ error: "Code invalide" }, { status: 400 })
  }

  if (Date.now() > payload.expiresAt) {
    return NextResponse.json({ error: "Code expire. Demandez un nouveau code." }, { status: 410 })
  }

  const expectedCodeMac = getCodeMac(payload.email, payload.relation, normalizedCode, payload.expiresAt)
  if (payload.codeMac !== expectedCodeMac) {
    return NextResponse.json({ error: "Code incorrect" }, { status: 401 })
  }

  return NextResponse.json({
    verified: true,
    email: payload.email,
    relation: payload.relation,
  })
}
