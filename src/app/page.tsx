import { supabase, isSupabaseConfigured, Doctor, ESTADO_LABELS, ESTADO_COLORS } from '@/lib/supabase'
import { Users, Globe, Clock, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { cn, formatDate } from '@/lib/utils'

export const revalidate = 0

async function getDashboardData() {
  if (!supabase) return null

  const { data: doctores } = await supabase
    .from('doctores')
    .select('*')
    .order('created_at', { ascending: false })

  const doctors = (doctores || []) as Doctor[]
  const total = doctors.length
  const conSitio = doctors.filter(d => d.tiene_sitio_web).length
  const sinSitio = total - conSitio

  const porEstado: Record<string, number> = {}
  doctors.forEach(d => {
    porEstado[d.estado] = (porEstado[d.estado] || 0) + 1
  })

  const porCiudad: Record<string, number> = {}
  doctors.forEach(d => {
    const c = d.ciudad || 'Sin ciudad'
    porCiudad[c] = (porCiudad[c] || 0) + 1
  })

  const recientes = doctors.slice(0, 5)

  return { total, conSitio, sinSitio, porEstado, porCiudad, recientes, doctors }
}

export default async function DashboardPage() {
  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-yellow-500 mb-3" />
          <p className="text-sm text-yellow-700">Supabase no está configurado. Ve a Configuración para resolverlo.</p>
        </div>
      </div>
    )
  }

  const data = await getDashboardData()
  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">No se pudo conectar a Supabase.</p>
      </div>
    )
  }

  const { total, conSitio, sinSitio, porEstado, porCiudad, recientes } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen general de doctores</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Doctores</p>
              <p className="text-3xl font-bold mt-1">{total}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <Users size={22} className="text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Con Sitio Web</p>
              <p className="text-3xl font-bold mt-1 text-green-600">{conSitio}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Globe size={22} className="text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sin Sitio Web</p>
              <p className="text-3xl font-bold mt-1 text-orange-600">{sinSitio}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <AlertCircle size={22} className="text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sitios Listos</p>
              <p className="text-3xl font-bold mt-1 text-indigo-600">{porEstado['sitio_listo'] || 0}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <CheckCircle2 size={22} className="text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} /> Pipeline de Estados
          </h2>
          <div className="space-y-3">
            {Object.entries(porEstado).sort((a, b) => b[1] - a[1]).map(([estado, count]) => (
              <div key={estado} className="flex items-center gap-3">
                <span className={cn('w-3 h-3 rounded-full flex-shrink-0', (ESTADO_COLORS[estado] || 'bg-gray-300').split(' ')[0])} />
                <span className="text-sm flex-1">{ESTADO_LABELS[estado] || estado}</span>
                <div className="w-32 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full"
                    style={{ width: `${(count / total) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Por Ciudad */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold mb-4">Por Ciudad</h2>
          <div className="space-y-2">
            {Object.entries(porCiudad).sort((a, b) => b[1] - a[1]).map(([ciudad, count]) => (
              <div key={ciudad} className="flex items-center justify-between py-1">
                <span className="text-sm">{ciudad}</span>
                <span className="text-sm font-semibold bg-gray-100 px-2 py-0.5 rounded">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recientes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock size={18} /> Doctores Recientes
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 font-medium text-gray-500">Nombre</th>
                <th className="text-left py-2 font-medium text-gray-500">Especialidad</th>
                <th className="text-left py-2 font-medium text-gray-500">Estado</th>
                <th className="text-left py-2 font-medium text-gray-500">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recientes.map((d) => (
                <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2">
                    <Link href={`/doctores/${d.id}`} className="text-indigo-600 hover:underline font-medium">
                      {d.nombre}
                    </Link>
                  </td>
                  <td className="py-2 text-gray-600 max-w-[200px] truncate">{d.especialidad}</td>
                  <td className="py-2">
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', ESTADO_COLORS[d.estado] || 'bg-gray-100 text-gray-800')}>
                      {ESTADO_LABELS[d.estado] || d.estado}
                    </span>
                  </td>
                  <td className="py-2 text-gray-400">{formatDate(d.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
