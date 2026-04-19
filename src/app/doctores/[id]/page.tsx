'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Doctor, Nota, Actividad, supabase, isSupabaseConfigured, ESTADO_LABELS, ESTADO_COLORS } from '@/lib/supabase'
import { isMissingRelationError, normalizeTimelineItems, buildStatusChangeActivityDescription, type TimelineItem } from '@/lib/crm'
import { NOTA_TIPOS } from '@/lib/crm-constants'
import { cn, formatDateTime } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import { ArrowLeft, Mail, Globe, Phone, MapPin, Calendar, ExternalLink, Copy, Check, FileText, Plus, Send, AlertCircle, Activity, StickyNote } from 'lucide-react'

const EMAIL_TEMPLATES = [
  {
    name: 'Propuesta de Sitio Web',
    subject: 'Propuesta de Sitio Web Profesional - Dr(a). {nombre}',
    body: `Estimado/a Dr(a). {nombre},

Espero que se encuentre muy bien.

Me pongo en contacto con usted para presentarle una propuesta para el desarrollo de un sitio web profesional que le permita fortalecer su presencia digital y llegar a más pacientes.

Nuestros planes incluyen:
- Diseño profesional y responsive
- Optimización para buscadores (SEO)
- Integración con Google Maps
- Formulario de contacto
- Sección de especialidades y servicios

Quedo a su disposición para cualquier duda o para agendar una llamada.

Saludos cordiales`
  },
  {
    name: 'Propuesta de Directorio',
    subject: 'Registro en Directorio Médico - Dr(a). {nombre}',
    body: `Estimado/a Dr(a). {nombre},

Le escribimos para invitarle a formar parte de nuestro directorio médico digital, una plataforma diseñada para conectar a pacientes con los mejores especialistas de Chihuahua.

Beneficios del registro:
- Mayor visibilidad en búsquedas locales
- Perfil profesional completo
- Opiniones de pacientes verificadas
- Enlace directo a WhatsApp

Quedo atento/a a su respuesta.

Saludos cordiales`
  },
  {
    name: 'Seguimiento',
    subject: 'Seguimiento - Dr(a). {nombre}',
    body: `Estimado/a Dr(a). {nombre},

Le escribo para dar seguimiento a nuestra comunicación anterior sobre {tema}.

Me gustaría saber si ha tenido oportunidad de revisar la información que le compartí. Estaré encantado/a de resolver cualquier duda que pueda tener.

¿Le gustaría agendar una breve llamada esta semana?

Saludos cordiales`
  },
  {
    name: 'Bienvenida (Post-pago)',
    subject: '¡Bienvenido/a! - Confirmación de registro - Dr(a). {nombre}',
    body: `Estimado/a Dr(a). {nombre},

¡Gracias por su confianza! Su registro ha sido procesado exitosamente.

Próximos pasos:
1. Recibirá un correo con acceso a su perfil
2. Nuestro equipo configurará su sitio web en las próximas 48 horas
3. Le enviaremos un enlace para revisar y aprobar el diseño

Si tiene cualquier pregunta, no dude en contactarnos.

Saludos cordiales`
  }
]

const NOTA_TIPO_LABELS: Record<string, string> = {
  general: 'General',
  seguimiento: 'Seguimiento',
  propuesta: 'Propuesta',
  recordatorio: 'Recordatorio',
}

const TIMELINE_KIND_STYLES = {
  nota: { icon: StickyNote, color: 'text-blue-500', bg: 'bg-blue-50' },
  actividad: { icon: Activity, color: 'text-green-500', bg: 'bg-green-50' },
}

export default function DoctorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)
  const [mounted, setMounted] = useState(false)
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [notasSupported, setNotasSupported] = useState(true)
  const [actividadesSupported, setActividadesSupported] = useState(true)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Doctor>>({})
  const [newNota, setNewNota] = useState('')
  const [newNotaTipo, setNewNotaTipo] = useState('general')
  const [saving, setSaving] = useState(false)
  const [notaSaving, setNotaSaving] = useState(false)
  const [notaError, setNotaError] = useState<string | null>(null)
  const [copied, setCopied] = useState('')
  const [showEmailModal, setShowEmailModal] = useState(false)

  const fetchDoctor = useCallback(async () => {
    if (!supabase) return
    setLoading(true)

    const { data: d } = await supabase.from('doctores').select('*').eq('id', id).single()

    let notas: Nota[] | null = null
    let actividades: Actividad[] | null = null

    const { data: n, error: notasErr } = await supabase
      .from('notas')
      .select('*')
      .eq('doctor_id', id)
      .order('created_at', { ascending: false })

    if (notasErr) {
      if (isMissingRelationError(notasErr, ['notas'])) {
        setNotasSupported(false)
      }
    } else {
      notas = n as Nota[]
    }

    const { data: a, error: actErr } = await supabase
      .from('actividades')
      .select('*')
      .eq('doctor_id', id)
      .order('created_at', { ascending: false })

    if (actErr) {
      if (isMissingRelationError(actErr, ['actividades'])) {
        setActividadesSupported(false)
      }
    } else {
      actividades = a as Actividad[]
    }

    setDoctor(d as unknown as Doctor)
    setTimeline(normalizeTimelineItems(notas, actividades))
    setLoading(false)
  }, [id])

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { fetchDoctor() }, [fetchDoctor])

  const handleStatusChange = async (doctorId: number, newEstado: string) => {
    if (!supabase || !doctor) return
    const oldEstado = doctor.estado

    await supabase.from('doctores').update({ estado: newEstado }).eq('id', doctorId)

    if (actividadesSupported) {
      await supabase.from('actividades').insert({
        doctor_id: id,
        tipo: 'cambio_estado',
        descripcion: buildStatusChangeActivityDescription(oldEstado, newEstado),
        metadata: { from: oldEstado, to: newEstado },
      })
    }

    fetchDoctor()
  }

  const handleSave = async () => {
    if (!supabase) return
    setSaving(true)
    await supabase.from('doctores').update(editForm).eq('id', id)
    setEditing(false)
    setSaving(false)
    fetchDoctor()
  }

  const addNota = async () => {
    if (!supabase || !newNota.trim()) return
    setNotaSaving(true)
    setNotaError(null)

    const { error } = await supabase
      .from('notas')
      .insert({ doctor_id: id, nota: newNota.trim(), tipo: newNotaTipo })

    if (error) {
      setNotaError(error.message || 'Error al guardar la nota')
    } else {
      setNewNota('')
      if (actividadesSupported) {
        await supabase.from('actividades').insert({
          doctor_id: id,
          tipo: 'nota',
          descripcion: `Nota agregada: ${newNota.trim().slice(0, 80)}${newNota.trim().length > 80 ? '...' : ''}`,
          metadata: { nota_tipo: newNotaTipo },
        })
      }
      fetchDoctor()
    }
    setNotaSaving(false)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  const openEmailTemplate = async (idx: number) => {
    if (!doctor) return
    const t = EMAIL_TEMPLATES[idx]
    const subject = t.subject.replace('{nombre}', doctor.nombre)
    const body = t.body.replace('{nombre}', doctor.nombre).replace('{tema}', 'su perfil profesional')
    const mailto = `mailto:${doctor.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailto)

    if (supabase) {
      await supabase.from('notas').insert({ doctor_id: id, nota: `Email abierto: ${t.name}`, tipo: 'seguimiento' }).then(() => {})
      if (actividadesSupported) {
        await supabase.from('actividades').insert({
          doctor_id: id,
          tipo: 'correo',
          descripcion: `Email preparado: ${t.name}`,
          metadata: { template: t.name, subject },
        })
      }
      fetchDoctor()
    }
  }

  if (!mounted || loading) return <div className="p-12 text-center text-gray-400">Cargando...</div>

  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Detalle del Doctor</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-yellow-500 mb-3" />
          <p className="text-sm text-yellow-700">Supabase no está configurado. Ve a Configuración para resolverlo.</p>
        </div>
      </div>
    )
  }

  if (!doctor) return <div className="p-12 text-center text-gray-400">Doctor no encontrado</div>

  const displayDoctor = editing ? { ...doctor, ...editForm } : doctor

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/doctores')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{displayDoctor.nombre}</h1>
          <p className="text-gray-500 text-sm">{displayDoctor.especialidad}</p>
        </div>
        <StatusBadge doctor={doctor} onStatusChange={handleStatusChange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Información</h2>
              <button
                onClick={() => { setEditing(!editing); setEditForm({}) }}
                className={cn('text-sm px-3 py-1 rounded-lg', editing ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600')}
              >
                {editing ? 'Cancelar' : 'Editar'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {editing ? (
                <>
                  <FieldEdit label="Nombre" value={editForm.nombre ?? doctor.nombre} onChange={v => setEditForm({ ...editForm, nombre: v })} />
                  <FieldEdit label="Especialidad" value={editForm.especialidad ?? doctor.especialidad} onChange={v => setEditForm({ ...editForm, especialidad: v })} />
                  <FieldEdit label="Ciudad" value={editForm.ciudad ?? (doctor.ciudad || '')} onChange={v => setEditForm({ ...editForm, ciudad: v })} />
                  <FieldEdit label="Dirección" value={editForm.direccion ?? (doctor.direccion || '')} onChange={v => setEditForm({ ...editForm, direccion: v })} />
                  <FieldEdit label="Teléfonos" value={editForm.telefonos ?? (doctor.telefonos || '')} onChange={v => setEditForm({ ...editForm, telefonos: v })} />
                  <FieldEdit label="Email" value={editForm.email ?? (doctor.email || '')} onChange={v => setEditForm({ ...editForm, email: v })} />
                  <FieldEdit label="Sitio Web" value={editForm.sitio_web ?? (doctor.sitio_web || '')} onChange={v => setEditForm({ ...editForm, sitio_web: v })} />
                  <FieldEdit label="URL Stripe" value={editForm.url_stripe ?? (doctor.url_stripe || '')} onChange={v => setEditForm({ ...editForm, url_stripe: v })} />
                </>
              ) : (
                <>
                  <FieldView icon={MapPin} label="Dirección" value={doctor.direccion} />
                  <FieldView icon={MapPin} label="Ciudad" value={doctor.ciudad} />
                  <FieldView icon={Phone} label="Teléfonos" value={doctor.telefonos} copyable />
                  <FieldView icon={Mail} label="Email" value={doctor.email} copyable link={`mailto:${doctor.email}`} />
                  <FieldView icon={Globe} label="Sitio Web" value={doctor.sitio_web} link={doctor.sitio_web || undefined} />
                  <FieldView icon={ExternalLink} label="Stripe" value={doctor.url_stripe} link={doctor.url_stripe || undefined} />
                  <FieldView icon={Calendar} label="Registrado" value={formatDateTime(doctor.created_at)} />
                  <FieldView icon={Globe} label="Tiene Sitio" value={doctor.tiene_sitio_web ? 'Sí' : 'No'} />
                </>
              )}
            </div>

            {editing && (
              <div className="mt-4 flex justify-end">
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            )}
          </div>

          {/* Timeline (Notas + Actividades) */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Notas y Actividad</h2>

            {!notasSupported && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-700 flex items-center gap-2">
                <AlertCircle size={16} />
                La tabla <code className="bg-yellow-100 px-1 rounded">notas</code> no existe. Crea las tablas desde Configuración.
              </div>
            )}

            {!actividadesSupported && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-700 flex items-center gap-2">
                <AlertCircle size={16} />
                La tabla <code className="bg-yellow-100 px-1 rounded">actividades</code> no existe. Crea las tablas desde Configuración.
              </div>
            )}

            {notasSupported && (
              <div className="flex gap-2 mb-4">
                <select value={newNotaTipo} onChange={e => setNewNotaTipo(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  {NOTA_TIPOS.map(t => (
                    <option key={t} value={t}>{NOTA_TIPO_LABELS[t] || t}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newNota}
                  onChange={e => setNewNota(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !notaSaving && addNota()}
                  placeholder="Agregar nota..."
                  disabled={notaSaving}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
                <button onClick={addNota} disabled={notaSaving || !newNota.trim()} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                  {notaSaving ? '...' : <Plus size={16} />}
                </button>
              </div>
            )}

            {notaError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                {notaError}
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {timeline.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin actividad registrada</p>
              ) : (
                timeline.map(item => {
                  const style = TIMELINE_KIND_STYLES[item.kind]
                  const Icon = style.icon
                  return (
                    <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', style.bg)}>
                        <Icon size={14} className={style.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{item.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDateTime(item.createdAt)} · {item.kind === 'nota' ? (NOTA_TIPO_LABELS[item.type] || item.type) : item.type}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold mb-3">Acciones Rápidas</h3>
            <div className="space-y-2">
              <button onClick={() => setShowEmailModal(true)} className="w-full flex items-center gap-2 px-3 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm hover:bg-indigo-100">
                <Send size={16} /> Enviar Email
              </button>
              {doctor.telefonos && (
                <button onClick={() => copyToClipboard(doctor.telefonos!, 'tel')} className="w-full flex items-center gap-2 px-3 py-2.5 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100">
                  {copied === 'tel' ? <Check size={16} /> : <Copy size={16} />}
                  {copied === 'tel' ? 'Copiado!' : 'Copiar Teléfono'}
                </button>
              )}
              {doctor.url_stripe && (
                <a href={doctor.url_stripe} target="_blank" className="w-full flex items-center gap-2 px-3 py-2.5 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100">
                  <ExternalLink size={16} /> Abrir Stripe
                </a>
              )}
              {doctor.sitio_web && (
                <a href={doctor.sitio_web} target="_blank" className="w-full flex items-center gap-2 px-3 py-2.5 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100">
                  <Globe size={16} /> Ver Sitio Web
                </a>
              )}
            </div>
          </div>

          {/* Email Modal */}
          {showEmailModal && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold mb-3">Plantillas de Email</h3>
              <div className="space-y-2">
                {EMAIL_TEMPLATES.map((t, i) => (
                  <button key={i} onClick={() => { openEmailTemplate(i); setShowEmailModal(false) }} className="w-full text-left px-3 py-2.5 bg-gray-50 rounded-lg text-sm hover:bg-gray-100">
                    <FileText size={14} className="inline mr-2 text-gray-400" />
                    {t.name}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowEmailModal(false)} className="w-full mt-3 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FieldView({ icon: Icon, label, value, copyable, link }: { icon: any; label: string; value: string | null; copyable?: boolean; link?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5"><Icon size={12} />{label}</p>
      {value ? (
        <div className="flex items-center gap-1">
          {link ? (
            <a href={link} target="_blank" className="text-sm text-indigo-600 hover:underline truncate">{value}</a>
          ) : (
            <span className="text-sm truncate">{value}</span>
          )}
          {copyable && (
            <button onClick={() => navigator.clipboard.writeText(value)} className="text-gray-300 hover:text-gray-600 flex-shrink-0">
              <Copy size={12} />
            </button>
          )}
        </div>
      ) : (
        <span className="text-sm text-gray-300">-</span>
      )}
    </div>
  )
}

function FieldEdit({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-0.5 block">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  )
}
