import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin-client"
import { getAppUrl, getStripe, getStripePriceId } from "@/lib/stripe"

type PromoCodeRow = {
  id: string
  code: string
  discount_type: "percent" | "amount" | "free"
  discount_value: number
  duration: "once" | "forever" | "repeating"
  active: boolean
  max_redemptions: number | null
  redeemed_count: number
  expires_at: string | null
  stripe_promotion_code_id: string | null
}

function normalizeCode(code: string) {
  return code.trim().toLowerCase()
}

function isExpired(expiresAt: string | null) {
  return Boolean(expiresAt && new Date(expiresAt).getTime() < Date.now())
}

function isRedeemedOut(promo: PromoCodeRow) {
  return Boolean(promo.max_redemptions && promo.redeemed_count >= promo.max_redemptions)
}

async function redeemFreeAccess(userId: string, promo: PromoCodeRow) {
  const supabaseAdmin = createAdminClient()

  const { data: existingRedemption, error: existingError } = await supabaseAdmin
    .from("promo_code_redemptions")
    .select("id")
    .eq("promo_code_id", promo.id)
    .eq("user_id", userId)
    .maybeSingle()

  if (existingError) throw existingError

  if (!existingRedemption) {
    const { error: redemptionError } = await supabaseAdmin
      .from("promo_code_redemptions")
      .insert({ promo_code_id: promo.id, user_id: userId })

    if (redemptionError) throw redemptionError

    const { error: promoError } = await supabaseAdmin
      .from("promo_codes")
      .update({ redeemed_count: promo.redeemed_count + 1 })
      .eq("id", promo.id)

    if (promoError) throw promoError
  }

  const { error: subscriptionError } = await supabaseAdmin
    .from("user_subscriptions")
    .upsert(
      {
        user_id: userId,
        status: "active",
        source: "coupon",
        promo_code_id: promo.id,
        cancel_at_period_end: false,
      },
      { onConflict: "user_id" },
    )

  if (subscriptionError) throw subscriptionError
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 })
  }

  const { promoCode } = await request.json().catch(() => ({ promoCode: "" }))
  const normalizedPromoCode = typeof promoCode === "string" ? normalizeCode(promoCode) : ""
  const supabaseAdmin = createAdminClient()

  let promotionCodeId: string | null = null
  let localPromoId: string | null = null

  if (normalizedPromoCode) {
    const { data: promoData, error: promoError } = await supabaseAdmin
      .from("promo_codes")
      .select("*")
      .eq("code_normalized", normalizedPromoCode)
      .maybeSingle()

    if (promoError) {
      return NextResponse.json({ error: promoError.message }, { status: 500 })
    }

    const promo = promoData as PromoCodeRow | null

    if (!promo || !promo.active || isExpired(promo.expires_at) || isRedeemedOut(promo)) {
      return NextResponse.json({ error: "Ce code promo n'est pas valide." }, { status: 400 })
    }

    localPromoId = promo.id

    if (promo.discount_type === "free") {
      try {
        await redeemFreeAccess(user.id, promo)
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Impossible d'appliquer ce code." },
          { status: 500 },
        )
      }

      return NextResponse.json({ freeAccess: true, redirectUrl: "/dashboard" })
    }

    if (!promo.stripe_promotion_code_id) {
      return NextResponse.json(
        { error: "Ce code promo n'est pas encore relié à Stripe." },
        { status: 500 },
      )
    }

    promotionCodeId = promo.stripe_promotion_code_id
  }

  try {
    const stripe = getStripe()
    const priceId = getStripePriceId()
    const appUrl = getAppUrl()

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email || undefined,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/abonnement/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/abonnement?paiement=annule`,
      allow_promotion_codes: !promotionCodeId,
      after_expiration: {
        recovery: {
          enabled: true,
          allow_promotion_codes: true,
        },
      },
      discounts: promotionCodeId ? [{ promotion_code: promotionCodeId }] : undefined,
      metadata: {
        user_id: user.id,
        promo_code_id: localPromoId || "",
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          promo_code_id: localPromoId || "",
        },
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Paiement indisponible." },
      { status: 500 },
    )
  }
}
