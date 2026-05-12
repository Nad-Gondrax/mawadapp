import { createClient } from './supabase/client'
import type { DbPublicProfile } from './profile-mappers'

const PROFILE_PUBLIC_SELECT =
  'id, prenom, age, genre, ville, pays_origine, photo, photo_blurred, taille, silhouette, ' +
  'barbe, hijab, style_vestimentaire, traits, profession, niveau_etudes, ' +
  'situation_pro, niveau_pratique, pratique_priere, situation_maritale, ' +
  'projet_mariage, souhaite_enfants, presentation, style_amour, style_vie, ' +
  'gestion_conflits, origine_pere_pays1, origine_pere_pays2, ' +
  'origine_mere_pays1, origine_mere_pays2, created_at'

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// ─────────────────────────────────────────────
// Mon profil complet (owner only — RLS garanti)
// ─────────────────────────────────────────────

export async function getMyProfile() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}

export async function updateMyProfile(profile: Record<string, unknown>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ─────────────────────────────────────────────
// Découverte — utilise UNIQUEMENT profiles_public
// Aucun champ mahram, aucune donnée sensible
// ─────────────────────────────────────────────

export async function discoverProfiles(filters?: {
  ageMin?: number
  ageMax?: number
  ville?: string
  niveauEtudes?: string[]
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('profiles_public')
    .select(PROFILE_PUBLIC_SELECT)

  // Exclure son propre profil
  if (user) {
    query = query.neq('id', user.id)
  }

  if (filters?.ageMin) {
    query = query.gte('age', filters.ageMin)
  }
  if (filters?.ageMax) {
    query = query.lte('age', filters.ageMax)
  }
  if (filters?.ville) {
    query = query.ilike('ville', `%${filters.ville}%`)
  }
  if (filters?.niveauEtudes?.length) {
    query = query.in('niveau_etudes', filters.niveauEtudes)
  }

  const { data, error } = await query.limit(50)
  if (error) throw error
  return (data || []) as unknown as DbPublicProfile[]
}

// ─────────────────────────────────────────────
// Likes
// ─────────────────────────────────────────────

export async function addLike(toUserId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: existing, error: existingError } = await supabase
    .from('likes')
    .select('*')
    .eq('from_user_id', user.id)
    .eq('to_user_id', toUserId)
    .maybeSingle()

  if (existingError) throw existingError

  let like = existing

  if (!like) {
    const { data, error } = await supabase
      .from('likes')
      .insert({ from_user_id: user.id, to_user_id: toUserId })
      .select()
      .single()

    if (error) throw error
    like = data
  }

  const matched = await checkMutualLike(user.id, toUserId)
  const conversation = matched ? await ensureConversation(toUserId) : null
  const mahramRequest = conversation ? await createMahramMatchRequest(conversation.id) : null

  return { like, matched, conversation, mahramRequest }
}

export async function removeLike(toUserId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('from_user_id', user.id)
    .eq('to_user_id', toUserId)

  if (error) throw error
}

export async function checkMutualLike(userId1: string, userId2: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('likes')
    .select('*')
    .or(
      `and(from_user_id.eq.${userId1},to_user_id.eq.${userId2}),` +
      `and(from_user_id.eq.${userId2},to_user_id.eq.${userId1})`
    )

  if (error) throw error
  return data?.length === 2
}

export async function getLikedProfileIds() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('likes')
    .select('to_user_id')
    .eq('from_user_id', user.id)

  if (error) throw error
  return (data || []).map(like => like.to_user_id as string)
}

export async function getIncomingLikes() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: likes, error: likesError } = await supabase
    .from('likes')
    .select('from_user_id, to_user_id, created_at')
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (likesError) throw likesError

  const sent = new Set(
    (likes || [])
      .filter(like => like.from_user_id === user.id)
      .map(like => like.to_user_id as string),
  )

  const incoming = (likes || [])
    .filter(like => like.to_user_id === user.id && !sent.has(like.from_user_id as string))
    .map(like => ({
      profileId: like.from_user_id as string,
      date: like.created_at as string,
    }))

  const profileIds = incoming.map(like => like.profileId)
  if (profileIds.length === 0) return []

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles_public')
    .select(PROFILE_PUBLIC_SELECT)
    .in('id', profileIds)

  if (profilesError) throw profilesError
  const profiles = (profilesData || []) as unknown as DbPublicProfile[]

  return incoming.map(like => {
    const profile = profiles.find(item => item.id === like.profileId)
    return { ...like, profile }
  }).filter((like): like is typeof like & { profile: DbPublicProfile } => Boolean(like.profile))
}

export async function ensureConversation(otherUserId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const [user1, user2] = [user.id, otherUserId].sort()

  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('*')
    .or(
      `and(user_1_id.eq.${user1},user_2_id.eq.${user2}),` +
      `and(user_1_id.eq.${user2},user_2_id.eq.${user1})`,
    )
    .maybeSingle()

  if (findError) throw findError
  if (existing) return existing

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_1_id: user1,
      user_2_id: user2,
      mahram_status: 'pending',
      status: 'active',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createMahramMatchRequest(conversationId: string) {
  try {
    const response = await fetch('/api/match/mahram-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId }),
    })

    if (!response.ok) {
      console.warn('Mahram request creation failed', await response.text())
      return null
    }

    return response.json()
  } catch (error) {
    console.warn('Mahram request creation failed', error)
    return null
  }
}

export async function getMutualMatches() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: likes, error: likesError } = await supabase
    .from('likes')
    .select('from_user_id, to_user_id, created_at')
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)

  if (likesError) throw likesError

  const sent = new Set(
    (likes || [])
      .filter(like => like.from_user_id === user.id)
      .map(like => like.to_user_id as string),
  )

  const matches = (likes || [])
    .filter(like => like.to_user_id === user.id && sent.has(like.from_user_id as string))
    .map(like => ({
      profileId: like.from_user_id as string,
      date: like.created_at as string,
    }))

  const profileIds = matches.map(match => match.profileId)

  if (profileIds.length === 0) return []

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles_public')
    .select(PROFILE_PUBLIC_SELECT)
    .in('id', profileIds)

  if (profilesError) throw profilesError
  const profiles = (profilesData || []) as unknown as DbPublicProfile[]

  const { data: conversations, error: conversationsError } = await supabase
    .from('conversations')
    .select('*')
    .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)

  if (conversationsError) throw conversationsError

  return matches.map(match => {
    const profile = profiles.find(item => item.id === match.profileId)
    const conversation = (conversations || []).find(item =>
      (item.user_1_id === user.id && item.user_2_id === match.profileId) ||
      (item.user_2_id === user.id && item.user_1_id === match.profileId)
    )

    return { ...match, profile, conversation }
  }).filter((match): match is typeof match & { profile: DbPublicProfile } => Boolean(match.profile))
}

// ─────────────────────────────────────────────
// Conversations & Messages
// ─────────────────────────────────────────────

export async function getConversations() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getConversationThreads() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: conversations, error: conversationsError } = await supabase
    .from('conversations')
    .select('*')
    .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
    .order('updated_at', { ascending: false })

  if (conversationsError) throw conversationsError
  if (!conversations?.length) return []

  const partnerIds = conversations.map(conversation =>
    conversation.user_1_id === user.id ? conversation.user_2_id : conversation.user_1_id
  )

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles_public')
    .select(PROFILE_PUBLIC_SELECT)
    .in('id', partnerIds)

  if (profilesError) throw profilesError
  const profiles = (profilesData || []) as unknown as DbPublicProfile[]

  const conversationIds = conversations.map(conversation => conversation.id)
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: false })

  if (messagesError) throw messagesError

  return conversations.map(conversation => {
    const partnerId = conversation.user_1_id === user.id ? conversation.user_2_id : conversation.user_1_id
    const partner = profiles.find(profile => profile.id === partnerId)
    const conversationMessages = (messages || []).filter(message => message.conversation_id === conversation.id)
    const lastMessage = conversationMessages[0]
    const lastIncomingMessage = conversationMessages.find(message => message.sender_id !== user.id)

    return {
      conversation,
      partner,
      lastMessage,
      lastIncomingMessage,
      currentUserId: user.id,
    }
  }).filter((thread): thread is typeof thread & { partner: DbPublicProfile } => Boolean(thread.partner))
}

export async function getConversationDetails(conversationId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle()

  if (conversationError) throw conversationError
  if (!conversation) throw new Error('Conversation introuvable')

  const partnerId = conversation.user_1_id === user.id ? conversation.user_2_id : conversation.user_1_id
  const { data: partnerData, error: partnerError } = await supabase
    .from('profiles_public')
    .select(PROFILE_PUBLIC_SELECT)
    .eq('id', partnerId)
    .maybeSingle()

  if (partnerError) throw partnerError
  const partner = partnerData as unknown as DbPublicProfile | null
  if (!partner) throw new Error('Profil introuvable')

  return { conversation, partner, currentUserId: user.id }
}

export async function sendMessage(conversationId: string, content: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: user.id, content })
    .select()
    .single()

  if (error) throw error

  return data
}

export async function getMessages(conversationId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

// ─────────────────────────────────────────────
// Photo privacy
// ─────────────────────────────────────────────

export async function getPhotoUnblurStatuses(profileIds: string[]) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || profileIds.length === 0) return new Map<string, string>()

  const { data, error } = await supabase
    .from('photo_unblur_requests')
    .select('requested_user_id, status')
    .eq('requester_id', user.id)
    .in('requested_user_id', profileIds)

  if (error) throw error

  return new Map((data || []).map(item => [item.requested_user_id as string, item.status as string]))
}
