// Cloudflare Pages Function: /api/analyze-saju
// Workers 런타임은 실행 시간 벽(10초)이 없어 긴 사주 해석도 잘리지 않습니다.
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-5'
const MAX_TOKENS = 4096

export async function onRequestOptions() {
  return new Response('', { status: 204, headers: corsHeaders() })
}

export async function onRequestPost(context) {
  const { request, env } = context

  const apiKey = env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    return jsonError(
      500,
      'ANTHROPIC_API_KEY가 없습니다. Cloudflare Pages 환경 변수에 키를 설정해 주세요.',
    )
  }

  const accessPassword = env.SAJU_ACCESS_PASSWORD?.trim()
  if (!accessPassword) {
    return jsonError(500, 'SAJU_ACCESS_PASSWORD가 Cloudflare 환경 변수에 없습니다.')
  }

  let payload
  try {
    payload = await request.json()
  } catch {
    return jsonError(400, '요청 본문이 올바르지 않습니다.')
  }

  // 비밀번호 또는 구글 로그인(Supabase 토큰) 둘 중 하나면 통과합니다.
  const passwordOk =
    Boolean(accessPassword) &&
    String(payload?.password ?? '').trim() === accessPassword
  const user = await verifySupabaseToken(env, payload?.token)

  if (!passwordOk && !user) {
    return jsonError(
      401,
      'Google 로그인 또는 비밀번호로 먼저 잠금을 해제해 주세요.',
    )
  }

  if (!payload?.system || !payload?.user) {
    return jsonError(400, '요청 본문이 올바르지 않습니다.')
  }

  // 수요가 몰릴 수 있어 IP당 사용량을 제한합니다.
  const kind = payload?.kind === 'tarot' ? 'tarot' : 'saju'
  const blocked = await checkUsageLimit(kind, request, env, context)
  if (blocked) return jsonError(429, blocked)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 연결을 즉시 열기 위한 첫 바이트(클라이언트가 제거함)
        controller.enqueue(encoder.encode('​'))

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
          const task = archiveReading(env, payload.user, result.text, user?.id)
          if (context?.waitUntil) context.waitUntil(task)
          else await task
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

/* ── 사용량 제한: 4시간 창 안에서 타로 3회 / 사주 2회 ── */
const WINDOW_MS = 4 * 60 * 60 * 1000
const LIMITS = {
  tarot: { max: 3, label: '타로' },
  saju: { max: 2, label: '사주' },
}

function limitMessage(kind, resetAt) {
  const { max, label } = LIMITS[kind]
  const leftMs = Math.max(60000, resetAt - Date.now())
  const leftMin = Math.ceil(leftMs / 60000)
  const h = Math.floor(leftMin / 60)
  const m = leftMin % 60
  const left = h > 0 ? (m > 0 ? `${h}시간 ${m}분` : `${h}시간`) : `${m}분`
  // 남은 시간을 100배로 부풀린 "대기 인원" 연출
  const queue = (leftMin * 100).toLocaleString('ko-KR')
  return `제 API 사용량이 녹고 있어요… 지금 대기 인원 ${queue}명, ${label}는 4시간에 ${max}번까지만 볼 수 있어요. ${left} 뒤에 다시 찾아와 주세요.`
}

/**
 * IP별 사용 횟수를 셉니다.
 * KV(TAROT_LIMIT_KV)가 연결돼 있으면 KV를, 없으면 Cache API를 씁니다.
 * @returns {Promise<string|null>} 막아야 하면 안내 문구, 통과면 null
 */
async function checkUsageLimit(kind, request, env, context) {
  const { max } = LIMITS[kind]
  const ip =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('x-forwarded-for') ||
    'unknown'
  const now = Date.now()

  // 1) KV가 있으면 KV 사용 (정확도 높음)
  if (env.TAROT_LIMIT_KV) {
    const key = `${kind}:${ip}`
    const raw = await env.TAROT_LIMIT_KV.get(key)
    const state = raw ? JSON.parse(raw) : null
    const fresh =
      state && state.resetAt > now ? state : { count: 0, resetAt: now + WINDOW_MS }

    if (fresh.count >= max) return limitMessage(kind, fresh.resetAt)

    fresh.count += 1
    await env.TAROT_LIMIT_KV.put(key, JSON.stringify(fresh), {
      expirationTtl: Math.max(60, Math.ceil((fresh.resetAt - now) / 1000)),
    })
    return null
  }

  // 2) KV가 없으면 Cache API로 대체 (설정 없이 바로 동작)
  try {
    const cache = caches.default
    const key = new Request(
      `https://usage-limit.internal/${kind}/${encodeURIComponent(ip)}`,
      { method: 'GET' },
    )
    const hit = await cache.match(key)
    const state = hit ? await hit.json().catch(() => null) : null
    const fresh =
      state && state.resetAt > now ? state : { count: 0, resetAt: now + WINDOW_MS }

    if (fresh.count >= max) return limitMessage(kind, fresh.resetAt)

    fresh.count += 1
    const ttl = Math.max(60, Math.ceil((fresh.resetAt - now) / 1000))
    const put = cache.put(
      key,
      new Response(JSON.stringify(fresh), {
        headers: { 'Cache-Control': `max-age=${ttl}`, 'Content-Type': 'application/json' },
      }),
    )
    if (context?.waitUntil) context.waitUntil(put)
    else await put
    return null
  } catch {
    // 제한 장치가 실패해도 서비스는 계속 되게 둡니다.
    return null
  }
}

/**
 * Supabase 액세스 토큰을 검증하고 사용자 정보를 돌려줍니다.
 * @returns {Promise<{id:string, email:string}|null>}
 */
async function verifySupabaseToken(env, token) {
  const jwt = String(token || '').trim()
  if (!jwt) return null

  const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const apikey =
    env.SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    env.SUPABASE_SERVICE_ROLE_KEY
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

/* ── 해석 기록 보관 (서버에서만 동작) ── */

/**
 * 요청 본문에 이미 들어 있는 프롬프트에서 이름·고민·카드를 뽑아냅니다.
 * 프롬프트 형식은 이쪽에서 만들기 때문에 형태가 고정돼 있습니다.
 */
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

async function archiveReading(env, userPrompt, result, userId) {
  const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const key = env.SUPABASE_SERVICE_ROLE_KEY
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
        user_id: userId || null,
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
          'Anthropic API 키가 유효하지 않습니다. Cloudflare 환경 변수를 확인해 주세요.',
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
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
    },
  })
}
