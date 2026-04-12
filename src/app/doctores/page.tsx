'use client'

import { useState, useEffect, useCallback } from 'react'
import { Doctor, supabase, ESTADO_LABELS, ESTADO_COLORS, ESTADOS } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Search, Filter, Download, Mail, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const PAGE_SIZE = 10

export default function DoctoresPage() {
  const [doctores, setDoctores] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [filterCiudad, setFilterCiudad] = useState('')
  const [filterSitioWeb, setFilterSitioWeb] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [ciudades, setCiudades] = useState<string[]>([])

  const fetchDoctores = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('doctores').select('*', { count: 'exact' })

    if (search) {
      query = query.or(`nombre.ilike.%${search}%,email.ilike.%${search}%,especialidad.ilike.%${search}%`)
    }
    if (filterEstado) query = query.eq('estado', filterEstado)
    if (filterCiudad) query = query.eq('ciudad', filterCiudad)
    if (filterSitioWeb === 'si') query = query.eq('tiene_sitio_web', true)
    if (filterSitioWeb === 'no') query = query.eq('tiene_sitio_web', false)

    const from = page * PAGE_SIZE
    query = query.range(from, from + PAGE_SIZE - 1).order('created_at', { ascending: false })

    const { data, count } = await query
    setDoctores((data || []) as Doctor[])
    setTotal(count || 0)
    setLoading(false)
  }, [search, filterEstado, filterCiudad, filterSitioWeb, page])

  useEffect(() => {
    supabase.from('doctores').select('ciudad').then(({ data }) => {
      const c = [...new Set((data || []).map(d => d.ciudad).filter(Boolean))] as string[]
      setCiudades(c.sort())
    })
  }, [])

  useEffect(() => { fetchDoctores() }, [fetchDoctores])

  useEffect(() => { setPage(0) }, [search, filterEstado, filterCiudad, filterSitioWeb])

  const exportCSV = () => {
    const headers = ['ID', 'Nombre', 'Especialidad', 'Ciudad', 'Dirección', 'Teléfonos', 'Email', 'Sitio Web', 'Tiene Sitio', 'Estado', 'Creado']
    const rows = doctores.map(d => [d.id, d.nombre, d.especialidad, d.ciudad || '', d.direccion || '', d.telefonos || '', d.email || '', d.sitio_web || '', d.tiene_sitio_web ? 'Sí' : 'No', ESTADO_LABELS[d.estado] || d.estado, d.created_at])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'doctores.csv'; a.click()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Doctores</h1>
          <p className="text-gray-500 text-sm">{total} registros</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email, especialidad..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
          </select>
          <select value={filterCiudad} onChange={e => setFilterCiudad(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Todas las ciudades</option>
            {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterSitioWeb} onChange={e => setFilterSitioWeb(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Sitio web</option>
            <option value="si">Con sitio</option>
            <option value="no">Sin sitio</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando...</div>
        ) : doctores.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No se encontraron doctores</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Especialidad</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Ciudad</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Contacto</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {doctores.map((d) => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/doctores/${d.id}`} className="text-indigo-600 hover:underline font-medium">
                        {d.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate hidden md:table-cell">{d.especialidad}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', ESTADO_COLORS[d.estado] || 'bg-gray-100')}>
                        {ESTADO_LABELS[d.estado] || d.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{d.ciudad || '-'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        {d.email && <a href={`mailto:${d.email}`} className="text-gray-400 hover:text-indigo-600"><Mail size={14} /></a>}
                        {d.sitio_web && <a href={d.sitio_web} target="_blank" className="text-gray-400 hover:text-indigo-600"><ExternalLink size={14} /></a>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/doctores/${d.id}`} className="text-xs text-indigo-600 hover:underline">
                        Ver detalle →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <span className="text-sm text-gray-500">
              {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
