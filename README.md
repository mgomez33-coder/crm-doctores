# CRM Doctores

Sistema CRM para gestión de doctores - Next.js + Supabase

## Características

- 📊 **Dashboard** con métricas y pipeline de estados
- 👨‍⚕️ **Lista de doctores** con filtros, búsqueda y paginación
- 📝 **Detalle del doctor** con edición inline y cambio de estado
- 💬 **Notas y seguimiento** por doctor (requiere tabla `notas` en Supabase)
- 📧 **Email templates** con plantillas predefenidas (propuesta web, directorio, seguimiento, bienvenida)
- 🔗 **Integración Stripe** con links de pago por doctor
- 📤 **Exportar CSV** de todos los doctores
- ⚙️ **Configuración** con prueba de conexión a Supabase
- 📱 **Responsive** y diseño limpio

## Tech Stack

- **Next.js 15** (App Router, Server Components)
- **React 19** + TypeScript
- **Tailwind CSS 4**
- **Supabase** (PostgreSQL + REST API)
- **Lucide React** (iconos)

## Configuración

1. Clonar el repositorio:
```bash
git clone https://github.com/mgomez33-coder/crm-doctores.git
cd crm-doctores
npm install
```

2. Crear `.env.local` con tus credenciales de Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

3. Crear la tabla `notas` en Supabase (SQL Editor):
```sql
CREATE TABLE notas (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctores(id) ON DELETE CASCADE,
  nota TEXT NOT NULL,
  tipo TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON notas
  FOR ALL USING (true) WITH CHECK (true);
```

4. Iniciar en desarrollo:
```bash
npm run dev
```

## Deploy en Vercel

1. Ir a [vercel.com](https://vercel.com) e importar el repo `mgomez33-coder/crm-doctores`
2. Agregar las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy automático ✅

## Estados del Pipeline

| Estado | Color | Descripción |
|--------|-------|-------------|
| pendiente | 🟡 Amarillo | Doctor registrado, sin contacto |
| pendiente_seo | 🟠 Naranja | Pendiente de optimización SEO |
| propuesta_sitio_web_enviada | 🔵 Azul | Propuesta de web enviada |
| propuesta_directorio_enviada | 🟣 Morado | Propuesta de directorio enviada |
| sitio_listo | 🟢 Verde | Sitio web publicado y listo |

## Licencia

MIT
