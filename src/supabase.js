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

/* ── 사용자 정보(users) ── */

const PROFILE_COLUMNS = 'name, birth_date, birth_time, gender, calendar_type'

/** 'HH:MM:SS'로 돌아와도 입력창에 맞게 다듬습니다. */
function trimTime(value) {
  const text = String(value || '')
  return text.length >= 5 ? text.slice(0, 5) : text
}

function toForm(row) {
  if (!row) return null
  return {
    name: row.name ?? '',
    birthDate: row.birth_date ?? '',
    birthTime: trimTime(row.birth_time),
    gender: row.gender ?? '',
    calendarType: row.calendar_type ?? 'solar',
  }
}

/** 로그인한 사용자의 저장된 생년월일 정보 (없으면 null) */
export async function getMyProfile() {
  if (!supabase) return null

  const { data: auth } = await supabase.auth.getUser()
  const userId = auth?.user?.id
  if (!userId) return null

  const { data, error } = await supabase
    .from('users')
    .select(PROFILE_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return null
  return toForm(data)
}

/** 사주를 볼 때마다 최신 정보로 갱신합니다. */
export async function upsertMyProfile(input) {
  if (!supabase) return null

  const { data: auth } = await supabase.auth.getUser()
  const userId = auth?.user?.id
  if (!userId) return null // 비밀번호로만 들어온 경우는 저장할 곳이 없습니다.

  const { error } = await supabase.from('users').upsert(
    {
      user_id: userId,
      name: input.name || null,
      birth_date: input.birthDate || null,
      birth_time: input.birthTime || null,
      gender: input.gender || null,
      calendar_type: input.calendarType || 'solar',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  if (error) throw error
  return userId
}

/* ── 사주 해석 기록(saju_readings) ── */
// 생년월일 정보는 users에 두고, 여기에는 결과만 남긴 뒤 user_id로 연결합니다.
// 예전 기록은 아직 자체 컬럼에 값이 있어서 그것을 대체값으로 씁니다.

async function selectReadings(columns, build) {
  const withProfile = `${columns}, users(${PROFILE_COLUMNS})`
  let query = build(supabase.from('saju_readings').select(withProfile))
  let { data, error } = await query

  // users 테이블/관계가 아직 없으면 예전 방식으로 되돌아갑니다.
  if (error) {
    ;({ data, error } = await build(
      supabase.from('saju_readings').select(columns),
    ))
    if (error) throw error
  }
  return data
}

export async function listSajuReadings() {
  if (!supabase) return []

  const rows = await selectReadings('id, name, created_at', (q) =>
    q.order('created_at', { ascending: false }),
  )

  return (rows ?? []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    name: row.users?.name || row.name || '이름 없음',
  }))
}

export async function getSajuReading(id) {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')

  const rows = await selectReadings(
    'id, name, birth_date, birth_time, gender, calendar_type, result, created_at',
    (q) => q.eq('id', id).limit(1),
  )

  const row = rows?.[0]
  if (!row) throw new Error('저장된 사주를 찾지 못했습니다.')

  const profile = toForm(row.users) || toForm(row) || {}
  return {
    id: row.id,
    created_at: row.created_at,
    result: row.result,
    name: profile.name,
    birth_date: profile.birthDate,
    birth_time: profile.birthTime,
    gender: profile.gender,
    calendar_type: profile.calendarType,
  }
}

export async function saveSajuReading(input) {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')

  const userId = await upsertMyProfile(input)

  const { data, error } = await supabase
    .from('saju_readings')
    // 로그인하지 않았으면 연결할 곳이 없어 이름만 함께 남깁니다.
    .insert({ result: input.result, name: userId ? null : input.name })
    .select('id, name, created_at')
    .single()

  if (error) throw error
  return { ...data, name: input.name }
}

export async function updateSajuReading(id, input) {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')

  const userId = await upsertMyProfile(input)

  const payload = {}
  if (!userId) payload.name = input.name
  if (input.result !== undefined) payload.result = input.result

  const { data, error } = await supabase
    .from('saju_readings')
    .update(payload)
    .eq('id', id)
    .select('id, name, created_at')
    .single()

  if (error) throw error
  return { ...data, name: input.name }
}

export async function deleteSajuReading(id) {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')

  const { error } = await supabase.from('saju_readings').delete().eq('id', id)

  if (error) throw error
}
