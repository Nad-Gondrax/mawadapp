export type Genre = "homme" | "femme"

export type NiveauPratique =
  | "tres_pratiquant"
  | "pratiquant"
  | "occasions"
  | "guid_allah"

export type NiveauEtudes =
  | "sans_diplome"
  | "bac"
  | "bep"
  | "cap"
  | "bts"
  | "licence"
  | "master"
  | "doctorat"
  | "autre"

export type SituationMaritale =
  | "jamais_marie"
  | "divorce"
  | "separe"
  | "veuf"

export type ProjetMariage =
  | "pret_maintenant"
  | "1_3_ans"
  | "plus_3_ans"
  | "pas_pret"

export type StatutMahram = "en_attente" | "valide" | "refuse" | "non_invite"

export type Silhouette = "mince" | "musclé" | "normale" | "ronde"

export type StyleAmour =
  | "romantique"
  | "attentionne"
  | "independant"
  | "fusionnel"
  | "doux"
  | "passionne"
  | "protecteur"
  | "solitaire"
  | "confiance"

export type StyleVie =
  | "casanier"
  | "sorties"
  | "sportif"
  | "fetard"
  | "travailleur"
  | "voyageur"
  | "famille_importante"
  | "amis_importants"
  | "vie_simple"
  | "toujours_mouvement"
  | "aime_imprévus"
  | "aime_organiser"

export type GestionConflits =
  | "discuter_calmement"
  | "besoin_temps"
  | "m_isoler"
  | "fermer_moment"
  | "mal_exprimer"
  | "rancunier"
  | "hausser_ton"
  | "prendre_coeur"
  | "eviter_conflit"
  | "garder_pour_moi"
  | "mal_reconnaître_torts"
  | "besoin_qu_on_vienne"
  | "revenir_discuter"
  | "chercher_compromis"
  | "m_excuser"
  | "preserver_respect"

export type StyleVestimentaire =
  | "Chic"
  | "Casual"
  | "Affaires"
  | "Sportswear"
  | "Qamis/Abaya"

export interface Mahram {
  nom: string
  relation: "Père" | "Frère" | "Oncle" | "Tuteur" | "Autre"
  email: string
  telephone: string
  statut: StatutMahram
}

export interface UserProfile {
  id: string
  prenom: string
  age: number
  genre: Genre
  ville: string
  paysOrigine: string
  photo?: string
  photoBlurred?: boolean
  traits: string[]
  taille: number
  silhouette: Silhouette
  barbe?: boolean // hommes uniquement
  hijab?: string // femmes uniquement
  styleVestimentaire: StyleVestimentaire[]
  profession: string
  niveauEtudes: NiveauEtudes
  niveauEtudesAutre?: string
  niveauPratique: NiveauPratique
  pratiquePriere: string
  situationMaritale: SituationMaritale
  avecQui: string
  projetMariage: ProjetMariage
  souhaitEnfants: "oui" | "non" | "sais_pas"
  nombreEnfants?: number
  origineParentsPere?: string
  origineParentsMere?: string
  relationSexeOppose: string
  accepteEnfants: "oui" | "non" | "peu_importe"
  accepteDivorce: "oui" | "non" | "peu_importe"
  styleAmour: StyleAmour[]
  styleVie: StyleVie[]
  economie: "econome" | "genereux" | "equilibre"
  gestionConflits: GestionConflits[]
  attraits: [string, string, string]
  repoussants: [string, string, string]
  presentation: string
  mahram?: Mahram
  statut: "actif" | "suspendu" | "verifie"
  dateInscription: string
  likes: string[]
  matches: string[]
}

export interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  bloque?: boolean
}

export interface Conversation {
  id: string
  user1Id: string
  user2Id: string
  mahramId?: string
  mahramApprouve: boolean
  messages: Message[]
}
