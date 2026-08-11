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

  if (String(payload?.password ?? '').trim() !== accessPassword) {
    return jsonError(401, '비밀번호 인증이 필요합니다. 먼저 잠금을 해제해 주세요.')
  }

  if (!payload?.system || !payload?.user) {
    return jsonError(400, '요청 본문이 올바르지 않습니다.')
  }

  // 타로는 수요가 몰릴 수 있어 IP당 사용량을 제한합니다.
  if (payload?.kind === 'tarot') {
    const blocked = await checkTarotLimit(request, env, context)
    if (blocked) return jsonError(429, blocked)
  }

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

/* ── 타로 사용량 제한: 4시간 안에 3회까지 ── */
const TAROT_LIMIT = 3
const TAROT_WINDOW_MS = 4 * 60 * 60 * 1000

function limitMessage(resetAt) {
  const leftMin = Math.max(1, Math.ceil((resetAt - Date.now()) / 60000))
  const h = Math.floor(leftMin / 60)
  const m = leftMin % 60
  const left = h > 0 ? `${h}시간 ${m}분` : `${m}분`
  return `제 API 사용량이 녹고 있어요… 타로는 4시간에 ${TAROT_LIMIT}번까지만 볼 수 있어요. ${left} 뒤에 다시 찾아와 주세요.`
}

/**
 * IP별 타로 횟수를 셉니다.
 * KV(TAROT_LIMIT_KV)가 연결돼 있으면 KV를, 없으면 Cache API를 씁니다.
 * @returns {Promise<string|null>} 막아야 하면 안내 문구, 통과면 null
 */
async function checkTarotLimit(request, env, context) {
  const ip =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('x-forwarded-for') ||
    'unknown'
  const now = Date.now()

  // 1) KV가 있으면 KV 사용 (정확도 높음)
  if (env.TAROT_LIMIT_KV) {
    const key = `tarot:${ip}`
    const raw = await env.TAROT_LIMIT_KV.get(key)
    const state = raw ? JSON.parse(raw) : null
    const fresh = state && state.resetAt > now ? state : { count: 0, resetAt: now + TAROT_WINDOW_MS }

    if (fresh.count >= TAROT_LIMIT) return limitMessage(fresh.resetAt)

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
      `https://tarot-limit.internal/${encodeURIComponent(ip)}`,
      { method: 'GET' },
    )
    const hit = await cache.match(key)
    const state = hit ? await hit.json().catch(() => null) : null
    const fresh =
      state && state.resetAt > now ? state : { count: 0, resetAt: now + TAROT_WINDOW_MS }

    if (fresh.count >= TAROT_LIMIT) return limitMessage(fresh.resetAt)

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
