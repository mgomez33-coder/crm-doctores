'use client'

import { Doctor, ESTADO_LABELS, ESTADO_COLORS } from '@/lib/supabase'
import { ESTADOS } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function StatusBadge({ doctor, onStatusChange }: { doctor: Doctor; onStatusChange?: (id: number, estado: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const color = ESTADO_COLORS[doctor.estado] || 'bg-gray-100 text-gray-800'
  const label = ESTADO_LABELS[doctor.estado] || doctor.estado

  if (!onStatusChange) {
    return <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', color)}>{label}</span>
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80', color)}
      >
        {label}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
          {ESTADOS.map((e) => (
            <button
              key={e}
              onClick={() => { onStatusChange(doctor.id, e); setOpen(false) }}
              className={cn(
                'w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2',
                e === doctor.estado && 'font-semibold bg-indigo-50'
              )}
            >
              <span className={cn('w-2 h-2 rounded-full', ESTADO_COLORS[e]?.split(' ')[0] || 'bg-gray-300')} />
              {ESTADO_LABELS[e]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
