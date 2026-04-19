// Shared pure constants and types for the CRM system
// No runtime dependencies — safe for server, client, and tests

// ─── Estados de Doctor ───
export const ESTADOS = [
  'Pendiente',
  'Contactado',
  'Propuesta Enviada',
  'Sitio Listo',
  'Activo',
  'Inactivo',
  'No Interesado',
] as const

export type EstadoDoctor = (typeof ESTADOS)[number]

export const ESTADO_LABELS: Record<string, string> = {
  Pendiente: 'Pendiente',
  Contactado: 'Contactado',
  'Propuesta Enviada': 'Propuesta Enviada',
  'Sitio Listo': 'Sitio Listo',
  Activo: 'Activo',
  Inactivo: 'Inactivo',
  'No Interesado': 'No Interesado',
}

export const ESTADO_COLORS: Record<string, string> = {
  Pendiente: 'bg-gray-100 text-gray-700',
  Contactado: 'bg-blue-100 text-blue-700',
  'Propuesta Enviada': 'bg-yellow-100 text-yellow-700',
  'Sitio Listo': 'bg-purple-100 text-purple-700',
  Activo: 'bg-green-100 text-green-700',
  Inactivo: 'bg-red-100 text-red-700',
  'No Interesado': 'bg-orange-100 text-orange-700',
}

// ─── Notas ───
export const NOTA_TIPOS = ['general', 'seguimiento', 'propuesta', 'recordatorio'] as const
export type NotaTipo = (typeof NOTA_TIPOS)[number]

// ─── Actividades ───
export const ACTIVIDAD_TIPOS = [
  'nota',
  'cambio_estado',
  'correo',
  'llamada',
  'visita',
  'pago',
] as const
export type ActividadTipo = (typeof ACTIVIDAD_TIPOS)[number]
