const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 4096

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
      'ANTHROPIC_API_KEY가 없습니다. Netlify 환경 변수에 키를 설정해 주세요.',
    )
  }

  let payload
  try {
    payload = await req.json()
  } catch {
    return jsonError(400, '요청 본문이 올바르지 않습니다.')
  }

  if (!payload?.system || !payload?.user) {
    return jsonError(400, '요청 본문이 올바르지 않습니다.')
  }

  const accessPassword = process.env.SAJU_ACCESS_PASSWORD?.trim()
  if (!accessPassword) {
    return jsonError(
      500,
      'SAJU_ACCESS_PASSWORD가 Netlify 환경 변수에 없습니다.',
    )
  }
  if (String(payload?.password ?? '').trim() !== accessPassword) {
    return jsonError(
      401,
      '비밀번호 인증이 필요합니다. 먼저 잠금을 해제해 주세요.',
    )
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 게이트웨이 타임아웃 방지: 즉시 첫 바이트 전송
        controller.enqueue(encoder.encode('\u200b'))

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
          'Anthropic API 키가 유효하지 않습니다. Netlify 환경 변수를 확인해 주세요.',
      }
    }
    if (
      upstream.status === 402 ||
      /credit|billing|balance|usage/i.test(message)
    ) {
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
