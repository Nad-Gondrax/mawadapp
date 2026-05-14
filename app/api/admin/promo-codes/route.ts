import { NextResponse } from "next/server"
import { isUserAdmin } from "@/lib/supabase/admin"
import { createAdminClient } from "@/lib/supabase/admin-client"
import { SUBSCRIPTION_CURRENCY, getStripe } from "@/lib/stripe"

type PromoCodeInput = {
  code?: string
  discountType?: "percent" | "amount" | "free"
  discountValue?: number
  duration?: "once" | "forever" | "repeating"
  durationInMonths?: number | null
  maxRedemptions?: number | null
  expiresAt?: string | null
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase()
}

function isMissingPromoTable(message: string) {
  return message.includes("promo_codes") || message.includes("does not exist")
}

export async function GET() {
  const isAdmin = await isUserAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    if (isMissingPromoTable(error.message)) {
      return NextResponse.json({ promoCodes: [], setupRequired: true })
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ promoCodes: data ?? [], setupRequired: false })
}

export async function POST(request: Request) {
  const isAdmin = await isUserAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
  }

  const input = (await request.json()) as PromoCodeInput
  const code = input.code ? normalizeCode(input.code) : ""
  const discountType = input.discountType
  const discountValue = Number(input.discountValue ?? 0)
  const duration = input.duration ?? "once"
  const durationInMonths = input.durationInMonths || null
  const maxRedemptions = input.maxRedemptions || null
  const expiresAt = input.expiresAt || null

  if (!code || !discountType) {
    return NextResponse.json({ error: "Code et type de réduction obligatoires." }, { status: 400 })
  }

  if (discountType === "percent" && (discountValue <= 0 || discountValue > 100)) {
    return NextResponse.json({ error: "La réduction en pourcentage doit être entre 1 et 100." }, { status: 400 })
  }

  if (discountType === "amount" && discountValue <= 0) {
    return NextResponse.json({ error: "Le montant de réduction doit être supérieur à 0." }, { status: 400 })
  }

  let stripeCouponId: string | null = null
  let stripePromotionCodeId: string | null = null

  if (discountType !== "free") {
    try {
      const stripe = getStripe()
      const coupon = await stripe.coupons.create({
        name: `Mawada ${code}`,
        percent_off: discountType === "percent" ? discountValue : undefined,
        amount_off: discountType === "amount" ? Math.round(discountValue * 100) : undefined,
        currency: discountType === "amount" ? SUBSCRIPTION_CURRENCY : undefined,
        duration,
        duration_in_months: duration === "repeating" ? durationInMonths || 1 : undefined,
      })

      const promotionCode = await stripe.promotionCodes.create({
        code,
        promotion: {
          type: "coupon",
          coupon: coupon.id,
        },
        active: true,
        max_redemptions: maxRedemptions || undefined,
        expires_at: expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : undefined,
      })

      stripeCouponId = coupon.id
      stripePromotionCodeId = promotionCode.id
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Impossible de créer le code dans Stripe." },
        { status: 500 },
      )
    }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("promo_codes")
    .insert({
      code,
      discount_type: discountType,
      discount_value: discountType === "free" ? 100 : discountValue,
      duration: discountType === "free" ? "forever" : duration,
      duration_in_months: duration === "repeating" ? durationInMonths : null,
      active: true,
      max_redemptions: maxRedemptions,
      expires_at: expiresAt,
      stripe_coupon_id: stripeCouponId,
      stripe_promotion_code_id: stripePromotionCodeId,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ promoCode: data })
}

export async function PATCH(request: Request) {
  const isAdmin = await isUserAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
  }

  const { id, active, stripePromotionCodeId } = await request.json()

  if (!id || typeof active !== "boolean") {
    return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 })
  }

  if (stripePromotionCodeId) {
    try {
      const stripe = getStripe()
      await stripe.promotionCodes.update(stripePromotionCodeId, { active })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Impossible de modifier le code dans Stripe." },
        { status: 500 },
      )
    }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("promo_codes")
    .update({ active })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
