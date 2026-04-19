import { createClient } from '@supabase/supabase-js'

import {
  ACTIVIDAD_TIPOS,
  ESTADOS,
  ESTADO_COLORS,
  ESTADO_LABELS,
  NOTA_TIPOS,
  type ActividadTipo,
  type EstadoDoctor,
  type NotaTipo,
} from './crm-constants'

export { ACTIVIDAD_TIPOS, ESTADOS, ESTADO_COLORS, ESTADO_LABELS, NOTA_TIPOS }
export type { ActividadTipo, EstadoDoctor, NotaTipo }

function getEnvConfigured() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
  return !!(url && anonKey)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: any = null

function getSupabase() {
  if (_supabase) return _supabase
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
  if (!url || !anonKey) return null
  _supabase = createClient(url, anonKey)
  return _supabase
}

export const isSupabaseConfigured = getEnvConfigured()

export const supabase = getSupabase()

export type Doctor = {
  id: number
  nombre: string
  especialidad: string
  ciudad: string | null
  direccion: string | null
  telefonos: string | null
  email: string | null
  sitio_web: string | null
  tiene_sitio_web: boolean
  url_stripe: string | null
  estado: string
  created_at: string
}

export type Nota = {
  id: number
  doctor_id: number
  nota: string
  tipo: NotaTipo
  created_at: string
}

export type ActividadMetadata = Record<string, unknown>

export type Actividad = {
  id: number
  doctor_id: number
  tipo: ActividadTipo
  descripcion: string
  metadata: ActividadMetadata
  created_at: string
}
