"use client"

import { ProfileCard } from "@/components/dashboard/profile-card"
import { MOCK_PROFILES, CURRENT_USER } from "@/lib/mock-data"

export default function NouveauxPage() {
  // Show newest profiles (sorted by date desc) of opposite gender
  const profiles = [...MOCK_PROFILES]
    .filter(p => p.genre !== CURRENT_USER.genre)
    .sort((a, b) => new Date(b.dateInscription).getTime() - new Date(a.dateInscription).getTime())

  return (
    <div className="max-w-4xl mx-auto">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="font-serif text-xl font-bold text-foreground">Nouveaux profils</h1>
        <p className="text-muted-foreground text-xs">{profiles.length} nouveaux membres récemment inscrits</p>
      </header>
      <div className="p-4">
        <div className="grid sm:grid-cols-2 gap-4">
          {profiles.map(p => (
            <ProfileCard key={p.id} profile={p} />
          ))}
        </div>
      </div>
    </div>
  )
}
