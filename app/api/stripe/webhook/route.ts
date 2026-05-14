import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/admin-client"
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe"

function getCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  return typeof customer === "string" ? customer : customer?.id ?? null
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription) {
  const withPeriod = subscription as Stripe.Subscription & { current_period_end?: number }
  return withPeriod.current_period_end
    ? new Date(withPeriod.current_period_end * 1000).toISOString()
    : null
}

async function upsertSubscription(subscription: Stripe.Subscription, fallbackUserId?: string | null) {
  const userId = subscription.metadata?.user_id || fallbackUserId
  if (!userId) return

  const supabase = createAdminClient()
  const firstItem = subscription.items.data[0]

  await supabase
    .from("user_subscriptions")
    .upsert(
      {
        user_id: userId,
        status: subscription.status,
        source: "stripe",
        stripe_customer_id: getCustomerId(subscription.customer),
        stripe_subscription_id: subscription.id,
        stripe_price_id: firstItem?.price?.id ?? null,
        stripe_current_period_end: getCurrentPeriodEnd(subscription),
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
      { onConflict: "user_id" },
    )
}

export async function POST(request: Request) {
  const stripe = getStripe()
  const webhookSecret = getStripeWebhookSecret()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Signature Stripe manquante" }, { status: 400 })
  }

  const rawBody = await request.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook invalide" },
      { status: 400 },
    )
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.mode === "subscription" && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        await upsertSubscription(subscription, session.client_reference_id)
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription
      await upsertSubscription(subscription)
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook non traité" },
      { status: 500 },
    )
  }

  return NextResponse.json({ received: true })
}
