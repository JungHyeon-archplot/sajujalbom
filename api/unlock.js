// Vercel Edge Function: /api/unlock
export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: corsHeaders() })
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method Not Allowed' })
  }

  const expected = process.env.SAJU_ACCESS_PASSWORD?.trim()
  if (!expected) {
    return json(500, {
      error: 'SAJU_ACCESS_PASSWORD가 Vercel 환경 변수에 없습니다.',
    })
  }

  let payload
  try {
    payload = await req.json()
  } catch {
    return json(400, { error: '요청 본문이 올바르지 않습니다.' })
  }

  if (String(payload?.password ?? '').trim() !== expected) {
    return json(401, { error: '비밀번호가 올바르지 않습니다.' })
  }

  return json(200, { ok: true })
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}
