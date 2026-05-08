"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Users, Shield, TrendingUp, ChevronLeft,
  Check, X, UserCheck, Ban, BarChart3,
  RefreshCw, ChevronLeft as Prev, ChevronRight as Next,
  AlertTriangle, UserX, Clock, Loader2
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminTab = "stats" | "users" | "mahrams"

interface Stats {
  totalUsers: number
  profilsComplets: number
  hommes: number
  femmes: number
  mahramEnAttente: number
  mahramValide: number
  nouveauxSemaine: number
  nouveauxAujourdhui: number
  inscriptionsParJour: { jour: string; total: number }[]
  repartitionPratique: { niveau: string; total: number }[]
}

interface AdminUser {
  id: string
  prenom: string
  age: number
  genre: string
  ville: string
  niveau_pratique: string
  statut: string
  onboarding_complete: boolean
  mahram_statut: string
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRATIQUE_LABELS: Record<string, string> = {
  debutant: "Débutant",
  pratiquant: "Pratiquant",
  pratiquant_engage: "Engagé",
  hafidh: "Hafidh/a",
}

const PRATIQUE_COLORS = ["#009688", "#006B61", "#2ECC71", "#E7F7F4"]

const STATUT_CONFIG: Record<string, { label: string; cls: string }> = {
  actif:     { label: "Actif",     cls: "bg-emerald-100 text-emerald-700" },
  suspendu:  { label: "Suspendu",  cls: "bg-amber-100 text-amber-700" },
  banni:     { label: "Banni",     cls: "bg-red-100 text-red-700" },
  verifie:   { label: "Vérifié",   cls: "bg-blue-100 text-blue-700" },
}

const MAHRAM_CONFIG: Record<string, { label: string; cls: string }> = {
  en_attente: { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  valide:     { label: "Validé",     cls: "bg-emerald-100 text-emerald-700" },
  refuse:     { label: "Refusé",     cls: "bg-red-100 text-red-700" },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, color
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 flex items-start gap-4 shadow-premium">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-serif font-bold text-foreground leading-tight">
          {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
        </p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-secondary rounded-xl ${className}`} />
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<AdminTab>("stats")
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  // Stats state
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersTotal, setUsersTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const totalPages = Math.ceil(usersTotal / 20)

  // ── Check admin access ──────────────────────────────────────────────────────
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch("/api/admin/check-access")
        if (!res.ok) {
          setAuthorized(false)
          router.push("/dashboard")
          return
        }
        setAuthorized(true)
      } catch (err) {
        setAuthorized(false)
        router.push("/dashboard")
      }
    }
    checkAccess()
  }, [router])

  // ── Fetchers ────────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await fetch("/api/admin/stats")
      if (res.ok) setStats(await res.json())
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async (p: number) => {
    setUsersLoading(true)
    try {
      const res = await fetch(`/api/admin/users?page=${p}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users ?? [])
        setUsersTotal(data.total ?? 0)
      }
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authorized) fetchStats()
  }, [authorized, fetchStats])

  useEffect(() => {
    if (authorized && (tab === "users" || tab === "mahrams")) fetchUsers(page)
  }, [authorized, tab, page, fetchUsers])

  // ── Actions ─────────────────────────────────────────────────────────────────

  const updateStatut = async (id: string, statut: string) => {
    setUpdatingId(id)
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, statut }),
    })
    setUsers(prev => prev.map(u => u.id === id ? { ...u, statut } : u))
    setUpdatingId(null)
  }

  // ── Tabs config ─────────────────────────────────────────────────────────────

  const TABS = [
    { id: "stats",   label: "Statistiques", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "users",   label: "Utilisateurs", icon: <Users className="w-4 h-4" /> },
    { id: "mahrams", label: "Mahrams",       icon: <Shield className="w-4 h-4" /> },
  ]

  // ── Render ──────────────────────────────────────────────────────────────────

  // Si pas encore vérifiée ou pas autorisée, on affiche un loader
  if (authorized === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard")}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 gradient-mawada rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="font-serif font-bold text-foreground">Administration</span>
        </div>
        <button
          onClick={fetchStats}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
          title="Actualiser"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${statsLoading ? "animate-spin" : ""}`} />
        </button>
        <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">Admin</span>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Tab nav */}
        <div className="flex gap-1 bg-secondary p-1 rounded-2xl">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id as AdminTab); setPage(1) }}
              className={`flex items-center gap-2 flex-1 justify-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === t.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── STATS TAB ─────────────────────────────────────────────────────── */}
        {tab === "stats" && (
          <div className="space-y-6">

            {/* KPI grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {statsLoading ? (
                Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)
              ) : stats ? (
                <>
                  <StatCard
                    icon={<Users className="w-5 h-5 text-blue-600" />}
                    label="Inscrits total"
                    value={stats.totalUsers}
                    color="bg-blue-50"
                  />
                  <StatCard
                    icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                    label="Nouveaux aujourd'hui"
                    value={stats.nouveauxAujourdhui}
                    sub={`+${stats.nouveauxSemaine} cette semaine`}
                    color="bg-emerald-50"
                  />
                  <StatCard
                    icon={<UserCheck className="w-5 h-5 text-primary" />}
                    label="Profils complets"
                    value={stats.profilsComplets}
                    sub={stats.totalUsers > 0 ? `${Math.round((stats.profilsComplets / stats.totalUsers) * 100)}%` : "—"}
                    color="bg-secondary"
                  />
                  <StatCard
                    icon={<Shield className="w-5 h-5 text-amber-600" />}
                    label="Mahrams en attente"
                    value={stats.mahramEnAttente}
                    sub={`${stats.mahramValide} validés`}
                    color="bg-amber-50"
                  />
                  <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4 shadow-premium col-span-2 md:col-span-2">
                    <div className="flex gap-4 flex-1">
                      <div className="flex-1 text-center">
                        <p className="text-xl font-serif font-bold text-foreground">{stats.hommes.toLocaleString("fr-FR")}</p>
                        <p className="text-xs text-muted-foreground">Hommes</p>
                      </div>
                      <div className="w-px bg-border" />
                      <div className="flex-1 text-center">
                        <p className="text-xl font-serif font-bold text-foreground">{stats.femmes.toLocaleString("fr-FR")}</p>
                        <p className="text-xs text-muted-foreground">Femmes</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="col-span-4 text-sm text-muted-foreground text-center py-8">Impossible de charger les stats.</p>
              )}
            </div>

            {/* Inscriptions par jour */}
            {!statsLoading && stats && (
              <div className="bg-card rounded-2xl border border-border p-5 shadow-premium">
                <h3 className="font-semibold text-foreground mb-5 flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Inscriptions — 7 derniers jours
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={stats.inscriptionsParJour} barSize={28}>
                    <XAxis dataKey="jour" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 13 }}
                      cursor={{ fill: "var(--secondary)" }}
                    />
                    <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} name="Inscrits" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Répartition niveaux pratique */}
            {!statsLoading && stats && stats.repartitionPratique.some(r => r.total > 0) && (
              <div className="bg-card rounded-2xl border border-border p-5 shadow-premium">
                <h3 className="font-semibold text-foreground mb-5 text-sm">
                  Niveaux de pratique
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={stats.repartitionPratique.map(r => ({
                        name: PRATIQUE_LABELS[r.niveau] ?? r.niveau,
                        value: r.total,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {stats.repartitionPratique.map((_, i) => (
                        <Cell key={i} fill={PRATIQUE_COLORS[i % PRATIQUE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 13 }}
                    />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

          </div>
        )}

        {/* ── USERS TAB ─────────────────────────────────────────────────────── */}
        {tab === "users" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{usersTotal.toLocaleString("fr-FR")} utilisateurs</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary disabled:opacity-30 transition-colors"
                >
                  <Prev className="w-4 h-4" />
                </button>
                <span className="text-xs text-muted-foreground">{page} / {totalPages || 1}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary disabled:opacity-30 transition-colors"
                >
                  <Next className="w-4 h-4" />
                </button>
              </div>
            </div>

            {usersLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)
            ) : users.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucun utilisateur pour l&apos;instant.</p>
              </div>
            ) : (
              users.map(user => (
                <div key={user.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 shadow-premium">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {user.prenom?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground text-sm">
                        {user.prenom ?? "Sans prénom"}{user.age ? `, ${user.age} ans` : ""}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_CONFIG[user.statut]?.cls ?? "bg-secondary text-muted-foreground"}`}>
                        {STATUT_CONFIG[user.statut]?.label ?? user.statut}
                      </span>
                      {!user.onboarding_complete && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          Incomplet
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[user.ville, PRATIQUE_LABELS[user.niveau_pratique]].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Inscrit le {new Date(user.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => updateStatut(user.id, "verifie")}
                      disabled={updatingId === user.id || user.statut === "verifie"}
                      title="Vérifier"
                      className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-100 transition-colors disabled:opacity-30"
                    >
                      <UserCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateStatut(user.id, user.statut === "suspendu" ? "actif" : "suspendu")}
                      disabled={updatingId === user.id}
                      title={user.statut === "suspendu" ? "Réactiver" : "Suspendre"}
                      className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center hover:bg-amber-100 transition-colors disabled:opacity-30"
                    >
                      {user.statut === "suspendu" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => updateStatut(user.id, "banni")}
                      disabled={updatingId === user.id || user.statut === "banni"}
                      title="Bannir"
                      className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors disabled:opacity-30"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── MAHRAMS TAB ───────────────────────────────────────────────────── */}
        {tab === "mahrams" && (
          <div className="space-y-4">

            {/* KPIs mahrams */}
            <div className="grid grid-cols-3 gap-3">
              {statsLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)
              ) : stats ? (
                <>
                  <div className="bg-card rounded-2xl border border-border p-4 text-center shadow-premium">
                    <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                    <p className="text-2xl font-serif font-bold text-amber-600">{stats.mahramEnAttente}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">En attente</p>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-4 text-center shadow-premium">
                    <Check className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                    <p className="text-2xl font-serif font-bold text-emerald-600">{stats.mahramValide}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Validés</p>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-4 text-center shadow-premium">
                    <UserX className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-2xl font-serif font-bold text-foreground">
                      {stats.totalUsers - stats.mahramEnAttente - stats.mahramValide}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Sans mahram</p>
                  </div>
                </>
              ) : null}
            </div>

            {/* Liste profils avec mahram en attente */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-premium">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Mahrams en attente de validation</h3>
              </div>
              {usersLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {users.filter(u => u.mahram_statut === "en_attente").length === 0 ? (
                    <div className="p-8 text-center">
                      <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Aucun mahram en attente.</p>
                    </div>
                  ) : (
                    users.filter(u => u.mahram_statut === "en_attente").map(user => (
                      <div key={user.id} className="flex items-center gap-4 px-5 py-4">
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-muted-foreground">
                            {user.prenom?.[0]?.toUpperCase() ?? "?"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{user.prenom ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            Inscrit le {new Date(user.created_at).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${MAHRAM_CONFIG[user.mahram_statut]?.cls ?? "bg-secondary text-muted-foreground"}`}>
                          {MAHRAM_CONFIG[user.mahram_statut]?.label ?? user.mahram_statut}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
