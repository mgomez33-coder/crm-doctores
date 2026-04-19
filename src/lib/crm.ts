import type { Nota, Actividad, NotaTipo, ActividadTipo } from './supabase'

// ─── Error helpers ───

/**
 * Check if a Supabase error indicates a missing table/relation.
 * Matches common error patterns from PostgreSQL:
 * - "relation \"notas\" does not exist"
 * - 'relation "public.notas" does not exist'
 */
export function isMissingRelationError(
  error: { message?: string; code?: string } | null | undefined,
  tableNames: string[],
): boolean {
  if (!error?.message) return false
  const msg = error.message.toLowerCase()
  return tableNames.some(
    (name) =>
      msg.includes(`relation "${name}" does not exist`) ||
      msg.includes(`relation "public.${name}" does not exist`),
  )
}

// ─── Timeline helpers ───

export type TimelineKind = 'nota' | 'actividad'

export type TimelineItem = {
  id: string
  kind: TimelineKind
  type: string
  description: string
  createdAt: string
  raw: Nota | Actividad
}

/**
 * Merge notas and actividades into a unified timeline, sorted by created_at descending.
 */
export function normalizeTimelineItems(
  notas: Nota[] | null | undefined,
  actividades: Actividad[] | null | undefined,
): TimelineItem[] {
  const items: TimelineItem[] = []

  if (notas) {
    for (const n of notas) {
      items.push({
        id: `nota-${n.id}`,
        kind: 'nota',
        type: n.tipo || 'general',
        description: n.nota,
        createdAt: n.created_at,
        raw: n,
      })
    }
  }

  if (actividades) {
    for (const a of actividades) {
      items.push({
        id: `act-${a.id}`,
        kind: 'actividad',
        type: a.tipo || 'general',
        description: a.descripcion,
        createdAt: a.created_at,
        raw: a,
      })
    }
  }

  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/**
 * Build a human-readable description for a status change activity.
 */
export function buildStatusChangeActivityDescription(
  oldEstado: string | null | undefined,
  newEstado: string | null | undefined,
): string {
  const from = oldEstado || '(sin estado)'
  const to = newEstado || '(sin estado)'
  return `Estado cambiado de ${from} a ${to}`
}
