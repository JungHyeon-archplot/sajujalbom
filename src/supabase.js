import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Supabase env missing: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) in .env',
  )
}

export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export async function getSession() {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session ?? null
}

/** 로그인한 사용자의 액세스 토큰 (서버가 신원을 확인할 때 씁니다) */
export async function getAccessToken() {
  if (!supabase) return ''
  const { data } = await supabase.auth.getSession()
  return data?.session?.access_token || ''
}

export function onAuthStateChange(callback) {
  if (!supabase) return () => {}

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })

  return () => subscription.unsubscribe()
}

export async function signInWithGoogle() {
  if (!supabase) {
    throw new Error('Supabase가 설정되지 않았습니다. .env의 VITE_SUPABASE_URL / KEY를 확인하세요.')
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  })

  if (error) throw error
}

export async function signOut() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function listSajuReadings() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('saju_readings')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getSajuReading(id) {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')

  const { data, error } = await supabase
    .from('saju_readings')
    .select(
      'id, name, birth_date, birth_time, gender, calendar_type, result, created_at',
    )
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function saveSajuReading(input) {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')

  const { data, error } = await supabase
    .from('saju_readings')
    .insert({
      name: input.name,
      birth_date: input.birthDate,
      birth_time: input.birthTime,
      gender: input.gender,
      calendar_type: input.calendarType,
      result: input.result,
    })
    .select('id, name, created_at')
    .single()

  if (error) throw error
  return data
}

export async function updateSajuReading(id, input) {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')

  const payload = {
    name: input.name,
    birth_date: input.birthDate,
    birth_time: input.birthTime,
    gender: input.gender,
    calendar_type: input.calendarType,
  }

  if (input.result !== undefined) {
    payload.result = input.result
  }

  const { data, error } = await supabase
    .from('saju_readings')
    .update(payload)
    .eq('id', id)
    .select('id, name, created_at')
    .single()

  if (error) throw error
  return data
}

export async function deleteSajuReading(id) {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')

  const { error } = await supabase.from('saju_readings').delete().eq('id', id)

  if (error) throw error
}
