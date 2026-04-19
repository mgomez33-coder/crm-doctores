'use client'

import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { maskEnvValue } from '@/lib/env'
import { CheckCircle2, XCircle, Copy, Check, Database } from 'lucide-react'

const SQL_MIGRATION = `-- Migration: 001_notas_actividades.sql
CREATE TABLE IF NOT EXISTS public.notas (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id BIGINT NOT NULL REFERENCES public.doctores(id) ON DELETE CASCADE,
  nota TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'general' CHECK (tipo IN ('general', 'seguimiento', 'propuesta', 'recordatorio')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.actividades (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id BIGINT NOT NULL REFERENCES public.doctores(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'nota' CHECK (tipo IN ('nota', 'cambio_estado', 'correo', 'llamada', 'visita', 'pago')),
  descripcion TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notas_doctor_id ON public.notas(doctor_id);
CREATE INDEX IF NOT EXISTS idx_notas_created_at ON public.notas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_actividades_doctor_id ON public.actividades(doctor_id);
CREATE INDEX IF NOT EXISTS idx_actividades_created_at ON public.actividades(created_at DESC);

ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on notas" ON public.notas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on actividades" ON public.actividades FOR ALL USING (true) WITH CHECK (true);`

export default function ConfiguracionPage() {
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [copied, setCopied] = useState(false)

  const url = maskEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key = maskEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const configured = isSupabaseConfigured

  const testConnection = async () => {
    if (!supabase) {
      setTestResult('Supabase no está configurado')
      return
    }
    setTesting(true)
    try {
      const { count, error } = await supabase.from('doctores').select('*', { count: 'exact', head: true })
      if (error) {
        setTestResult(`Error: ${error.message}`)
      } else {
        setTestResult(`Conexión exitosa. ${count} registros encontrados.`)
      }
    } catch (e: any) {
      setTestResult(`Error: ${e.message}`)
    }
    setTesting(false)
  }

  const copySQL = () => {
    navigator.clipboard.writeText(SQL_MIGRATION)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">Estado del sistema y configuración</p>
      </div>

      {/* Environment Variables */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Variables de Entorno</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">NEXT_PUBLIC_SUPABASE_URL</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-gray-400">{url}</span>
              {configured ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-gray-400">{key}</span>
              {configured ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
            </div>
          </div>
        </div>
      </div>

      {/* Connection Test */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Test de Conexión</h2>
        <button
          onClick={testConnection}
          disabled={testing || !configured}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {testing ? 'Probando...' : 'Probar Conexión'}
        </button>
        {testResult && (
          <p className={`mt-3 text-sm ${testResult.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {testResult}
          </p>
        )}
      </div>

      {/* SQL Migration */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database size={18} /> Migración SQL
          </h2>
          <button
            onClick={copySQL}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado!' : 'Copiar SQL'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-3">Ejecuta este SQL en el SQL Editor de Supabase para crear las tablas de notas y actividades.</p>
        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap text-gray-700">
          {SQL_MIGRATION}
        </pre>
      </div>
    </div>
  )
}
