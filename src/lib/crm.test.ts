import { describe, it, expect } from 'vitest'
import {
  isMissingRelationError,
  normalizeTimelineItems,
  buildStatusChangeActivityDescription,
  type TimelineItem,
} from './crm'
import type { Nota, Actividad } from './supabase'

// ─── isMissingRelationError ───

describe('isMissingRelationError', () => {
  it('matches relation does not exist error', () => {
    const error = { message: 'relation "notas" does not exist' }
    expect(isMissingRelationError(error, ['notas'])).toBe(true)
  })

  it('matches public schema qualified error', () => {
    const error = { message: 'relation "public.actividades" does not exist' }
    expect(isMissingRelationError(error, ['actividades'])).toBe(true)
  })

  it('does not match unrelated error', () => {
    const error = { message: 'column "foo" does not exist' }
    expect(isMissingRelationError(error, ['notas'])).toBe(false)
  })

  it('handles null error', () => {
    expect(isMissingRelationError(null, ['notas'])).toBe(false)
  })

  it('handles undefined message', () => {
    expect(isMissingRelationError({}, ['notas'])).toBe(false)
  })
})

// ─── normalizeTimelineItems ───

describe('normalizeTimelineItems', () => {
  const notas: Nota[] = [
    { id: 1, doctor_id: 1, nota: 'Primera nota', tipo: 'general' as any, created_at: '2026-04-19T10:00:00Z' },
    { id: 2, doctor_id: 1, nota: 'Segunda nota', tipo: 'seguimiento' as any, created_at: '2026-04-19T12:00:00Z' },
  ]

  const actividades: Actividad[] = [
    { id: 10, doctor_id: 1, tipo: 'cambio_estado' as any, descripcion: 'Estado cambiado', metadata: {}, created_at: '2026-04-19T11:00:00Z' },
  ]

  it('merges notas and actividades sorted by date descending', () => {
    const result = normalizeTimelineItems(notas, actividades)
    expect(result).toHaveLength(3)
    expect(result[0].kind).toBe('nota') // 12:00
    expect(result[1].kind).toBe('actividad') // 11:00
    expect(result[2].kind).toBe('nota') // 10:00
  })

  it('handles null notas', () => {
    const result = normalizeTimelineItems(null, actividades)
    expect(result).toHaveLength(1)
    expect(result[0].kind).toBe('actividad')
  })

  it('handles null actividades', () => {
    const result = normalizeTimelineItems(notas, null)
    expect(result).toHaveLength(2)
  })

  it('handles both null', () => {
    expect(normalizeTimelineItems(null, null)).toEqual([])
  })
})

// ─── buildStatusChangeActivityDescription ───

describe('buildStatusChangeActivityDescription', () => {
  it('builds description with both states', () => {
    expect(buildStatusChangeActivityDescription('Pendiente', 'Contactado'))
      .toBe('Estado cambiado de Pendiente a Contactado')
  })

  it('handles null old state', () => {
    expect(buildStatusChangeActivityDescription(null, 'Activo'))
      .toBe('Estado cambiado de (sin estado) a Activo')
  })

  it('handles null new state', () => {
    expect(buildStatusChangeActivityDescription('Activo', null))
      .toBe('Estado cambiado de Activo a (sin estado)')
  })
})
