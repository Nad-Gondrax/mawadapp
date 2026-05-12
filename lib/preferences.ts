import { DEFAULT_FILTERS, type Filters } from "@/components/dashboard/filters-modal"
import { getUserFacingError } from "@/lib/user-facing-errors"

export async function getSavedPreferences() {
  const response = await fetch("/api/preferences")
  if (!response.ok) return { filters: DEFAULT_FILTERS, setupRequired: false }

  return response.json() as Promise<{ filters: Filters; setupRequired?: boolean }>
}

export async function savePreferences(filters: Filters) {
  const response = await fetch("/api/preferences", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filters),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(getUserFacingError(data?.error || response.statusText, "preferences"))
  }

  return response.json() as Promise<{ filters: Filters }>
}
