type ErrorContext =
  | "signup"
  | "login"
  | "passwordReset"
  | "photoUpload"
  | "photoDelete"
  | "profileSave"
  | "like"
  | "match"
  | "chatLoad"
  | "chatSend"
  | "preferences"

const FALLBACK_MESSAGES: Record<ErrorContext, string> = {
  signup: "L'inscription n'a pas pu aboutir. Vérifiez vos informations puis réessayez.",
  login: "Connexion impossible. Vérifiez votre email et votre mot de passe.",
  passwordReset: "Impossible d'envoyer l'email de réinitialisation. Vérifiez l'adresse indiquée.",
  photoUpload: "La photo n'a pas pu être envoyée. Réessayez avec une autre image.",
  photoDelete: "La photo n'a pas pu être supprimée. Réessayez dans un instant.",
  profileSave: "Votre profil n'a pas pu être sauvegardé. Vérifiez les champs puis réessayez.",
  like: "Le like n'a pas pu être envoyé. Vérifiez votre connexion puis réessayez.",
  match: "Le match est créé, mais la demande Mahram n'a pas pu partir. Réessayez depuis vos matchs.",
  chatLoad: "Cette conversation n'a pas pu être chargée. Rechargez la page dans un instant.",
  chatSend: "Votre message n'a pas pu être envoyé. Vérifiez votre connexion puis réessayez.",
  preferences: "Vos préférences n'ont pas pu être sauvegardées. Réessayez dans un instant.",
}

function getRawMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message || "")
  }
  return ""
}

export function getUserFacingError(error: unknown, context: ErrorContext) {
  const raw = getRawMessage(error)
  const message = raw.toLowerCase()

  if (message.includes("fetch failed") || message.includes("network") || message.includes("failed to fetch")) {
    return "Connexion au serveur impossible. Vérifiez internet puis réessayez."
  }

  if (message.includes("active_match_lock_self")) {
    return "Vous avez déjà un match en cours. Terminez ce match avant d'en créer un autre."
  }

  if (message.includes("active_match_lock_target")) {
    return "Ce profil est déjà en match. Il pourra recevoir une nouvelle demande quand son match sera terminé."
  }

  if (message.includes("active_match_lock")) {
    return "Un match actif existe déjà. Un seul échange est possible à la fois."
  }

  if (context === "preferences" && (message.includes("user_preferences") || message.includes("05_user_preferences"))) {
    return "Les préférences ne sont pas encore installées dans Supabase. Lancez le script 05_user_preferences.sql."
  }

  if (message.includes("non authent") || message.includes("jwt") || message.includes("session")) {
    return "Votre session a expiré. Déconnectez-vous puis reconnectez-vous."
  }

  if (message.includes("invalid login credentials")) {
    return "Email ou mot de passe incorrect."
  }

  if (message.includes("email not confirmed")) {
    return "Veuillez confirmer votre email avant de vous connecter."
  }

  if (
    (message.includes("provider") || message.includes("oauth")) &&
    (message.includes("enabled") || message.includes("unsupported") || message.includes("not found") || message.includes("invalid"))
  ) {
    return "Cette connexion n'est pas encore configurée côté Supabase. Activez le fournisseur dans l'authentification."
  }

  if (message.includes("user already registered") || message.includes("already registered")) {
    return "Cet email est déjà utilisé. Essayez de vous connecter."
  }

  if (message.includes("password should be at least")) {
    return "Le mot de passe doit contenir au moins 6 caractères."
  }

  if (message.includes("invalid email")) {
    return "Adresse email invalide."
  }

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "Action non autorisée avec ce compte. Reconnectez-vous puis réessayez."
  }

  if (message.includes("duplicate") || message.includes("unique")) {
    if (context === "like") return "Vous avez déjà liké ce profil."
    return "Cette action existe déjà."
  }

  if (message.includes("bucket") || message.includes("avatars")) {
    return "L'espace de stockage des photos n'est pas encore prêt. Vérifiez le bucket Supabase avatars."
  }

  if (message.includes("size") || message.includes("too large") || message.includes("payload")) {
    return "Cette image est trop lourde. Choisissez une photo de moins de 5 MB."
  }

  if (message.includes("check constraint") || message.includes("invalid input")) {
    return "Une valeur choisie n'est pas acceptée. Vérifiez le formulaire puis réessayez."
  }

  if (message.includes("mahram")) {
    return FALLBACK_MESSAGES.match
  }

  return FALLBACK_MESSAGES[context]
}
