'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react'

export default function ConfiguracionPage() {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const { data, error } = await supabase.from('doctores').select('id', { count: 'exact' }).limit(1)
      if (error) throw error
      setTestResult({ ok: true, msg: `Conexión exitosa. ${data?.length || 0} registros encontrados.` })
    } catch (err: any) {
      setTestResult({ ok: false, msg: err.message || 'Error de conexión' })
    }
    setTesting(false)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'No configurado'
  const maskedKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 10) + '...'
    : 'No configurado'

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">Variables de entorno y conexión</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Supabase</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-400">URL</p>
            <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg">{supabaseUrl}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Anon Key</p>
            <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg">{maskedKey}</p>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={testConnection}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={testing ? 'animate-spin' : ''} />
            {testing ? 'Probando...' : 'Probar Conexión'}
          </button>

          {testResult && (
            <div className={`mt-3 flex items-center gap-2 text-sm p-3 rounded-lg ${testResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {testResult.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              {testResult.msg}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-3">Notas de la Tabla</h2>
        <p className="text-sm text-gray-600 mb-2">
          Para que las notas funcionen, necesitas crear la tabla <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">notas</code> en Supabase con este SQL:
        </p>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
{`CREATE TABLE notas (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctores(id) ON DELETE CASCADE,
  nota TEXT NOT NULL,
  tipo TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;

-- Política para lectura/escritura con anon key
CREATE POLICY "Allow all" ON notas
  FOR ALL USING (true) WITH CHECK (true);`}
        </pre>
      </div>
    </div>
  )
}
