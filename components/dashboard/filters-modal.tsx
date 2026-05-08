"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronDown, RotateCcw, Sliders } from "lucide-react"

const DEPARTEMENTS = [
  "Tous",
  "75 - Paris",
  "77 - Seine-et-Marne",
  "78 - Yvelines",
  "91 - Essonne",
  "92 - Hauts-de-Seine",
  "93 - Seine-Saint-Denis",
  "94 - Val-de-Marne",
  "95 - Val-d'Oise",
  "13 - Bouches-du-Rhône",
  "69 - Rhône",
  "31 - Haute-Garonne",
  "33 - Gironde",
  "59 - Nord",
  "67 - Bas-Rhin",
  "44 - Loire-Atlantique",
  "34 - Hérault",
  "06 - Alpes-Maritimes",
  "83 - Var",
  "57 - Moselle",
]

const NIVEAUX_ETUDE = [
  { value: "tous", label: "Tous les niveaux" },
  { value: "bep", label: "BEP" },
  { value: "cap", label: "CAP" },
  { value: "bac", label: "Baccalauréat" },
  { value: "bts", label: "BTS / DUT" },
  { value: "licence", label: "Licence (Bac+3)" },
  { value: "master", label: "Master (Bac+5)" },
  { value: "doctorat", label: "Doctorat" },
  { value: "autre", label: "Autre" },
]

const NIVEAUX_PRATIQUE = [
  { value: "tous", label: "Tous les niveaux" },
  { value: "tres_pratiquant", label: "Très pratiquant(e)" },
  { value: "pratiquant", label: "Pratiquant(e)" },
  { value: "en_progression", label: "En progression" },
  { value: "debutant", label: "Je demande à Allah de me guider" },
]

const PAYS_ORIGINE = [
  "Tous",
  "Maroc",
  "Algérie",
  "Tunisie",
  "France",
  "Sénégal",
  "Mali",
  "Côte d'Ivoire",
  "Turquie",
  "Egypte",
  "Pakistan",
  "Comores",
  "Autre",
]

export interface Filters {
  ageMin: number
  ageMax: number
  departement: string
  niveauEtude: string
  niveauPratique: string
  paysOrigine: string
  avecEnfants: string
  projetMariage: string
  mahramValide: boolean
}

const DEFAULT_FILTERS: Filters = {
  ageMin: 18,
  ageMax: 60,
  departement: "Tous",
  niveauEtude: "tous",
  niveauPratique: "tous",
  paysOrigine: "Tous",
  avecEnfants: "tous",
  projetMariage: "tous",
  mahramValide: false,
}

interface FiltersModalProps {
  isOpen: boolean
  onClose: () => void
  filters: Filters
  onApply: (filters: Filters) => void
}

export function FiltersModal({ isOpen, onClose, filters, onApply }: FiltersModalProps) {
  const [localFilters, setLocalFilters] = useState<Filters>(filters)
  const [openSection, setOpenSection] = useState<string | null>("age")

  const handleReset = () => {
    setLocalFilters(DEFAULT_FILTERS)
  }

  const handleApply = () => {
    onApply(localFilters)
    onClose()
  }

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#102A2A]/40 backdrop-blur-sm" 
            onClick={onClose} 
          />
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <button 
                onClick={handleReset} 
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Réinitialiser
              </button>
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-primary" />
                <h2 className="font-serif font-bold text-xl text-foreground">Recherche</h2>
              </div>
              <button 
                onClick={onClose} 
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#E7F7F4] hover:bg-[#D0E8E4] transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {/* Age */}
              <div className="bg-[#F8FFFC] border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleSection("age")}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#E7F7F4] transition-colors"
                >
                  <span className="font-semibold text-foreground">Âge</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-primary font-medium">{localFilters.ageMin} - {localFilters.ageMax} ans</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openSection === "age" ? "rotate-180" : ""}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {openSection === "age" && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 space-y-4">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground mb-1.5 block">Minimum</label>
                            <input
                              type="number"
                              min={18}
                              max={localFilters.ageMax}
                              value={localFilters.ageMin}
                              onChange={e => setLocalFilters(f => ({ ...f, ageMin: Math.max(18, parseInt(e.target.value) || 18) }))}
                              className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground mb-1.5 block">Maximum</label>
                            <input
                              type="number"
                              min={localFilters.ageMin}
                              max={80}
                              value={localFilters.ageMax}
                              onChange={e => setLocalFilters(f => ({ ...f, ageMax: Math.min(80, parseInt(e.target.value) || 80) }))}
                              className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Département */}
              <div className="bg-[#F8FFFC] border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleSection("departement")}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#E7F7F4] transition-colors"
                >
                  <span className="font-semibold text-foreground">Département</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-primary font-medium">{localFilters.departement}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openSection === "departement" ? "rotate-180" : ""}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {openSection === "departement" && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 max-h-48 overflow-y-auto space-y-1 scrollbar-hide">
                        {DEPARTEMENTS.map(d => (
                          <button
                            key={d}
                            onClick={() => setLocalFilters(f => ({ ...f, departement: d }))}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${
                              localFilters.departement === d
                                ? "bg-primary text-white font-medium"
                                : "hover:bg-[#E7F7F4] text-foreground"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Niveau d'étude */}
              <div className="bg-[#F8FFFC] border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleSection("etude")}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#E7F7F4] transition-colors"
                >
                  <span className="font-semibold text-foreground">Niveau d&apos;étude</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-primary font-medium truncate max-w-[120px]">
                      {NIVEAUX_ETUDE.find(n => n.value === localFilters.niveauEtude)?.label || "Tous"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openSection === "etude" ? "rotate-180" : ""}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {openSection === "etude" && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 space-y-1">
                        {NIVEAUX_ETUDE.map(n => (
                          <button
                            key={n.value}
                            onClick={() => setLocalFilters(f => ({ ...f, niveauEtude: n.value }))}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${
                              localFilters.niveauEtude === n.value
                                ? "bg-primary text-white font-medium"
                                : "hover:bg-[#E7F7F4] text-foreground"
                            }`}
                          >
                            {n.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Niveau de pratique */}
              <div className="bg-[#F8FFFC] border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleSection("pratique")}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#E7F7F4] transition-colors"
                >
                  <span className="font-semibold text-foreground">Niveau de pratique</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-primary font-medium truncate max-w-[100px]">
                      {NIVEAUX_PRATIQUE.find(n => n.value === localFilters.niveauPratique)?.label || "Tous"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openSection === "pratique" ? "rotate-180" : ""}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {openSection === "pratique" && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 space-y-1">
                        {NIVEAUX_PRATIQUE.map(n => (
                          <button
                            key={n.value}
                            onClick={() => setLocalFilters(f => ({ ...f, niveauPratique: n.value }))}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${
                              localFilters.niveauPratique === n.value
                                ? "bg-primary text-white font-medium"
                                : "hover:bg-[#E7F7F4] text-foreground"
                            }`}
                          >
                            {n.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Pays d'origine */}
              <div className="bg-[#F8FFFC] border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleSection("pays")}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#E7F7F4] transition-colors"
                >
                  <span className="font-semibold text-foreground">Pays d&apos;origine</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-primary font-medium">{localFilters.paysOrigine}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openSection === "pays" ? "rotate-180" : ""}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {openSection === "pays" && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 max-h-48 overflow-y-auto space-y-1 scrollbar-hide">
                        {PAYS_ORIGINE.map(p => (
                          <button
                            key={p}
                            onClick={() => setLocalFilters(f => ({ ...f, paysOrigine: p }))}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${
                              localFilters.paysOrigine === p
                                ? "bg-primary text-white font-medium"
                                : "hover:bg-[#E7F7F4] text-foreground"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Enfants */}
              <div className="bg-[#F8FFFC] border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleSection("enfants")}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#E7F7F4] transition-colors"
                >
                  <span className="font-semibold text-foreground">A des enfants</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-primary font-medium">
                      {localFilters.avecEnfants === "tous" ? "Peu importe" : localFilters.avecEnfants === "oui" ? "Oui" : "Non"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openSection === "enfants" ? "rotate-180" : ""}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {openSection === "enfants" && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 flex gap-2">
                        {[
                          { value: "tous", label: "Peu importe" },
                          { value: "oui", label: "Oui" },
                          { value: "non", label: "Non" },
                        ].map(o => (
                          <motion.button
                            key={o.value}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setLocalFilters(f => ({ ...f, avecEnfants: o.value }))}
                            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                              localFilters.avecEnfants === o.value
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "bg-white border border-border hover:border-primary/30 text-foreground"
                            }`}
                          >
                            {o.label}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Projet mariage */}
              <div className="bg-[#F8FFFC] border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleSection("projet")}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#E7F7F4] transition-colors"
                >
                  <span className="font-semibold text-foreground">Projet de mariage</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-primary font-medium truncate max-w-[100px]">
                      {localFilters.projetMariage === "tous" ? "Tous" : localFilters.projetMariage}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openSection === "projet" ? "rotate-180" : ""}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {openSection === "projet" && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 space-y-1">
                        {[
                          { value: "tous", label: "Tous les projets" },
                          { value: "immediat", label: "Prêt(e) immédiatement" },
                          { value: "6mois", label: "Dans les 6 mois" },
                          { value: "1an", label: "Dans l'année" },
                          { value: "ouvert", label: "Ouvert(e) aux propositions" },
                        ].map(o => (
                          <button
                            key={o.value}
                            onClick={() => setLocalFilters(f => ({ ...f, projetMariage: o.value }))}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${
                              localFilters.projetMariage === o.value
                                ? "bg-primary text-white font-medium"
                                : "hover:bg-[#E7F7F4] text-foreground"
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mahram validé */}
              <div className="bg-[#F8FFFC] border border-border rounded-2xl p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-semibold text-foreground">Mahram validé uniquement</span>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setLocalFilters(f => ({ ...f, mahramValide: !f.mahramValide }))}
                    className={`w-14 h-7 rounded-full transition-colors relative ${
                      localFilters.mahramValide ? "bg-[#2ECC71]" : "bg-[#D0E8E4]"
                    }`}
                  >
                    <motion.span
                      layout
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm ${
                        localFilters.mahramValide ? "right-1" : "left-1"
                      }`}
                    />
                  </motion.button>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-border bg-white">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleApply}
                className="w-full py-4 gradient-mawada text-white rounded-2xl font-semibold shadow-lg shadow-primary/25"
              >
                Appliquer les filtres
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export { DEFAULT_FILTERS }
