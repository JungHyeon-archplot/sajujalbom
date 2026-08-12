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

export async function deleteSajuReading(id) {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')

  const { error } = await supabase.from('saju_readings').delete().eq('id', id)

  if (error) throw error
}
