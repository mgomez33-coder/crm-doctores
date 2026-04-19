/**
 * Pure helpers for reading/validating Supabase env vars.
 * Works in server contexts, tests, and non-browser environments.
 */

export function getSupabasePublicEnv() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
  return { url, anonKey, configured: !!(url && anonKey) }
}

/**
 * Mask a sensitive value for display: show first 12 chars + "..."
 * Accepts string, undefined, or null.
 */
export function maskEnvValue(value: string | undefined | null): string {
  if (!value) return '(vacío)'
  const prefix = value.slice(0, 12)
  return `${prefix}...`
}
