// Vercel Edge Function: /api/admin
// 마스터 계정만 전체 타로 기록을 조회할 수 있습니다.
export const config = { runtime: 'edge' }

const DEFAULT_MASTERS = ['jhsimon7@dgu.ac.kr', 'archplot100@gmail.com']

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: corsHeaders() })
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method Not Allowed' })
  }

  let payload
  try {
    payload = await req.json()
  } catch {
    return json(400, { error: '요청 본문이 올바르지 않습니다.' })
  }

  const user = await verifySupabaseToken(payload?.token)
  if (!user) return json(401, { error: '로그인이 필요합니다.' })
  if (!isMaster(user.email)) return json(403, { error: '권한이 없습니다.' })

  const url = supabaseUrl()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return json(500, { error: '서버 설정이 완료되지 않았습니다.' })

  try {
    const res = await fetch(
      `${url}/rest/v1/tarot_readings?select=id,created_at,name,concern,cards,result&order=created_at.desc&limit=300`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    )
    if (!res.ok) return json(502, { error: '기록을 불러오지 못했습니다.' })
    return json(200, { records: await res.json() })
  } catch {
    return json(502, { error: '기록을 불러오지 못했습니다.' })
  }
}

function isMaster(email) {
  const list = (process.env.MASTER_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  const masters = list.length ? list : DEFAULT_MASTERS
  return masters.includes(String(email || '').toLowerCase())
}

function supabaseUrl() {
  return (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  ).replace(/\/$/, '')
}

async function verifySupabaseToken(token) {
  const jwt = String(token || '').trim()
  if (!jwt) return null

  const url = supabaseUrl()
  const apikey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !apikey) return null

  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey, Authorization: `Bearer ${jwt}` },
    })
    if (!res.ok) return null
    const user = await res.json()
    if (!user?.id) return null
    return { id: user.id, email: String(user.email || '').toLowerCase() }
  } catch {
    return null
  }
}

function corsHeaders() {
  // 이 API는 같은 도메인의 화면에서만 씁니다.
  // Access-Control-Allow-Origin을 주지 않으면 다른 사이트에서 호출해도
  // 브라우저가 응답을 읽지 못합니다.
  return {}
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}
