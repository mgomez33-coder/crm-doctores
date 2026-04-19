-- Migration: 001_notas_actividades.sql
-- Creates notas and actividades tables for the CRM system
-- Idempotent: safe to re-run

-- ─── Notas ───
CREATE TABLE IF NOT EXISTS public.notas (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id BIGINT NOT NULL REFERENCES public.doctores(id) ON DELETE CASCADE,
  nota TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'general' CHECK (tipo IN ('general', 'seguimiento', 'propuesta', 'recordatorio')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Actividades ───
CREATE TABLE IF NOT EXISTS public.actividades (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id BIGINT NOT NULL REFERENCES public.doctores(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'nota' CHECK (tipo IN ('nota', 'cambio_estado', 'correo', 'llamada', 'visita', 'pago')),
  descripcion TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ───
CREATE INDEX IF NOT EXISTS idx_notas_doctor_id ON public.notas(doctor_id);
CREATE INDEX IF NOT EXISTS idx_notas_created_at ON public.notas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_actividades_doctor_id ON public.actividades(doctor_id);
CREATE INDEX IF NOT EXISTS idx_actividades_created_at ON public.actividades(created_at DESC);

-- ─── RLS Policies (allow all for anon key) ───
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Notas policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notas' AND policyname = 'Allow all on notas') THEN
    CREATE POLICY "Allow all on notas" ON public.notas FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Actividades policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'actividades' AND policyname = 'Allow all on actividades') THEN
    CREATE POLICY "Allow all on actividades" ON public.actividades FOR ALL USING (true) WITH CHECK (true);
  END IF;
END
$$;
