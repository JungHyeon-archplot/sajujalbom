// Vercel Edge Function: /api/analyze-saju (사주·타로 공용)
// Edge 런타임이라 스트리밍이 가능해 긴 해석도 끊기지 않습니다.
export const config = { runtime: 'edge' }

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-5'
const MAX_TOKENS = 4096

/* 사용량 제한: 4시간 창 안에서 타로 3회 / 사주 2회 */
const WINDOW_MS = 4 * 60 * 60 * 1000
const LIMITS = {
  tarot: { max: 3, label: '타로' },
  saju: { max: 2, label: '사주' },
}

// Edge 인스턴스 메모리 기반(최선 노력). 더 정확히 막으려면 Vercel KV를 붙이세요.
const counters = new Map()

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: corsHeaders() })
  }
  if (req.method !== 'POST') {
    return jsonError(405, 'Method Not Allowed')
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    return jsonError(
      500,
      'ANTHROPIC_API_KEY가 없습니다. Vercel 환경 변수에 키를 설정해 주세요.',
    )
  }

  const accessPassword = process.env.SAJU_ACCESS_PASSWORD?.trim()

  let payload
  try {
    payload = await req.json()
  } catch {
    return jsonError(400, '요청 본문이 올바르지 않습니다.')
  }

  // 비밀번호 또는 구글 로그인(Supabase 토큰) 둘 중 하나면 통과합니다.
  const passwordOk =
    Boolean(accessPassword) &&
    String(payload?.password ?? '').trim() === accessPassword
  const loginOk = passwordOk ? true : await verifySupabaseToken(payload?.token)

  if (!loginOk) {
    return jsonError(
      401,
      'Google 로그인 또는 비밀번호로 먼저 잠금을 해제해 주세요.',
    )
  }

  if (!payload?.system || !payload?.user) {
    return jsonError(400, '요청 본문이 올바르지 않습니다.')
  }

  const kind = payload?.kind === 'tarot' ? 'tarot' : 'saju'
  const blocked = checkUsageLimit(kind, req)
  if (blocked) return jsonError(429, blocked)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode('​')) // 연결을 바로 여는 첫 바이트

        const result = await collectClaudeText({
          system: payload.system,
          user: payload.user,
          apiKey,
          onChunk(chunk) {
            controller.enqueue(encoder.encode(chunk))
          },
        })

        if (!result.ok) {
          controller.enqueue(encoder.encode(`\n\n[오류] ${result.error}`))
        } else if (kind === 'tarot') {
          await archiveReading(payload.user, result.text)
        }
        controller.close()
      } catch (err) {
        try {
          controller.enqueue(
            encoder.encode(
              `\n\n[오류] ${err?.message || '사주 해석 중 오류가 발생했습니다.'}`,
            ),
          )
          controller.close()
        } catch {
          controller.error(err)
        }
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function limitMessage(kind, resetAt) {
  const { max, label } = LIMITS[kind]
  const leftMin = Math.ceil(Math.max(60000, resetAt - Date.now()) / 60000)
  const h = Math.floor(leftMin / 60)
  const m = leftMin % 60
  const left = h > 0 ? (m > 0 ? `${h}시간 ${m}분` : `${h}시간`) : `${m}분`
  const queue = (leftMin * 100).toLocaleString('ko-KR')
  return `제 API 사용량이 녹고 있어요… 지금 대기 인원 ${queue}명, ${label}는 4시간에 ${max}번까지만 볼 수 있어요. ${left} 뒤에 다시 찾아와 주세요.`
}

function checkUsageLimit(kind, req) {
  const { max } = LIMITS[kind]
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  const now = Date.now()
  const key = `${kind}:${ip}`

  const state = counters.get(key)
  const fresh =
    state && state.resetAt > now ? state : { count: 0, resetAt: now + WINDOW_MS }

  if (fresh.count >= max) return limitMessage(kind, fresh.resetAt)

  fresh.count += 1
  counters.set(key, fresh)

  // 오래된 기록 정리
  if (counters.size > 500) {
    for (const [k, v] of counters) {
      if (v.resetAt <= now) counters.delete(k)
    }
  }
  return null
}

/** Supabase 액세스 토큰이 진짜인지 Supabase에 물어봅니다. */
async function verifySupabaseToken(token) {
  const jwt = String(token || '').trim()
  if (!jwt) return false

  const url = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  ).replace(/\/$/, '')
  const apikey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !apikey) return false

  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey, Authorization: `Bearer ${jwt}` },
    })
    return res.ok
  } catch {
    return false
  }
}

/* ── 해석 기록 보관 (서버에서만 동작) ── */

function parseReadingMeta(userPrompt) {
  const text = String(userPrompt || '')

  const name = /상담자:\s*(.+)/.exec(text)?.[1]?.trim() || null
  let concern = /요즘 고민(?:\(가장 중요\))?:\s*(.+)/.exec(text)?.[1]?.trim() || null
  if (concern && concern.startsWith('따로 적지 않음')) concern = null

  const cards = [
    ...text.matchAll(
      /^(오늘의 운|이번 달의 운|마음고생|연애운|학업·취업운):\s*(.+)$/gm,
    ),
  ].map((m) => ({ position: m[1], card: m[2].trim() }))

  return { name: name === '이름 미입력' ? null : name, concern, cards }
}

async function archiveReading(userPrompt, result) {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  ).replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return

  try {
    const meta = parseReadingMeta(userPrompt)
    await fetch(`${url}/rest/v1/tarot_readings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        name: meta.name,
        concern: meta.concern,
        cards: meta.cards,
        result,
      }),
    })
  } catch {
    // 보관에 실패해도 해석 결과에는 영향을 주지 않습니다.
  }
}

async function collectClaudeText({ system, user, apiKey, onChunk }) {
  const upstream = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      stream: true,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })

  if (!upstream.ok || !upstream.body) {
    const data = await upstream.json().catch(() => ({}))
    const message =
      data?.error?.message ||
      data?.message ||
      `Claude API 오류 (${upstream.status})`

    if (upstream.status === 401) {
      return {
        ok: false,
        error:
          'Anthropic API 키가 유효하지 않습니다. Vercel 환경 변수를 확인해 주세요.',
      }
    }
    if (upstream.status === 402 || /credit|billing|balance|usage/i.test(message)) {
      return {
        ok: false,
        error:
          'Anthropic 크레딧이 부족합니다. Claude Console에서 자금을 추가한 뒤 다시 시도해 주세요.',
      }
    }
    return { ok: false, error: message }
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''
  let stopReason = null
  let streamError = null
  const reader = upstream.body.getReader()

  const handleEvent = (evt) => {
    if (
      evt.type === 'content_block_delta' &&
      evt.delta?.type === 'text_delta' &&
      typeof evt.delta.text === 'string'
    ) {
      full += evt.delta.text
      onChunk?.(evt.delta.text)
      return
    }
    if (evt.type === 'message_delta' && evt.delta?.stop_reason) {
      stopReason = evt.delta.stop_reason
      return
    }
    if (evt.type === 'error') {
      streamError =
        evt.error?.message || evt.message || '스트리밍 중 오류가 발생했습니다.'
    }
  }

  const consume = (flushAll) => {
    const lines = buffer.split(/\r?\n/)
    buffer = flushAll ? '' : (lines.pop() ?? '')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const dataStr = trimmed.slice(5).trim()
      if (!dataStr || dataStr === '[DONE]') continue
      try {
        handleEvent(JSON.parse(dataStr))
      } catch {
        // ignore partial
      }
    }
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    consume(false)
  }
  buffer += decoder.decode()
  consume(true)

  if (streamError) return { ok: false, error: streamError }

  if (stopReason === 'max_tokens') {
    const notice =
      '\n\n[안내] 응답 길이 한도에 도달해 해석이 중간에 끊겼을 수 있습니다.'
    full += notice
    onChunk?.(notice)
  }

  if (!full.trim()) {
    return {
      ok: false,
      error:
        'Claude가 빈 응답을 반환했습니다. 크레딧·모델 권한·네트워크를 확인한 뒤 다시 시도해 주세요.',
    }
  }

  return { ok: true, text: full.trim() }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}
