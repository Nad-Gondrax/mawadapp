import { createClient } from './supabase/client'

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
    .select(
      'id, prenom, age, genre, ville, pays_origine, photo, taille, silhouette, ' +
      'barbe, hijab, style_vestimentaire, traits, profession, niveau_etudes, ' +
      'situation_pro, niveau_pratique, pratique_priere, situation_maritale, ' +
      'projet_mariage, souhaite_enfants, presentation, style_amour, style_vie, ' +
      'gestion_conflits, origine_pere_pays1, origine_pere_pays2, ' +
      'origine_mere_pays1, origine_mere_pays2, created_at'
    )

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
  return data
}

// ─────────────────────────────────────────────
// Likes
// ─────────────────────────────────────────────

export async function addLike(toUserId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('likes')
    .insert({ from_user_id: user.id, to_user_id: toUserId })
    .select()
    .single()

  if (error) throw error
  return data
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
