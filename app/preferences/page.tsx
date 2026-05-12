"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Filter, Check, Loader2 } from "lucide-react"
import { PAYS, NIVEAUX_PRATIQUE_LABELS, NIVEAUX_ETUDES_LABELS, PROJET_MARIAGE_LABELS, SITUATION_MARITALE_LABELS } from "@/lib/mock-data"
import { DEFAULT_FILTERS, type Filters } from "@/components/dashboard/filters-modal"
import { getSavedPreferences, savePreferences } from "@/lib/preferences"

type PreferencesForm = {
  ville: string
  ageMin: string
  ageMax: string
  paysOrigine: string
  niveauPratique: string[]
  niveauEtudes: string[]
  projetMariage: string[]
  situationMaritale: string[]
}

const DEFAULT_FORM: PreferencesForm = {
  ville: "",
  ageMin: "18",
  ageMax: "60",
  paysOrigine: "",
  niveauPratique: [],
  niveauEtudes: [],
  projetMariage: [],
  situationMaritale: [],
}

function formToFilters(form: PreferencesForm): Filters {
  return {
    ...DEFAULT_FILTERS,
    ageMin: Number(form.ageMin) || DEFAULT_FILTERS.ageMin,
    ageMax: Number(form.ageMax) || DEFAULT_FILTERS.ageMax,
    paysOrigine: form.paysOrigine || DEFAULT_FILTERS.paysOrigine,
    niveauPratique: form.niveauPratique[0] || DEFAULT_FILTERS.niveauPratique,
    niveauEtude: form.niveauEtudes[0] || DEFAULT_FILTERS.niveauEtude,
    projetMariage: form.projetMariage[0] || DEFAULT_FILTERS.projetMariage,
  }
}

function filtersToForm(filters: Filters): PreferencesForm {
  return {
    ...DEFAULT_FORM,
    ageMin: String(filters.ageMin),
    ageMax: String(filters.ageMax),
    paysOrigine: filters.paysOrigine === "Tous" ? "" : filters.paysOrigine,
    niveauPratique: filters.niveauPratique === "tous" ? [] : [filters.niveauPratique],
    niveauEtudes: filters.niveauEtude === "tous" ? [] : [filters.niveauEtude],
    projetMariage: filters.projetMariage === "tous" ? [] : [filters.projetMariage],
  }
}

export default function PreferencesPage() {
  const router = useRouter()
  const [form, setForm] = useState<PreferencesForm>(DEFAULT_FORM)
  const [applied, setApplied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadPreferences() {
      try {
        const data = await getSavedPreferences()
        if (!cancelled) setForm(filtersToForm(data.filters))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPreferences()

    return () => {
      cancelled = true
    }
  }, [])

  const toggle = (field: "niveauPratique" | "niveauEtudes" | "projetMariage" | "situationMaritale", v: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(v)
        ? prev[field].filter(x => x !== v)
        : [...prev[field], v]
    }))
  }

  const handleApply = async () => {
    setSaving(true)
    setError(null)

    try {
      await savePreferences(formToFilters(form))
      setApplied(true)
      setTimeout(() => { setApplied(false); router.push("/dashboard") }, 800)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Impossible de sauvegarder les préférences.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="font-serif font-bold text-foreground flex-1">Préférences de recherche</h1>
        <Filter className="w-5 h-5 text-primary" />
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement des préférences...
          </div>
        )}

        {/* Ville */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Localisation</h3>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Ville</label>
            <input
              type="text"
              value={form.ville}
              onChange={e => setForm({ ...form, ville: e.target.value })}
              placeholder="Ex: Paris, Lyon..."
              className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Pays d&apos;origine</label>
            <select
              value={form.paysOrigine}
              onChange={e => setForm({ ...form, paysOrigine: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Tous les pays</option>
              {PAYS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Age */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Tranche d&apos;âge</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm text-muted-foreground mb-1.5">Âge minimum</label>
              <input
                type="number" min={18} max={99}
                value={form.ageMin}
                onChange={e => setForm({ ...form, ageMin: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="text-muted-foreground mt-6">—</div>
            <div className="flex-1">
              <label className="block text-sm text-muted-foreground mb-1.5">Âge maximum</label>
              <input
                type="number" min={18} max={99}
                value={form.ageMax}
                onChange={e => setForm({ ...form, ageMax: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="h-2 bg-secondary rounded-full relative">
            <div
              className="absolute h-full bg-primary rounded-full"
              style={{
                left: `${((parseInt(form.ageMin) - 18) / 81) * 100}%`,
                right: `${100 - ((parseInt(form.ageMax) - 18) / 81) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Pratique religieuse */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Pratique religieuse</h3>
          <div className="space-y-2">
            {Object.entries(NIVEAUX_PRATIQUE_LABELS).map(([v, l]) => (
              <CheckOption
                key={v}
                label={l}
                checked={form.niveauPratique.includes(v)}
                onChange={() => toggle("niveauPratique", v)}
              />
            ))}
          </div>
        </div>

        {/* Niveau études */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Niveau d&apos;études</h3>
          <div className="space-y-2">
            {Object.entries(NIVEAUX_ETUDES_LABELS).map(([v, l]) => (
              <CheckOption
                key={v}
                label={l}
                checked={form.niveauEtudes.includes(v)}
                onChange={() => toggle("niveauEtudes", v)}
              />
            ))}
          </div>
        </div>

        {/* Projet mariage */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Projet de mariage</h3>
          <div className="space-y-2">
            {Object.entries(PROJET_MARIAGE_LABELS).map(([v, l]) => (
              <CheckOption
                key={v}
                label={l}
                checked={form.projetMariage.includes(v)}
                onChange={() => toggle("projetMariage", v)}
              />
            ))}
          </div>
        </div>

        {/* Situation familiale */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Situation familiale</h3>
          <div className="space-y-2">
            {Object.entries(SITUATION_MARITALE_LABELS).map(([v, l]) => (
              <CheckOption
                key={v}
                label={l}
                checked={form.situationMaritale.includes(v)}
                onChange={() => toggle("situationMaritale", v)}
              />
            ))}
          </div>
        </div>

        {/* Apply button */}
        <button
          onClick={handleApply}
          disabled={saving}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-lg transition-all shadow-lg ${
            applied
              ? "bg-emerald-600 text-white shadow-emerald-300"
              : "bg-primary text-primary-foreground hover:opacity-90 shadow-primary/20"
          }`}
        >
          {applied ? (
            <><Check className="w-5 h-5" /> Filtres appliqués !</>
          ) : saving ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Sauvegarde...</>
          ) : (
            <><Filter className="w-5 h-5" /> Appliquer les filtres</>
          )}
        </button>
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          onClick={() => setForm(DEFAULT_FORM)}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Réinitialiser les filtres
        </button>
      </div>
    </div>
  )
}

function CheckOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label onClick={onChange} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
      checked ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
    }`}>
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
        checked ? "bg-primary border-primary" : "border-border"
      }`}>
        {checked && <Check className="w-3 h-3 text-primary-foreground" />}
      </div>
      <span className="text-sm text-foreground">{label}</span>
    </label>
  )
}
