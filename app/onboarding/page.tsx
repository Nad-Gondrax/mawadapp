"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Upload, Check, Mail, AlertCircle, Loader2 } from "lucide-react"
import { ALL_TRAITS, VILLES_FRANCE } from "@/lib/mock-data"
import { createClient } from "@/lib/supabase/client"
import { getUserFacingError } from "@/lib/user-facing-errors"

const TOTAL_STEPS = 14

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-foreground">Étape {step} sur {TOTAL_STEPS}</span>
        <span className="text-sm text-muted-foreground">{Math.round((step / TOTAL_STEPS) * 100)}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
              i + 1 < step ? "bg-primary text-primary-foreground" :
              i + 1 === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
              "bg-secondary text-muted-foreground"
            }`}
          >
            {i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
        ))}
      </div>
    </div>
  )
}

const MAHRAM_TYPES = [
  { value: "pere", label: "Père" },
  { value: "frere", label: "Frère" },
  { value: "oncle", label: "Oncle" },
  { value: "tuteur", label: "Tuteur" },
  { value: "autre", label: "Autre" },
]

const ORIGINES_PARENTS = [
  "Algérie", "Maroc", "Tunisie", "Sénégal", "Mali",
  "Turquie", "Liban", "Pakistan", "Bangladesh", "Indonésie",
  "Bosnie", "Kosovo", "France", "Autre",
]

function originToForm(value: string | null | undefined) {
  if (!value) return { value: "", autre: "" }
  if (ORIGINES_PARENTS.includes(value)) return { value, autre: "" }
  return { value: "Autre", autre: value }
}

function OrigineSelect({
  data,
  onChange,
  label,
  valueKey,
  autreKey,
  placeholder,
}: {
  data: any
  onChange: (d: any) => void
  label: string
  valueKey: string
  autreKey: string
  placeholder: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      <select
        value={data[valueKey] || ""}
        onChange={e => onChange({ ...data, [valueKey]: e.target.value, ...(e.target.value !== "Autre" ? { [autreKey]: "" } : {}) })}
        className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">{placeholder}</option>
        {ORIGINES_PARENTS.map(pays => (
          <option key={pays} value={pays}>{pays}</option>
        ))}
      </select>
      {data[valueKey] === "Autre" && (
        <input
          type="text"
          placeholder="Préciser le pays"
          value={data[autreKey] || ""}
          onChange={e => onChange({ ...data, [autreKey]: e.target.value })}
          className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      )}
    </div>
  )
}

// --- Step 1 (avec validation mahram pour femmes) ---
function Step1({ data, onChange, mahramValidated, onMahramValidate }: { 
  data: any; 
  onChange: (d: any) => void;
  mahramValidated: boolean;
  onMahramValidate: () => void;
}) {
  const [currentUserEmail, setCurrentUserEmail] = useState("")
  const [villeQuery, setVilleQuery] = useState(data.ville || "")
  const [villeOpen, setVilleOpen] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [codeDigits, setCodeDigits] = useState(["", "", "", ""])
  const [codeError, setCodeError] = useState<string | null>(null)
  const [codeToken, setCodeToken] = useState<string | null>(null)
  const [codeSending, setCodeSending] = useState(false)
  const [codeVerifying, setCodeVerifying] = useState(false)
  const codeRefs = useRef<(HTMLInputElement | null)[]>([])
  const filtered = VILLES_FRANCE.filter(v => v.toLowerCase().includes(villeQuery.toLowerCase()))
  const normalizeEmail = (value: string) => value.trim().toLowerCase()
  const mahramEmailSameAsUser = Boolean(
    currentUserEmail &&
    data.mahramEmail &&
    normalizeEmail(currentUserEmail) === normalizeEmail(data.mahramEmail),
  )

  useEffect(() => {
    let cancelled = false

    createClient().auth.getUser().then(({ data: userData }) => {
      if (!cancelled) setCurrentUserEmail(userData.user?.email || "")
    })

    return () => {
      cancelled = true
    }
  }, [])

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...codeDigits]
    newDigits[index] = value.slice(-1)
    setCodeDigits(newDigits)
    setCodeError(null)
    // Auto-focus next input
    if (value && index < 3) {
      codeRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      codeRefs.current[index - 1]?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4)
    const newDigits = [...codeDigits]
    for (let i = 0; i < paste.length; i++) {
      newDigits[i] = paste[i]
    }
    setCodeDigits(newDigits)
    if (paste.length === 4) {
      codeRefs.current[3]?.focus()
    }
  }

  const resetCode = () => {
    setCodeSent(false)
    setCodeToken(null)
    setCodeDigits(["", "", "", ""])
    setCodeError(null)
  }

  const handleSendCode = async () => {
    if (!data.mahramEmail || !data.mahramType) return
    if (mahramEmailSameAsUser) {
      setCodeError("L'email du Mahram doit être différent de votre email de connexion.")
      return
    }

    setCodeSending(true)
    setCodeError(null)

    try {
      const response = await fetch("/api/mahram/onboarding-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.mahramEmail,
          relation: data.mahramType,
        }),
      })
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || "Envoi impossible")

      setCodeToken(result.token)
      setCodeSent(true)
      setCodeDigits(["", "", "", ""])
      window.setTimeout(() => codeRefs.current[0]?.focus(), 50)
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : "Impossible d'envoyer le code au Mahram.")
    } finally {
      setCodeSending(false)
    }
  }

  const handleVerifyCode = async () => {
    const enteredCode = codeDigits.join("")
    if (!codeToken || enteredCode.length !== 4) return

    setCodeVerifying(true)
    setCodeError(null)

    try {
      const response = await fetch("/api/mahram/onboarding-code", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: codeToken,
          code: enteredCode,
        }),
      })
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || "Code incorrect")

      onMahramValidate()
      setCodeError(null)
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : "Code incorrect, veuillez réessayer.")
    } finally {
      setCodeVerifying(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Vous êtes *</label>
        <div className="grid grid-cols-2 gap-3">
          {["homme", "femme"].map(g => (
            <button
              key={g}
              type="button"
              onClick={() => {
                resetCode()
                onChange({ ...data, genre: g, mahramEmail: "", mahramType: "" })
              }}
              className={`py-3 rounded-xl border-2 font-semibold capitalize transition-all ${
                data.genre === g ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {g === "homme" ? "Homme" : "Femme"}
            </button>
          ))}
        </div>
      </div>

      {/* Mahram section for women */}
      {data.genre === "femme" && (
        <div className="space-y-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
          <div className="flex items-center gap-2 text-primary">
            <Mail className="w-4 h-4" />
            <span className="text-sm font-semibold">Validation par votre Mahram</span>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Type de Mahram *</label>
            <div className="flex flex-wrap gap-2">
              {MAHRAM_TYPES.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => {
                    resetCode()
                    onChange({ ...data, mahramType: m.value })
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    data.mahramType === m.value ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email du Mahram *</label>
            <input
              type="email"
              name="mahram-email"
              autoComplete="off"
              value={data.mahramEmail || ""}
              onChange={e => {
                resetCode()
                onChange({ ...data, mahramEmail: e.target.value })
              }}
              placeholder="mahram@email.com"
              disabled={mahramValidated}
              className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            {mahramEmailSameAsUser && (
              <p className="mt-2 text-xs text-destructive">
                L&apos;email du Mahram doit être différent de votre email de connexion.
              </p>
            )}
          </div>

          {!codeSent && !mahramValidated && (
            <button
              type="button"
              onClick={handleSendCode}
              disabled={!data.mahramEmail || !data.mahramType || mahramEmailSameAsUser || codeSending}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {codeSending ? "Envoi du code..." : "Envoyer le code au Mahram"}
            </button>
          )}

          {codeSent && !mahramValidated && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Un code à 4 chiffres a été envoyé à <strong>{data.mahramEmail}</strong>. 
                Demandez-lui de vous communiquer ce code.
              </p>
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-3" onPaste={handleCodePaste}>
                  {codeDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => { codeRefs.current[index] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleCodeChange(index, e.target.value)}
                      onKeyDown={e => handleCodeKeyDown(index, e)}
                      disabled={codeVerifying}
                      className={`w-14 h-14 border-2 rounded-xl text-center font-mono text-2xl font-bold bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                        codeError ? "border-destructive" : digit ? "border-primary" : "border-border"
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={codeDigits.some(d => !d) || codeVerifying}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {codeVerifying ? "Validation..." : "Valider le code"}
                </button>
              </div>
              {codeError && (
                <div className="flex items-center justify-center gap-2 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{codeError}</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleSendCode}
                disabled={codeSending}
                className="mx-auto block text-xs font-semibold text-primary hover:underline disabled:opacity-50"
              >
                {codeSending ? "Renvoi en cours..." : "Renvoyer un nouveau code"}
              </button>
            </div>
          )}

          {mahramValidated && (
            <div className="flex items-center gap-2 text-primary bg-primary/10 p-3 rounded-xl">
              <Check className="w-5 h-5" />
              <span className="text-sm font-semibold">Mahram validé avec succès !</span>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Âge *</label>
        <input
          type="number" min={18} max={99}
          value={data.age || ""}
          onChange={e => onChange({ ...data, age: e.target.value })}
          placeholder="Votre âge (18-99 ans)"
          className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Prénom ou pseudo *</label>
        <input
          type="text"
          value={data.prenom || ""}
          onChange={e => onChange({ ...data, prenom: e.target.value })}
          placeholder="Votre prénom ou pseudo"
          className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-foreground mb-2">Ville *</label>
        <input
          type="text"
          value={villeQuery}
          onChange={e => { setVilleQuery(e.target.value); onChange({ ...data, ville: e.target.value }); setVilleOpen(true) }}
          onFocus={() => setVilleOpen(true)}
          placeholder="Rechercher une ville..."
          className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {villeOpen && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-xl shadow-lg z-10 max-h-48 overflow-auto">
            {filtered.slice(0, 8).map(v => (
              <button
                key={v} type="button"
                onClick={() => { setVilleQuery(v); onChange({ ...data, ville: v }); setVilleOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Nationalité française *</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "France", label: "Oui" },
            { value: "Non française", label: "Non" },
          ].map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ ...data, paysOrigine: option.value })}
              className={`py-3 rounded-xl border-2 font-semibold transition-all ${
                data.paysOrigine === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Step 2 (style vestimentaire : 2 choix max) ---
function Step2({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const traits: string[] = data.traits || []
  const styles: string[] = data.stylesVestimentaires || []

  const toggleTrait = (t: string) => {
    if (traits.includes(t)) onChange({ ...data, traits: traits.filter(x => x !== t) })
    else if (traits.length < 8) onChange({ ...data, traits: [...traits, t] })
  }

  const toggleStyle = (s: string) => {
    if (styles.includes(s)) {
      onChange({ ...data, stylesVestimentaires: styles.filter(x => x !== s) })
    } else if (styles.length < 2) {
      onChange({ ...data, stylesVestimentaires: [...styles, s] })
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Ce qui vous rend attirant(e) *</label>
        <p className="text-xs text-muted-foreground mb-3">3 choix minimum, 8 maximum ({traits.length}/8)</p>
        <div className="flex flex-wrap gap-2">
          {ALL_TRAITS.map(t => (
            <button
              key={t} type="button"
              onClick={() => toggleTrait(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                traits.includes(t) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"
              } ${!traits.includes(t) && traits.length >= 8 ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Style vestimentaire *</label>
        <p className="text-xs text-muted-foreground mb-3">1 choix minimum, 2 maximum ({styles.length}/2)</p>
        <div className="flex flex-wrap gap-2">
          {["Chic", "Casual", "Affaires", "Sportswear", "Qamis/Abaya"].map(s => (
            <button
              key={s} type="button"
              onClick={() => toggleStyle(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                styles.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"
              } ${!styles.includes(s) && styles.length >= 2 ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Step 3 (Profession: Avec/Sans/Étudiant + Diplômes mis à jour) ---
function Step3({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Situation professionnelle *</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: "avec", l: "Avec emploi" },
            { v: "sans", l: "Sans emploi" },
            { v: "etudiant", l: "Étudiant(e)" },
          ].map(({ v, l }) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ ...data, situationPro: v })}
              className={`py-3 px-2 rounded-xl text-sm border-2 font-medium transition-all ${
                data.situationPro === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {data.situationPro === "avec" && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Votre métier</label>
          <input
            type="text"
            value={data.profession || ""}
            onChange={e => onChange({ ...data, profession: e.target.value })}
            placeholder="Ex: Ingénieur, Médecin, Commerçant..."
            className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Niveau d&apos;études</label>
        <div className="space-y-2">
          {[
            { v: "sans_diplome", l: "Sans diplôme" },
            { v: "bep", l: "BEP" },
            { v: "cap", l: "CAP" },
            { v: "bac", l: "Baccalauréat" },
            { v: "bts", l: "BTS" },
            { v: "licence", l: "Licence" },
            { v: "master", l: "Master" },
            { v: "doctorat", l: "Doctorat" },
            { v: "autre", l: "Autre" },
          ].map(({ v, l }) => (
            <label key={v} className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-secondary transition-colors">
              <input
                type="radio" name="etudes" value={v}
                checked={data.niveauEtudes === v}
                onChange={() => onChange({ ...data, niveauEtudes: v, autreEtudes: v === "autre" ? data.autreEtudes : "" })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-foreground">{l}</span>
            </label>
          ))}
        </div>
        {data.niveauEtudes === "autre" && (
          <input
            type="text"
            value={data.autreEtudes || ""}
            onChange={e => onChange({ ...data, autreEtudes: e.target.value })}
            placeholder="Précisez votre niveau d'études..."
            className="w-full mt-3 px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        )}
      </div>
    </div>
  )
}

// --- Step 4 (texte corrigé) ---
function Step4({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Niveau de pratique *</label>
        <div className="space-y-2">
          {[
            { v: "tres_pratiquant", l: "Très pratiquant(e)", desc: "Je pratique pleinement l'islam au quotidien" },
            { v: "pratiquant", l: "Pratiquant(e)", desc: "Je pratique régulièrement" },
            { v: "occasions", l: "Pour les occasions", desc: "Vendredi, Ramadan, fêtes..." },
            { v: "guid_allah", l: "Je demande à Allah de me guider", desc: "En chemin vers une pratique plus solide" },
          ].map(({ v, l, desc }) => (
            <label key={v} className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${data.niveauPratique === v ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
              <input
                type="radio" name="pratique" value={v}
                checked={data.niveauPratique === v}
                onChange={() => onChange({ ...data, niveauPratique: v })}
                className="w-4 h-4 accent-primary mt-0.5"
              />
              <div>
                <span className="text-sm font-medium text-foreground block">{l}</span>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Pratique de la prière</label>
        <div className="space-y-2">
          {["Tous les jours, 5 prières", "Je prie parfois", "J'aimerais m'y mettre"].map(p => (
            <label key={p} className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-secondary transition-colors">
              <input
                type="radio" name="priere"
                checked={data.pratiquePriere === p}
                onChange={() => onChange({ ...data, pratiquePriere: p })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-foreground">{p}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Step 5 (avec "J'ai des enfants") ---
function Step5({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Situation maritale</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: "jamais_marie", l: "Jamais marié(e)" },
            { v: "divorce", l: "Divorcé(e)" },
            { v: "separe", l: "Séparé(e)" },
            { v: "veuf", l: "Veuf / Veuve" },
          ].map(({ v, l }) => (
            <button
              key={v} type="button"
              onClick={() => onChange({ ...data, situationMaritale: v })}
              className={`py-3 px-4 rounded-xl text-sm border-2 font-medium transition-all ${data.situationMaritale === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* J'ai des enfants */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">J&apos;ai des enfants *</label>
        <div className="flex gap-3">
          {[{ v: "oui", l: "Oui" }, { v: "non", l: "Non" }].map(({ v, l }) => (
            <button
              key={v} type="button"
              onClick={() => onChange({ ...data, aDesEnfants: v, nombreEnfants: v === "non" ? "" : data.nombreEnfants })}
              className={`flex-1 py-3 rounded-xl text-sm border-2 font-medium transition-all ${data.aDesEnfants === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
            >
              {l}
            </button>
          ))}
        </div>
        {data.aDesEnfants === "oui" && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-foreground mb-2">Combien d&apos;enfants ?</label>
            <input
              type="number" min={1} max={20}
              value={data.nombreEnfants || ""}
              onChange={e => onChange({ ...data, nombreEnfants: e.target.value })}
              placeholder="Nombre d'enfants"
              className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Vous vivez...</label>
        <div className="grid grid-cols-2 gap-2">
          {["Seul(e)", "En colocation", "Avec ma famille", "Avec mes enfants"].map(v => (
            <button
              key={v} type="button"
              onClick={() => onChange({ ...data, avecQui: v })}
              className={`py-3 px-4 rounded-xl text-sm border-2 font-medium transition-all ${data.avecQui === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Projet de mariage</label>
        <div className="space-y-2">
          {[
            { v: "pret_maintenant", l: "Je suis prêt(e) maintenant" },
            { v: "1_3_ans", l: "Entre 1 et 3 ans" },
            { v: "plus_3_ans", l: "Plus de 3 ans" },
            { v: "pas_pret", l: "Je ne suis pas prêt(e)" },
          ].map(({ v, l }) => (
            <label key={v} className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-secondary transition-colors">
              <input
                type="radio" name="projetMariage"
                checked={data.projetMariage === v}
                onChange={() => onChange({ ...data, projetMariage: v })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-foreground">{l}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Souhaitez-vous avoir des enfants ?</label>
        <div className="flex gap-3">
          {[{ v: "oui", l: "Oui" }, { v: "non", l: "Non" }, { v: "sais_pas", l: "Je ne sais pas" }].map(({ v, l }) => (
            <button
              key={v} type="button"
              onClick={() => onChange({ ...data, souhaitEnfants: v })}
              className={`flex-1 py-3 rounded-xl text-sm border-2 font-medium transition-all ${data.souhaitEnfants === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Step 6 ---
function Step6({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const attraits = data.attraits || ["", "", ""]
  const repoussants = data.repoussants || ["", "", ""]

  const updateAttr = (idx: number, val: string) => {
    const arr = [...attraits]; arr[idx] = val; onChange({ ...data, attraits: arr })
  }
  const updateRepou = (idx: number, val: string) => {
    const arr = [...repoussants]; arr[idx] = val; onChange({ ...data, repoussants: arr })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-foreground">3 choses qui m&apos;attirent *</label>
        <p className="text-xs text-muted-foreground">2 réponses minimum obligatoires</p>
        {attraits.map((val: string, i: number) => (
          <input
            key={i} type="text" value={val}
            onChange={e => updateAttr(i, e.target.value)}
            placeholder={`Attraction ${i + 1}${i < 2 ? " *" : " (optionnel)"}`}
            className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        ))}
      </div>
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-foreground">3 choses qui me repoussent *</label>
        <p className="text-xs text-muted-foreground">2 réponses minimum obligatoires</p>
        {repoussants.map((val: string, i: number) => (
          <input
            key={i} type="text" value={val}
            onChange={e => updateRepou(i, e.target.value)}
            placeholder={`Repoussant ${i + 1}${i < 2 ? " *" : " (optionnel)"}`}
            className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        ))}
      </div>
    </div>
  )
}

// --- Step 7 (présentation obligatoire) ---
function Step7({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const charCount = (data.presentation || "").length
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("Format non supporté. Utilisez JPEG, PNG ou WebP.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("La photo ne doit pas dépasser 5 MB.")
      return
    }

    setUploadError(null)
    setUploading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Non connecté")

      const ext = file.name.split(".").pop()
      const filePath = `${user.id}/avatar.${ext}`

      const { error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)

      onChange({ ...data, photo: urlData.publicUrl })
    } catch (error) {
      setUploadError(getUserFacingError(error, "photoUpload"))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">Photo de profil (optionnel)</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
        >
          {data.photo ? (
            <div className="space-y-3">
              <img
                src={data.photo}
                alt="Photo de profil"
                className={`w-24 h-24 rounded-full object-cover mx-auto transition-all ${data.photoBlurred ? "blur-sm scale-105" : ""}`}
              />
              <p className="text-sm text-primary font-medium">Photo chargée - cliquer pour changer</p>
            </div>
          ) : (
            <>
              {uploading ? (
                <Loader2 className="w-10 h-10 text-primary mx-auto mb-3 animate-spin" />
              ) : (
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              )}
              <p className="text-sm font-medium text-foreground">
                {uploading ? "Upload en cours..." : "Glisser-déposer ou cliquer pour uploader"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">JPEG, PNG ou WebP, taille max 5 MB</p>
              <button
                type="button"
                className="mt-4 px-5 py-2 bg-secondary text-foreground rounded-xl text-sm font-medium hover:bg-border transition-colors"
              >
                Choisir une photo
              </button>
            </>
          )}
        </div>
        {uploadError && <p className="text-xs text-destructive mt-2">{uploadError}</p>}
        {data.photo && (
          <div className="mt-4 rounded-2xl border border-border bg-[#F8FFFC] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Flouter ma photo</p>
                <p className="text-xs text-muted-foreground">
                  Vous pourrez accepter ou refuser les demandes de défloutage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange({ ...data, photoBlurred: !data.photoBlurred })}
                aria-pressed={Boolean(data.photoBlurred)}
                className={`relative h-8 w-14 rounded-full transition-colors ${
                  data.photoBlurred ? "bg-primary" : "bg-border"
                }`}
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    data.photoBlurred ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-semibold text-foreground">
            Présentez-vous <span className="text-destructive">*</span>
          </label>
          <span className={`text-xs ${charCount > 280 ? "text-destructive" : "text-muted-foreground"}`}>
            {charCount}/300
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Quelques mots sur qui vous êtes, vos aspirations, ce que vous attendez du mariage.
        </p>
        <textarea
          value={data.presentation || ""}
          onChange={e => { if (e.target.value.length <= 300) onChange({ ...data, presentation: e.target.value }) }}
          rows={5}
          placeholder="Ex : Je suis quelqu'un de calme et sérieux, attaché à mes valeurs. Je souhaite construire un foyer basé sur la confiance, le respect et la dîn..."
          className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <p className={`text-xs mt-1 ${charCount < 50 ? "text-destructive" : "text-muted-foreground"}`}>
          50 caractères minimum obligatoires * ({charCount < 50 ? `encore ${50 - charCount} caractères` : "OK"})
        </p>
      </div>
    </div>
  )
}

function Step8({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const ORIGINES_PARENTS = [
    "Algérie", "Maroc", "Tunisie", "Sénégal", "Mali",
    "Turquie", "Liban", "Pakistan", "Bangladesh", "Indonésie",
    "Bosnie", "Kosovo", "France", "Autre"
  ]

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">Votre taille (cm) <span className="text-destructive">*</span></label>
        <input
          type="number"
          min="140"
          max="220"
          value={data.taille || ""}
          onChange={e => onChange({ ...data, taille: Number(e.target.value) })}
          placeholder="180"
          className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-3">Silhouette <span className="text-destructive">*</span></label>
        <div className="flex flex-wrap gap-2">
          {["mince", "musclé", "normale", "ronde"].map(s => (
            <button
              key={s}
              onClick={() => onChange({ ...data, silhouette: s })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                data.silhouette === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary border border-border text-foreground hover:border-primary"
              }`}
            >
              {s === "mince" ? "Mince" : s === "musclé" ? "Musclé(e)" : s === "normale" ? "Normale" : "Ronde"}
            </button>
          ))}
        </div>
      </div>

      {data.genre === "homme" && (
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Avez-vous une barbe ? <span className="text-destructive">*</span></label>
          <div className="flex gap-3">
            {[
              { value: true, label: "Oui" },
              { value: false, label: "Non" },
            ].map(opt => (
              <button
                key={String(opt.value)}
                onClick={() => onChange({ ...data, barbe: opt.value })}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  data.barbe === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary border border-border text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {data.genre === "femme" && (
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">Comment portez-vous le hijab ? <span className="text-destructive">*</span></label>
          <div className="flex flex-wrap gap-2">
            {["Voilée", "Non voilée"].map(h => (
              <button
                key={h}
                onClick={() => onChange({ ...data, hijab: h })}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  data.hijab === h
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary border border-border text-foreground"
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Step9({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  return (
    <div className="space-y-7">
      {/* Père */}
      <div className="bg-secondary/50 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">Père <span className="text-destructive">*</span></p>
        <OrigineSelect
          data={data}
          onChange={onChange}
          label="Origine 1"
          valueKey="originePerePays1"
          autreKey="originePerePays1Autre"
          placeholder="Sélectionner l'origine"
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="pere2"
            checked={data.pereDeux || false}
            onChange={e => {
              onChange({ ...data, pereDeux: e.target.checked, ...(!e.target.checked ? { originePerePays2: "", originePerePays2Autre: "" } : {}) })
            }}
            className="w-4 h-4 accent-primary cursor-pointer"
          />
          <label htmlFor="pere2" className="text-xs text-muted-foreground cursor-pointer">
            Ajouter une 2ème origine
          </label>
        </div>
        {data.pereDeux && (
          <OrigineSelect
            data={data}
            onChange={onChange}
            label="Origine 2"
            valueKey="originePerePays2"
            autreKey="originePerePays2Autre"
            placeholder="Sélectionner la 2ème origine"
          />
        )}
      </div>

      {/* Mère */}
      <div className="bg-secondary/50 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">Mère <span className="text-destructive">*</span></p>
        <OrigineSelect
          data={data}
          onChange={onChange}
          label="Origine 1"
          valueKey="origineMarePays1"
          autreKey="origineMarePays1Autre"
          placeholder="Sélectionner l'origine"
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="mere2"
            checked={data.mereDeux || false}
            onChange={e => {
              onChange({ ...data, mereDeux: e.target.checked, ...(!e.target.checked ? { origineMarePays2: "", origineMarePays2Autre: "" } : {}) })
            }}
            className="w-4 h-4 accent-primary cursor-pointer"
          />
          <label htmlFor="mere2" className="text-xs text-muted-foreground cursor-pointer">
            Ajouter une 2ème origine
          </label>
        </div>
        {data.mereDeux && (
          <OrigineSelect
            data={data}
            onChange={onChange}
            label="Origine 2"
            valueKey="origineMarePays2"
            autreKey="origineMarePays2Autre"
            placeholder="Sélectionner la 2ème origine"
          />
        )}
      </div>
    </div>
  )
}

function Step10({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const options = [
    { value: "aucune", label: "Aucune relation avec le sexe opposé", desc: "Je n'ai pas d'ami(es) de l'autre sexe" },
    { value: "quelques_amis", label: "Quelques ami(es)", desc: "Des relations amicales sans plus" },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Votre relation actuelle avec le sexe opposé (hors famille)</p>
      <div className="space-y-3">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange({ ...data, relationSexeOppose: opt.value })}
            className={`w-full text-left px-4 py-4 rounded-2xl border-2 transition-all ${
              data.relationSexeOppose === opt.value
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <p className={`text-sm font-semibold ${data.relationSexeOppose === opt.value ? "text-primary" : "text-foreground"}`}>
              {opt.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function Step11({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const OPTIONS_ENFANTS = [
    { value: "oui", label: "Oui" },
    { value: "non", label: "Non" },
    { value: "peu_importe", label: "Peu importe" },
  ]
  const OPTIONS_DIVORCE = [
    { value: "oui", label: "Oui" },
    { value: "non", label: "Non" },
    { value: "peu_importe", label: "Peu importe" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1">
          Acceptez-vous quelqu&apos;un qui a déjà des enfants ? <span className="text-destructive">*</span>
        </label>
        <p className="text-xs text-muted-foreground mb-3">De sa relation précédente</p>
        <div className="flex gap-3">
          {OPTIONS_ENFANTS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...data, accepteEnfants: opt.value })}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                data.accepteEnfants === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary border border-border text-foreground hover:border-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-1">
          Acceptez-vous quelqu&apos;un qui est divorcé(e) ? <span className="text-destructive">*</span>
        </label>
        <p className="text-xs text-muted-foreground mb-3">Peu importe les raisons</p>
        <div className="flex gap-3">
          {OPTIONS_DIVORCE.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...data, accepteDivorce: opt.value })}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                data.accepteDivorce === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary border border-border text-foreground hover:border-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step12({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const OPTIONS = [
    "Romantique",
    "Attentionné·e",
    "Indépendant·e",
    "Fusionnel·le",
    "Doux·ce",
    "Passionné·e",
    "Protecteur·rice",
    "Solitaire",
    "Besoin de temps pour faire confiance",
  ]

  const selected: string[] = Array.isArray(data.styleAmour) ? data.styleAmour : []

  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange({ ...data, styleAmour: selected.filter(s => s !== opt) })
    } else if (selected.length < 4) {
      onChange({ ...data, styleAmour: [...selected, opt] })
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        <strong>2 choix minimum obligatoires *</strong> (4 maximum)
      </p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map(opt => {
          const isSelected = selected.includes(opt)
          const isDisabled = !isSelected && selected.length >= 4
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:border-primary/50"
              } ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {opt}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground text-right">
        {selected.length} / 4 sélectionné{selected.length > 1 ? "s" : ""}
      </p>
    </div>
  )
}

function Step13({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const OPTIONS = [
    "Plutôt casanier·ère",
    "Plutôt sorties",
    "Sportif·ve",
    "Fêtard·e",
    "Travailleur·se",
    "Voyageur·se",
    "Famille importante",
    "Ami·es important·es",
    "Vie simple",
    "Toujours en mouvement",
    "J'aime les imprévus",
    "J'aime organiser à l'avance",
  ]

  const selected: string[] = Array.isArray(data.styleVie) ? data.styleVie : []

  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange({ ...data, styleVie: selected.filter(s => s !== opt) })
    } else if (selected.length < 4) {
      onChange({ ...data, styleVie: [...selected, opt] })
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        <strong>2 choix minimum obligatoires *</strong> (4 maximum)
      </p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map(opt => {
          const isSelected = selected.includes(opt)
          const isDisabled = !isSelected && selected.length >= 4
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:border-primary/50"
              } ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {opt}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground text-right">
        {selected.length} / 4 sélectionné{selected.length > 1 ? "s" : ""}
      </p>
    </div>
  )
}

function Step14({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const OPTIONS = [
    "Je préfère discuter calmement",
    "J'ai besoin de temps pour me calmer",
    "Je préfère m'isoler avant de reparler",
    "Je peux me fermer sur le moment",
    "J'ai du mal à exprimer ce que je ressens",
    "Je peux être rancunier·ère",
    "Je peux hausser le ton",
    "Je prends parfois les choses trop à cœur",
    "Je préfère éviter le conflit",
    "Je garde parfois les choses pour moi",
    "J'ai du mal à reconnaître mes torts",
    "J'ai besoin qu'on vienne vers moi",
    "Je reviens discuter une fois calmé·e",
    "Je cherche un compromis",
    "Je peux m'excuser quand je comprends que j'ai blessé",
    "Je veux préserver le respect même en conflit",
  ]

  const selected: string[] = Array.isArray(data.gestionConflits) ? data.gestionConflits : []

  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange({ ...data, gestionConflits: selected.filter(s => s !== opt) })
    } else if (selected.length < 4) {
      onChange({ ...data, gestionConflits: [...selected, opt] })
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Quand il y a un désaccord, je suis plutôt... <strong>2 choix minimum obligatoires *</strong> (4 maximum)
      </p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map(opt => {
          const isSelected = selected.includes(opt)
          const isDisabled = !isSelected && selected.length >= 4
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:border-primary/50"
              } ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {opt}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground text-right">
        {selected.length} / 4 sélectionné{selected.length > 1 ? "s" : ""}
      </p>
    </div>
  )
}

const STEP_TITLES = [
  "Informations de base",       // 1
  "Apparence et style",         // 2
  "Éducation et profession",    // 3
  "Pratique religieuse",        // 4
  "Famille et projet zawaj",    // 5
  "Préférences personnelles",   // 6
  "Apparence physique",         // 7 (ancien 8)
  "Origine des parents",        // 8 (ancien 9)
  "Relations sociales",         // 9 (ancien 10)
  "Ouverture d'esprit",         // 10 (ancien 11)
  "En amour, je suis...",       // 11 (ancien 12)
  "Mon style de vie",           // 12 (ancien 13)
  "Gestion des conflits",       // 13 (ancien 14)
  "Photo et présentation",      // 14 (ancien 7)
]

const STEP_SUBTITLES = [
  "Partagez quelques informations essentielles",
  "Dites-nous ce qui vous rend unique",
  "Votre parcours académique et professionnel",
  "Votre relation avec l'islam",
  "Votre situation et vos projets",
  "Ce qui vous attire et ce que vous cherchez",
  "Votre apparence physique",
  "D'où viennent vos parents",
  "Votre relation avec le sexe opposé",
  "Ce que vous acceptez chez l'autre",
  "Votre style amoureux",
  "Votre mode de vie au quotidien",
  "Comment vous gérez les désaccords",
  "La touche finale de votre profil",
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<any>({})
  const [mahramValidated, setMahramValidated] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    async function loadExistingProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

      if (!profile || cancelled) return

      const originePere1 = originToForm(profile.origine_pere_pays1)
      const originePere2 = originToForm(profile.origine_pere_pays2)
      const origineMere1 = originToForm(profile.origine_mere_pays1)
      const origineMere2 = originToForm(profile.origine_mere_pays2)

      setData({
        prenom: profile.prenom || "",
        age: profile.age || "",
        genre: profile.genre || "",
        ville: profile.ville || "",
        paysOrigine: profile.pays_origine === "France" ? "France" : profile.pays_origine ? "Non française" : "",
        photo: profile.photo || "",
        photoBlurred: Boolean(profile.photo_blurred),
        traits: profile.traits || [],
        stylesVestimentaires: profile.style_vestimentaire || [],
        situationPro: profile.situation_pro || "",
        profession: profile.profession || "",
        niveauEtudes: profile.niveau_etudes || "",
        autreEtudes: profile.niveau_etudes_autre || "",
        niveauPratique: profile.niveau_pratique || "",
        pratiquePriere: profile.pratique_priere || "",
        situationMaritale: profile.situation_maritale || "",
        aDesEnfants: profile.nombre_enfants && profile.nombre_enfants > 0 ? "oui" : "non",
        nombreEnfants: profile.nombre_enfants ? String(profile.nombre_enfants) : "",
        avecQui: profile.avec_qui || "",
        projetMariage: profile.projet_mariage || "",
        souhaitEnfants: profile.souhaite_enfants || "",
        attraits: profile.attraits || ["", "", ""],
        repoussants: profile.repoussants || ["", "", ""],
        taille: profile.taille || "",
        silhouette: profile.silhouette || "",
        barbe: profile.barbe ?? undefined,
        hijab: profile.hijab || "",
        pereDeux: Boolean(profile.origine_pere_pays2),
        originePerePays1: originePere1.value,
        originePerePays1Autre: originePere1.autre,
        originePerePays2: originePere2.value,
        originePerePays2Autre: originePere2.autre,
        mereDeux: Boolean(profile.origine_mere_pays2),
        origineMarePays1: origineMere1.value,
        origineMarePays1Autre: origineMere1.autre,
        origineMarePays2: origineMere2.value,
        origineMarePays2Autre: origineMere2.autre,
        relationSexeOppose: profile.relation_sexe_oppose || "",
        accepteEnfants: profile.accepte_enfants || "",
        accepteDivorce: profile.accepte_divorce || "",
        styleAmour: profile.style_amour || [],
        styleVie: profile.style_vie || [],
        gestionConflits: profile.gestion_conflits || [],
        presentation: profile.presentation || "",
        mahramNom: profile.mahram_nom || "",
        mahramRelation: profile.mahram_relation || "",
        mahramEmail: profile.mahram_email || "",
        mahramTelephone: profile.mahram_telephone || "",
      })

      if (profile.genre === "femme") {
        setMahramValidated(true)
      }
    }

    loadExistingProfile()

    return () => {
      cancelled = true
    }
  }, [])

  const canNext = () => {
    // Etape 1 : Infos de base + Mahram pour femmes
    if (step === 1) {
      const baseValid = data.genre && data.age && Number(data.age) >= 18 && data.prenom && data.ville && data.paysOrigine
      if (data.genre === "femme") {
        return baseValid && mahramValidated
      }
      return baseValid
    }
    // Etape 2 : Traits (min 3) + Style vestimentaire (min 1)
    if (step === 2) {
      return Array.isArray(data.traits) && data.traits.length >= 3 &&
             Array.isArray(data.stylesVestimentaires) && data.stylesVestimentaires.length >= 1
    }
    // Etape 3 : Situation pro + Niveau etudes + Profession (si emploi)
    if (step === 3) {
      const hasSituationPro = !!data.situationPro
      const hasNiveauEtudes = !!data.niveauEtudes
      // Profession obligatoire seulement si "avec emploi"
      const hasProfession = data.situationPro === "avec" ? !!data.profession : true
      return hasSituationPro && hasNiveauEtudes && hasProfession
    }
    // Etape 4 : Niveau pratique + Pratique priere
    if (step === 4) {
      return data.niveauPratique && data.pratiquePriere
    }
    // Etape 5 : Situation maritale + Projet mariage + Souhaite enfants
    if (step === 5) {
      return data.situationMaritale && data.projetMariage && data.souhaitEnfants
    }
    // Etape 6 : Attraits (min 2 non vides) + Repoussants (min 2 non vides)
    if (step === 6) {
      const attraitsRemplis = Array.isArray(data.attraits) ? data.attraits.filter((a: string) => a && a.trim().length > 0) : []
      const repoussantsRemplis = Array.isArray(data.repoussants) ? data.repoussants.filter((r: string) => r && r.trim().length > 0) : []
      return attraitsRemplis.length >= 2 && repoussantsRemplis.length >= 2
    }
    // Etape 7 : Taille + Silhouette + Barbe/Hijab (ancien 8)
    if (step === 7) {
      return data.taille && data.silhouette && (data.genre === "homme" ? data.barbe !== undefined : data.hijab)
    }
    // Etape 8 : Origines parents (ancien 9)
    if (step === 8) {
      return data.originePerePays1 && data.origineMarePays1
    }
    // Etape 9 : Relation sexe oppose (ancien 10)
    if (step === 9) {
      return data.relationSexeOppose
    }
    // Etape 10 : Accepte enfants + divorce (ancien 11)
    if (step === 10) {
      return data.accepteEnfants && data.accepteDivorce
    }
    // Etape 11 : Style amour (min 2) (ancien 12)
    if (step === 11) {
      return Array.isArray(data.styleAmour) && data.styleAmour.length >= 2
    }
    // Etape 12 : Style vie (min 2) (ancien 13)
    if (step === 12) {
      return Array.isArray(data.styleVie) && data.styleVie.length >= 2
    }
    // Etape 13 : Gestion conflits (min 2) (ancien 14)
    if (step === 13) {
      return Array.isArray(data.gestionConflits) && data.gestionConflits.length >= 2
    }
    // Etape 14 : Photo et presentation (ancien 7)
    if (step === 14) {
      return data.presentation && data.presentation.trim().length >= 50
    }
    return true
  }

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1)
      return
    }

    // Dernière étape — sauvegarder dans Supabase
    setSaving(true)
    setSaveError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setSaveError(getUserFacingError(new Error("Non authentifié"), "profileSave"))
      setSaving(false)
      return
    }

    const resolveAutre = (value?: string, autreValue?: string) => {
      if (value === "Autre") return autreValue?.trim() || value
      return value || null
    }

    const profile = {
      id: user.id,
      prenom: data.prenom,
      age: Number(data.age),
      genre: data.genre,
      ville: data.ville,
      pays_origine: data.paysOrigine,
      photo: data.photo || null,
      photo_blurred: Boolean(data.photoBlurred),
      taille: data.taille ? Number(data.taille) : null,
      silhouette: data.silhouette || null,
      barbe: data.genre === "homme" ? data.barbe : null,
      hijab: data.genre === "femme" ? data.hijab : null,
      style_vestimentaire: data.stylesVestimentaires || [],
      traits: data.traits || [],
      profession: data.profession || null,
      niveau_etudes: data.niveauEtudes || null,
      niveau_etudes_autre: data.autreEtudes || null,
      situation_pro: data.situationPro || null,
      niveau_pratique: data.niveauPratique || null,
      pratique_priere: data.pratiquePriere || null,
      situation_maritale: data.situationMaritale || null,
      avec_qui: data.avecQui || null,
      projet_mariage: data.projetMariage || null,
      souhaite_enfants: data.souhaitEnfants || null,
      nombre_enfants: data.nombreEnfants ? Number(data.nombreEnfants) : null,
      origine_pere_pays1: resolveAutre(data.originePerePays1, data.originePerePays1Autre),
      origine_pere_pays2: resolveAutre(data.originePerePays2, data.originePerePays2Autre),
      origine_mere_pays1: resolveAutre(data.origineMarePays1, data.origineMarePays1Autre),
      origine_mere_pays2: resolveAutre(data.origineMarePays2, data.origineMarePays2Autre),
      relation_sexe_oppose: data.relationSexeOppose || null,
      accepte_enfants: data.accepteEnfants || null,
      accepte_divorce: data.accepteDivorce || null,
      style_amour: data.styleAmour || [],
      style_vie: data.styleVie || [],
      gestion_conflits: data.gestionConflits || [],
      attraits: data.attraits || [],
      repoussants: data.repoussants || [],
      presentation: data.presentation || null,
      mahram_nom: data.mahramNom || null,
      mahram_relation: data.mahramRelation || data.mahramType || null,
      mahram_email: data.mahramEmail || null,
      mahram_telephone: data.mahramTelephone || null,
      onboarding_complete: true,
    }

    const { error } = await supabase
      .from("profiles")
      .upsert(profile, { onConflict: "id" })

    if (error) {
      setSaveError(getUserFacingError(error, "profileSave"))
      setSaving(false)
      return
    }

    router.push("/abonnement")
  }

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1 data={data} onChange={setData} mahramValidated={mahramValidated} onMahramValidate={() => setMahramValidated(true)} />
      case 2: return <Step2 data={data} onChange={setData} />
      case 3: return <Step3 data={data} onChange={setData} />
      case 4: return <Step4 data={data} onChange={setData} />
      case 5: return <Step5 data={data} onChange={setData} />
      case 6: return <Step6 data={data} onChange={setData} />
      case 7: return <Step8 data={data} onChange={setData} />
      case 8: return <Step9 data={data} onChange={setData} />
      case 9: return <Step10 data={data} onChange={setData} />
      case 10: return <Step11 data={data} onChange={setData} />
      case 11: return <Step12 data={data} onChange={setData} />
      case 12: return <Step13 data={data} onChange={setData} />
      case 13: return <Step14 data={data} onChange={setData} />
      case 14: return <Step7 data={data} onChange={setData} />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Image src="/logo-mawada.png" alt="Mawada" width={32} height={32} className="rounded-lg" />
          <span className="font-serif font-bold text-foreground">Mawada</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <ProgressBar step={step} />
        </div>

        {/* Step title */}
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-foreground">{STEP_TITLES[step - 1]}</h1>
          <p className="text-muted-foreground mt-1">{STEP_SUBTITLES[step - 1]}</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : router.push("/")}
            className="flex items-center gap-2 px-5 py-3 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? "Retour" : "Précédent"}
          </button>
          <button
            onClick={handleNext}
            disabled={!canNext() || saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary/20"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {step === TOTAL_STEPS ? "Finaliser mon profil" : "Suivant"}
                {step < TOTAL_STEPS && <ChevronRight className="w-4 h-4" />}
                {step === TOTAL_STEPS && <Check className="w-4 h-4" />}
              </>
            )}
          </button>
        </div>
        {saveError && (
          <p className="text-center text-sm text-red-500 mt-2">{saveError}</p>
        )}
      </div>
    </div>
  )
}
