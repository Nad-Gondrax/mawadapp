import Stripe from "stripe"

export const SUBSCRIPTION_PRICE_EUROS = "24,90"
export const SUBSCRIPTION_PRICE_CENTS = 2490
export const SUBSCRIPTION_CURRENCY = "eur"

export function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")
}

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY manquante")
  }

  return new Stripe(secretKey)
}

export function getStripePriceId() {
  const priceId = process.env.STRIPE_PRICE_ID

  if (!priceId) {
    throw new Error("STRIPE_PRICE_ID manquant")
  }

  return priceId
}

export function getStripeWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET manquant")
  }

  return webhookSecret
}
