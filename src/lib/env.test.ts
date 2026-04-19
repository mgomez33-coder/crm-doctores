import { describe, it, expect } from 'vitest'
import { getSupabasePublicEnv, maskEnvValue } from './env'

describe('getSupabasePublicEnv', () => {
  it('returns configured=true when both vars are present', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_abc123'
    const env = getSupabasePublicEnv()
    expect(env.configured).toBe(true)
    expect(env.url).toBe('https://example.supabase.co')
    expect(env.anonKey).toBe('sb_publishable_abc123')
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })

  it('returns configured=false when url is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_abc123'
    expect(getSupabasePublicEnv().configured).toBe(false)
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })

  it('returns configured=false when anon key is missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    expect(getSupabasePublicEnv().configured).toBe(false)
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
  })

  it('returns configured=false when both are empty strings', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ''
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ''
    expect(getSupabasePublicEnv().configured).toBe(false)
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })

  it('trims whitespace from env vars', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '  https://example.supabase.co  '
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '  sb_key123  '
    const env = getSupabasePublicEnv()
    expect(env.url).toBe('https://example.supabase.co')
    expect(env.anonKey).toBe('sb_key123')
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })
})

describe('maskEnvValue', () => {
  it('masks a long value', () => {
    expect(maskEnvValue('sb_publishable_abc123xyz')).toBe('sb_publishab...')
  })

  it('handles short values', () => {
    expect(maskEnvValue('short')).toBe('short...')
  })

  it('handles undefined', () => {
    expect(maskEnvValue(undefined)).toBe('(vacío)')
  })

  it('handles null', () => {
    expect(maskEnvValue(null)).toBe('(vacío)')
  })

  it('handles empty string', () => {
    expect(maskEnvValue('')).toBe('(vacío)')
  })
})
