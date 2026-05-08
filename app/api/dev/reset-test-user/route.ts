import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Cette route permet de supprimer l'utilisateur de test pour pouvoir le réutiliser
// Accessible uniquement en développement ou avec une clé secrète

const TEST_EMAIL = "onadhir@yahoo.fr"

export async function DELETE(request: Request) {
  // Vérifier qu'on est en dev ou que la clé secrète est fournie
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret")
  
  const isAuthorized = 
    process.env.NODE_ENV === "development" || 
    secret === process.env.DEV_RESET_SECRET ||
    secret === "mawada-dev-2024"

  if (!isAuthorized) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  // Utiliser le service role key pour supprimer dans auth.users
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Supprimer l'utilisateur
  const { data: users } = await supabaseAdmin.auth.admin.listUsers()
  const testUser = users?.users?.find(u => u.email === TEST_EMAIL)

  if (!testUser) {
    return NextResponse.json({ message: "Utilisateur de test non trouvé, déjà supprimé ou inexistant." })
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(testUser.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ 
    success: true, 
    message: `Utilisateur ${TEST_EMAIL} supprimé avec succès. Tu peux te réinscrire.` 
  })
}
