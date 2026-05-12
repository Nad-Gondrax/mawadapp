import type { UserProfile } from "@/lib/types"

export type DbPublicProfile = {
  id: string
  prenom: string
  age: number
  genre: string
  ville: string
  pays_origine: string
  photo: string | null
  photo_blurred?: boolean | null
  taille: number | null
  silhouette: string | null
  barbe: boolean | null
  hijab: string | null
  style_vestimentaire: string[] | null
  traits: string[] | null
  profession: string | null
  niveau_etudes: string | null
  situation_pro: string | null
  niveau_pratique: string | null
  pratique_priere: string | null
  situation_maritale: string | null
  projet_mariage: string | null
  souhaite_enfants: "oui" | "non" | "sais_pas" | null
  presentation: string | null
  style_amour: string[] | null
  style_vie: string[] | null
  gestion_conflits: string[] | null
  origine_pere_pays1: string | null
  origine_pere_pays2: string | null
  origine_mere_pays1: string | null
  origine_mere_pays2: string | null
  mahram_statut?: string | null
  created_at?: string | null
}

export function mapDbProfile(profile: DbPublicProfile): UserProfile {
  const mahramStatut = profile.genre === "femme"
    ? profile.mahram_statut || "en_attente"
    : "valide"

  return {
    id: profile.id,
    prenom: profile.prenom,
    age: profile.age,
    genre: profile.genre as UserProfile["genre"],
    ville: profile.ville,
    paysOrigine: profile.pays_origine,
    photo: profile.photo || undefined,
    photoBlurred: Boolean(profile.photo_blurred),
    traits: profile.traits || [],
    taille: profile.taille || 0,
    silhouette: (profile.silhouette || "normale") as UserProfile["silhouette"],
    barbe: profile.barbe ?? undefined,
    hijab: profile.hijab || undefined,
    styleVestimentaire: (profile.style_vestimentaire || []) as UserProfile["styleVestimentaire"],
    profession: profile.profession || "",
    niveauEtudes: (profile.niveau_etudes || "autre") as UserProfile["niveauEtudes"],
    niveauPratique: (profile.niveau_pratique || "pratiquant") as UserProfile["niveauPratique"],
    pratiquePriere: profile.pratique_priere || "",
    situationMaritale: (profile.situation_maritale || "jamais_marie") as UserProfile["situationMaritale"],
    avecQui: "",
    projetMariage: (profile.projet_mariage || "pret_maintenant") as UserProfile["projetMariage"],
    souhaitEnfants: profile.souhaite_enfants || "sais_pas",
    origineParentsPere: [profile.origine_pere_pays1, profile.origine_pere_pays2].filter(Boolean).join(" / "),
    origineParentsMere: [profile.origine_mere_pays1, profile.origine_mere_pays2].filter(Boolean).join(" / "),
    relationSexeOppose: "",
    accepteEnfants: "peu_importe",
    accepteDivorce: "peu_importe",
    styleAmour: (profile.style_amour || []) as UserProfile["styleAmour"],
    styleVie: (profile.style_vie || []) as UserProfile["styleVie"],
    economie: "equilibre",
    gestionConflits: (profile.gestion_conflits || []) as UserProfile["gestionConflits"],
    attraits: ["", "", ""],
    repoussants: ["", "", ""],
    presentation: profile.presentation || "",
    mahram: {
      nom: "",
      relation: "Autre",
      email: "",
      telephone: "",
      statut: mahramStatut as NonNullable<UserProfile["mahram"]>["statut"],
    },
    statut: "actif",
    dateInscription: profile.created_at || "",
    likes: [],
    matches: [],
  }
}
