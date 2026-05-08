import { NextResponse } from "next/server"
import { isUserAdmin } from "@/lib/supabase/admin"

export async function GET() {
  const isAdmin = await isUserAdmin()

  if (!isAdmin) {
    return NextResponse.json(
      { error: "Accès non autorisé" },
      { status: 403 }
    )
  }

  return NextResponse.json({ authorized: true })
}
