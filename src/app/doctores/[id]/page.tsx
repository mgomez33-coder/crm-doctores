'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Doctor, Nota, supabase, ESTADO_LABELS, ESTADO_COLORS } from '@/lib/supabase'
import { cn, formatDateTime } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import { ArrowLeft, Mail, Globe, Phone, MapPin, Calendar, ExternalLink, Copy, Check, FileText, Plus, Send } from 'lucide-react'

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

export default function DoctorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [notas, setNotas] = useState<Nota[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Doctor>>({})
  const [newNota, setNewNota] = useState('')
  const [newNotaTipo, setNewNotaTipo] = useState('general')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState('')
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(0)

  const fetchDoctor = useCallback(async () => {
    const { data: d } = await supabase.from('doctores').select('*').eq('id', id).single()
    const { data: n } = await supabase.from('notas').select('*').eq('doctor_id', id).order('created_at', { ascending: false })
    setDoctor(d as Doctor)
    setNotas((n || []) as Nota[])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchDoctor() }, [fetchDoctor])

  const handleStatusChange = async (doctorId: number, estado: string) => {
    await supabase.from('doctores').update({ estado }).eq('id', doctorId)
    fetchDoctor()
  }

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('doctores').update(editForm).eq('id', id)
    setEditing(false)
    setSaving(false)
    fetchDoctor()
  }

  const addNota = async () => {
    if (!newNota.trim()) return
    await supabase.from('notas').insert({ doctor_id: id, nota: newNota, tipo: newNotaTipo })
    setNewNota('')
    fetchDoctor()
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  const openEmailTemplate = (idx: number) => {
    if (!doctor) return
    const t = EMAIL_TEMPLATES[idx]
    const subject = t.subject.replace('{nombre}', doctor.nombre)
    const body = t.body.replace('{nombre}', doctor.nombre).replace('{tema}', 'su perfil profesional')
    const mailto = `mailto:${doctor.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailto)
    // Log as note
    supabase.from('notas').insert({ doctor_id: id, nota: `Email enviado: ${t.name}`, tipo: 'seguimiento' })
    fetchDoctor()
  }

  if (loading) return <div className="p-12 text-center text-gray-400">Cargando...</div>
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

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Notas y Seguimiento</h2>
            <div className="flex gap-2 mb-4">
              <select value={newNotaTipo} onChange={e => setNewNotaTipo(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="general">General</option>
                <option value="seguimiento">Seguimiento</option>
                <option value="propuesta">Propuesta</option>
                <option value="recordatorio">Recordatorio</option>
              </select>
              <input
                type="text"
                value={newNota}
                onChange={e => setNewNota(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNota()}
                placeholder="Agregar nota..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button onClick={addNota} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notas.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin notas aún</p>
              ) : (
                notas.map(n => (
                  <div key={n.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0',
                      n.tipo === 'seguimiento' ? 'bg-blue-400' :
                      n.tipo === 'propuesta' ? 'bg-purple-400' :
                      n.tipo === 'recordatorio' ? 'bg-orange-400' : 'bg-gray-400'
                    )} />
                    <div className="flex-1">
                      <p className="text-sm">{n.nota}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.created_at)} · {n.tipo}</p>
                    </div>
                  </div>
                ))
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
                  <button key={i} onClick={() => openEmailTemplate(i)} className="w-full text-left px-3 py-2.5 bg-gray-50 rounded-lg text-sm hover:bg-gray-100">
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
