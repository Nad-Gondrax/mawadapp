import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type SubscriptionRow = {
  status: string
  source: string
  stripe_current_period_end: string | null
  cancel_at_period_end: boolean
}

function isMissingSubscriptionTable(message: string) {
  return message.includes("user_subscriptions") || message.includes("does not exist")
}

function isActiveSubscription(subscription: SubscriptionRow | null) {
  if (!subscription) return false
  if (!["active", "trialing"].includes(subscription.status)) return false
  if (!subscription.stripe_current_period_end) return true
  return new Date(subscription.stripe_current_period_end).getTime() > Date.now()
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ active: false, error: "Connexion requise." }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("status, source, stripe_current_period_end, cancel_at_period_end")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    if (isMissingSubscriptionTable(error.message)) {
      return NextResponse.json({ active: false, setupRequired: true })
    }

    return NextResponse.json({ active: false, error: error.message }, { status: 500 })
  }

  const subscription = (data as SubscriptionRow | null) ?? null

  return NextResponse.json({
    active: isActiveSubscription(subscription),
    subscription,
    setupRequired: false,
  })
}
