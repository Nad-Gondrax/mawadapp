import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin-client"
import { getStripe } from "@/lib/stripe"

function getCurrentPeriodEnd(subscription: Stripe.Subscription) {
  const withPeriod = subscription as Stripe.Subscription & { current_period_end?: number }
  return withPeriod.current_period_end
    ? new Date(withPeriod.current_period_end * 1000).toISOString()
    : null
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("session_id")

  if (!sessionId) {
    return NextResponse.json({ error: "Session Stripe manquante." }, { status: 400 })
  }

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.client_reference_id !== user.id) {
      return NextResponse.json({ error: "Session invalide." }, { status: 403 })
    }

    if (!session.subscription) {
      return NextResponse.json({ error: "Abonnement introuvable." }, { status: 400 })
    }

    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    const supabaseAdmin = createAdminClient()
    const firstItem = subscription.items.data[0]

    const { error } = await supabaseAdmin
      .from("user_subscriptions")
      .upsert(
        {
          user_id: user.id,
          status: subscription.status,
          source: "stripe",
          stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
          stripe_subscription_id: subscription.id,
          stripe_price_id: firstItem?.price?.id ?? null,
          stripe_current_period_end: getCurrentPeriodEnd(subscription),
          cancel_at_period_end: subscription.cancel_at_period_end,
        },
        { onConflict: "user_id" },
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ active: ["active", "trialing"].includes(subscription.status) })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Confirmation impossible." },
      { status: 500 },
    )
  }
}
