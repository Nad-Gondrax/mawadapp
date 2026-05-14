import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hasSupabaseEnv } from './env'

function isSubscriptionActive(subscription?: {
  status?: string | null
  stripe_current_period_end?: string | null
} | null) {
  if (!subscription) return false
  if (!['active', 'trialing'].includes(subscription.status ?? '')) return false
  if (!subscription.stripe_current_period_end) return true
  return new Date(subscription.stripe_current_period_end).getTime() > Date.now()
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  if (!hasSupabaseEnv()) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Routes protégées — redirige vers accueil si non connecté
  const protectedPaths = ['/dashboard', '/chat', '/profil', '/admin', '/abonnement']
  const isProtected = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Si connecté sur /dashboard ou /chat ou /profil → vérifier onboarding
  const requiresOnboarding = ['/dashboard', '/chat', '/profil', '/admin', '/abonnement']
  const requiresCheck = requiresOnboarding.some(path => pathname.startsWith(path))

  if (user && requiresCheck) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single()

    if (!profile?.onboarding_complete && !pathname.startsWith('/onboarding')) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    const requiresSubscription = ['/dashboard', '/chat'].some(path => pathname.startsWith(path))

    if (profile?.onboarding_complete && requiresSubscription) {
      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('status, stripe_current_period_end')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!subscriptionError && !isSubscriptionActive(subscription)) {
        const url = request.nextUrl.clone()
        url.pathname = '/abonnement'
        return NextResponse.redirect(url)
      }
    }
  }

  // Si connecté et onboarding déjà complété → redirige vers dashboard depuis /onboarding
  if (user && pathname.startsWith('/onboarding')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single()

    const editMode = request.nextUrl.searchParams.get('edit') === '1'

    if (profile?.onboarding_complete && !editMode) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
