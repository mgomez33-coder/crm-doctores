import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  tipo: string
  created_at: string
}

export const ESTADOS = [
  'pendiente',
  'pendiente_seo',
  'propuesta_sitio_web_enviada',
  'propuesta_directorio_enviada',
  'sitio_listo',
] as const

export const ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  pendiente_seo: 'Pendiente SEO',
  propuesta_sitio_web_enviada: 'Propuesta Web Enviada',
  propuesta_directorio_enviada: 'Propuesta Directorio Enviada',
  sitio_listo: 'Sitio Listo',
}

export const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  pendiente_seo: 'bg-orange-100 text-orange-800',
  propuesta_sitio_web_enviada: 'bg-blue-100 text-blue-800',
  propuesta_directorio_enviada: 'bg-purple-100 text-purple-800',
  sitio_listo: 'bg-green-100 text-green-800',
}
