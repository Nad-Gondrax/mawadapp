"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  ChevronLeft, MapPin, Globe, BookOpen, Users, Heart, Pencil, Shield, 
  GraduationCap, Briefcase, Ruler, Shirt, Home, Baby, Sparkles,
  HeartHandshake, Flame, MessageCircle, UserCheck, Loader2
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  NIVEAUX_PRATIQUE_LABELS, NIVEAUX_ETUDES_LABELS,
  PROJET_MARIAGE_LABELS, SITUATION_MARITALE_LABELS
} from "@/lib/mock-data"

// Labels pour les nouveaux champs
const SILHOUETTE_LABELS: Record<string, string> = {
  mince: "Mince",
  normal: "Normal",
  atheltique: "Athlétique",
  ronde: "Ronde",
  forte: "Forte",
}

const HIJAB_LABELS: Record<string, string> = {
  oui_jilbab: "Jilbab",
  oui_turban: "Turban / Hijab classique",
  non: "Ne porte pas le voile",
}

const AVEC_QUI_LABELS: Record<string, string> = {
  seul: "Seul(e)",
  parents: "Chez mes parents",
  colocataires: "En colocation",
  enfants: "Avec mes enfants",
}

const RELATION_SEXE_LABELS: Record<string, string> = {
  aucune: "Aucune relation",
  travail: "Uniquement au travail",
  amicale: "Relations amicales",
  mixte: "Environnement mixte",
}

const ACCEPTE_LABELS: Record<string, string> = {
  oui: "Oui",
  non: "Non",
  peut_etre: "Peut-être",
}

interface Profile {
  id: string
  prenom: string
  age: number
  genre: string
  ville: string
  pays_origine: string
  photo: string | null
  taille: number | null
  silhouette: string | null
  barbe: boolean | null
  hijab: string | null
  style_vestimentaire: string[]
  traits: string[]
  profession: string | null
  niveau_etudes: string | null
  niveau_etudes_autre: string | null
  situation_pro: string | null
  niveau_pratique: string | null
  pratique_priere: string | null
  situation_maritale: string | null
  avec_qui: string | null
  projet_mariage: string | null
  souhaite_enfants: string | null
  nombre_enfants: number | null
  origine_pere_pays1: string | null
  origine_pere_pays2: string | null
  origine_mere_pays1: string | null
  origine_mere_pays2: string | null
  relation_sexe_oppose: string | null
  accepte_enfants: string | null
  accepte_divorce: string | null
  style_amour: string[]
  style_vie: string[]
  gestion_conflits: string[]
  attraits: string[]
  repoussants: string[]
  presentation: string | null
  onboarding_complete: boolean
  mahram_statut?: string
}

export default function ProfilPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMe, setIsMe] = useState(false)
  const [resolvedId, setResolvedId] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      const { id } = await params
      setResolvedId(id)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (id === "me" && user) {
        setIsMe(true)
        // Charger son propre profil complet depuis profiles
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        setProfile(data)
      } else {
        // Charger un autre profil depuis profiles_public
        const { data } = await supabase
          .from("profiles_public")
          .select("*")
          .eq("id", id)
          .single()
        setProfile(data)
        setIsMe(user?.id === id)
      }
      setLoading(false)
    }
    loadProfile()
  }, [params])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Profil introuvable</p>
        <button onClick={() => router.back()} className="text-primary hover:underline">
          Retour
        </button>
      </div>
    )
  }

  // Construire les origines
  const originesPere = [profile.origine_pere_pays1, profile.origine_pere_pays2].filter(Boolean).join(" / ")
  const originesMere = [profile.origine_mere_pays1, profile.origine_mere_pays2].filter(Boolean).join(" / ")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="font-serif font-bold text-foreground flex-1">
          {isMe ? "Mon profil" : `Profil de ${profile.prenom}`}
        </h1>
        {isMe && (
          <button className="flex items-center gap-1.5 px-3 py-2 bg-secondary border border-border rounded-xl text-sm font-medium hover:bg-border transition-colors">
            <Pencil className="w-3.5 h-3.5" />
            Modifier
          </button>
        )}
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Hero photo */}
        <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
          <img
            src={profile.photo || (profile.genre === "femme" ? "/profil_femme.png" : "/profil_homme.png")}
            alt={`Photo de ${profile.prenom}`}
            className="w-full h-full object-cover"
          />
          {/* Mahram badge (pour les femmes) */}
          {profile.genre === "femme" && (
            <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow ${
              profile.mahram_statut === "valide"
                ? "bg-emerald-500 text-white"
                : "bg-amber-500 text-white"
            }`}>
              <Shield className="w-3.5 h-3.5" />
              {profile.mahram_statut === "valide" ? "Mahram valide" : "Mahram en attente"}
            </div>
          )}
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Nom et infos de base */}
          <div>
            <h2 className="font-serif text-3xl font-bold text-foreground">{profile.prenom}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-muted-foreground text-sm">
              <span className="font-semibold text-foreground text-lg">{profile.age} ans</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.ville}</span>
              <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{profile.pays_origine}</span>
            </div>
          </div>

          {/* Presentation */}
          {profile.presentation && (
            <div className="bg-secondary rounded-2xl p-4">
              <p className="text-foreground leading-relaxed italic">{`"${profile.presentation}"`}</p>
            </div>
          )}

          {/* SECTION: Pratique religieuse */}
          <Section title="Pratique religieuse">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard
                icon={<BookOpen className="w-4 h-4" />}
                label="Niveau"
                value={profile.niveau_pratique ? NIVEAUX_PRATIQUE_LABELS[profile.niveau_pratique] || profile.niveau_pratique : "-"}
              />
              <InfoCard
                icon={<Sparkles className="w-4 h-4" />}
                label="Priere"
                value={profile.pratique_priere || "-"}
              />
            </div>
            {profile.relation_sexe_oppose && (
              <div className="mt-3 bg-card rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">Relation avec le sexe oppose</p>
                <p className="text-sm font-medium text-foreground">{RELATION_SEXE_LABELS[profile.relation_sexe_oppose] || profile.relation_sexe_oppose}</p>
              </div>
            )}
          </Section>

          {/* SECTION: Situation */}
          <Section title="Situation">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard
                icon={<Users className="w-4 h-4" />}
                label="Situation"
                value={profile.situation_maritale ? SITUATION_MARITALE_LABELS[profile.situation_maritale] || profile.situation_maritale : "-"}
              />
              <InfoCard
                icon={<Heart className="w-4 h-4" />}
                label="Projet"
                value={profile.projet_mariage ? PROJET_MARIAGE_LABELS[profile.projet_mariage] || profile.projet_mariage : "-"}
              />
              <InfoCard
                icon={<Home className="w-4 h-4" />}
                label="Vit"
                value={profile.avec_qui ? AVEC_QUI_LABELS[profile.avec_qui] || profile.avec_qui : "-"}
              />
              <InfoCard
                icon={<Baby className="w-4 h-4" />}
                label="Souhaite enfants"
                value={
                  profile.souhaite_enfants === "oui" 
                    ? "Oui" 
                    : profile.souhaite_enfants === "non" 
                    ? "Non" 
                    : profile.souhaite_enfants === "sais_pas"
                    ? "Ne sait pas"
                    : profile.souhaite_enfants || "-"
                }
              />
            </div>
            {/* A des enfants */}
            {profile.nombre_enfants !== null && profile.nombre_enfants > 0 && (
              <div className="mt-3 bg-card rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">A des enfants</p>
                <p className="text-sm font-medium text-foreground">Oui ({profile.nombre_enfants} enfant{profile.nombre_enfants > 1 ? "s" : ""})</p>
              </div>
            )}

            {/* Ouverture */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              {profile.accepte_divorce && (
                <div className="bg-card rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">Accepte une personne divorcee</p>
                  <p className="text-sm font-medium text-foreground">{ACCEPTE_LABELS[profile.accepte_divorce] || profile.accepte_divorce}</p>
                </div>
              )}
              {profile.accepte_enfants && (
                <div className="bg-card rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">Accepte enfants du conjoint</p>
                  <p className="text-sm font-medium text-foreground">{ACCEPTE_LABELS[profile.accepte_enfants] || profile.accepte_enfants}</p>
                </div>
              )}
            </div>
          </Section>

          {/* SECTION: Education & Profession */}
          <Section title="Parcours">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard
                icon={<GraduationCap className="w-4 h-4" />}
                label="Etudes"
                value={profile.niveau_etudes ? (NIVEAUX_ETUDES_LABELS[profile.niveau_etudes] || profile.niveau_etudes) + (profile.niveau_etudes_autre ? ` (${profile.niveau_etudes_autre})` : "") : "-"}
              />
              <InfoCard
                icon={<Briefcase className="w-4 h-4" />}
                label="Profession"
                value={profile.profession || "-"}
              />
            </div>
            {profile.situation_pro && (
              <div className="mt-3 bg-card rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">Situation professionnelle</p>
                <p className="text-sm font-medium text-foreground">{profile.situation_pro}</p>
              </div>
            )}
          </Section>

          {/* SECTION: Origines */}
          {(originesPere || originesMere) && (
            <Section title="Origines familiales">
              <div className="grid grid-cols-2 gap-3">
                {originesPere && (
                  <div className="bg-card rounded-xl border border-border p-3">
                    <p className="text-xs text-muted-foreground">Origines du pere</p>
                    <p className="text-sm font-medium text-foreground">{originesPere}</p>
                  </div>
                )}
                {originesMere && (
                  <div className="bg-card rounded-xl border border-border p-3">
                    <p className="text-xs text-muted-foreground">Origines de la mere</p>
                    <p className="text-sm font-medium text-foreground">{originesMere}</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* SECTION: Apparence */}
          <Section title="Apparence">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {profile.taille && (
                <div className="bg-card rounded-xl border border-border p-3 text-center">
                  <Ruler className="w-4 h-4 mx-auto text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">Taille</p>
                  <p className="text-sm font-semibold text-foreground">{profile.taille} cm</p>
                </div>
              )}
              {profile.silhouette && (
                <div className="bg-card rounded-xl border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Silhouette</p>
                  <p className="text-sm font-semibold text-foreground">{SILHOUETTE_LABELS[profile.silhouette] || profile.silhouette}</p>
                </div>
              )}
              {profile.genre === "homme" && profile.barbe !== null && (
                <div className="bg-card rounded-xl border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Barbe</p>
                  <p className="text-sm font-semibold text-foreground">{profile.barbe ? "Oui" : "Non"}</p>
                </div>
              )}
              {profile.genre === "femme" && profile.hijab && (
                <div className="bg-card rounded-xl border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Hijab</p>
                  <p className="text-sm font-semibold text-foreground">{HIJAB_LABELS[profile.hijab] || profile.hijab}</p>
                </div>
              )}
            </div>
            {/* Style vestimentaire */}
            {profile.style_vestimentaire && profile.style_vestimentaire.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Shirt className="w-3.5 h-3.5" /> Style vestimentaire</p>
                <div className="flex flex-wrap gap-2">
                  {profile.style_vestimentaire.map(s => (
                    <span key={s} className="px-3 py-1.5 bg-secondary text-foreground text-sm rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* SECTION: Personnalite */}
          {profile.traits && profile.traits.length > 0 && (
            <Section title="Personnalite">
              <div className="flex flex-wrap gap-2">
                {profile.traits.map(t => (
                  <span key={t} className="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full font-medium border border-primary/20">
                    {t}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* SECTION: Style d'amour */}
          {profile.style_amour && profile.style_amour.length > 0 && (
            <Section title="En amour">
              <div className="flex flex-wrap gap-2">
                {profile.style_amour.map(s => (
                  <span key={s} className="px-3 py-1.5 bg-pink-100 text-pink-700 text-sm rounded-full flex items-center gap-1">
                    <HeartHandshake className="w-3.5 h-3.5" />{s}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* SECTION: Style de vie */}
          {profile.style_vie && profile.style_vie.length > 0 && (
            <Section title="Style de vie">
              <div className="flex flex-wrap gap-2">
                {profile.style_vie.map(s => (
                  <span key={s} className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-full flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />{s}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* SECTION: Gestion des conflits */}
          {profile.gestion_conflits && profile.gestion_conflits.length > 0 && (
            <Section title="En cas de conflit">
              <div className="flex flex-wrap gap-2">
                {profile.gestion_conflits.map(g => (
                  <span key={g} className="px-3 py-1.5 bg-amber-100 text-amber-700 text-sm rounded-full flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />{g}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* SECTION: Attraits & Repoussants */}
          <div className="grid sm:grid-cols-2 gap-4">
            {profile.attraits && profile.attraits.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-3 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" /> Ce qui m&apos;attire
                </p>
                <ul className="space-y-2">
                  {profile.attraits.map((a, i) => a && (
                    <li key={i} className="flex items-center gap-2 text-sm text-emerald-900">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {profile.repoussants && profile.repoussants.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-3">Ce qui me repousse</p>
                <ul className="space-y-2">
                  {profile.repoussants.map((r, i) => r && (
                    <li key={i} className="flex items-center gap-2 text-sm text-red-900">
                      <span className="w-3.5 h-3.5 text-red-400 shrink-0 font-bold text-base leading-none">x</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action button */}
          {!isMe && (
            <button className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
              Envoyer un Like Halal
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  )
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-3">
      <div className="flex items-center gap-1.5 text-primary mb-1">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
      <p className="text-sm font-semibold text-foreground leading-tight">{value}</p>
    </div>
  )
}
