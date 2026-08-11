const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-5'
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
      system: payload.system,
      messages: [{ role: 'user', content: payload.user }],
    }),
  })

  if (!upstream.ok || !upstream.body) {
    const data = await upstream.json().catch(() => ({}))
    const message =
      data?.error?.message ||
      data?.message ||
      `Claude API 오류 (${upstream.status})`

    if (upstream.status === 401) {
      return jsonError(
        401,
        'Anthropic API 키가 유효하지 않습니다. Netlify 환경 변수를 확인해 주세요.',
      )
    }
    if (
      upstream.status === 402 ||
      /credit|billing|balance|usage/i.test(message)
    ) {
      return jsonError(
        402,
        'Anthropic 크레딧이 부족합니다. Claude Console에서 자금을 추가한 뒤 다시 시도해 주세요.',
      )
    }
    return jsonError(upstream.status || 502, message)
  }

  // 스트림으로 바로 흘려보내 Netlify 게이트웨이 타임아웃(504)을 피합니다.
  return new Response(anthropicTextStream(upstream.body), {
    status: 200,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}

function anthropicTextStream(body) {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''
  let stopReason = null

  function handleEvent(evt, controller) {
    if (
      evt.type === 'content_block_delta' &&
      evt.delta?.type === 'text_delta' &&
      evt.delta.text
    ) {
      controller.enqueue(encoder.encode(evt.delta.text))
      return
    }

    if (evt.type === 'message_delta' && evt.delta?.stop_reason) {
      stopReason = evt.delta.stop_reason
      return
    }

    if (evt.type === 'error') {
      const message =
        evt.error?.message || evt.message || '스트리밍 중 오류가 발생했습니다.'
      controller.enqueue(encoder.encode(`\n\n[오류] ${message}`))
    }
  }

  function consumeBuffer(controller, flushAll) {
    const lines = buffer.split('\n')
    buffer = flushAll ? '' : (lines.pop() ?? '')

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const dataStr = trimmed.slice(5).trim()
      if (!dataStr || dataStr === '[DONE]') continue
      try {
        handleEvent(JSON.parse(dataStr), controller)
      } catch {
        if (flushAll) continue
        buffer = `${trimmed}\n${buffer}`
        break
      }
    }
  }

  return new ReadableStream({
    async start(controller) {
      const reader = body.getReader()
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          consumeBuffer(controller, false)
        }
        buffer += decoder.decode()
        consumeBuffer(controller, true)

        if (stopReason === 'max_tokens') {
          controller.enqueue(
            encoder.encode(
              '\n\n[안내] 응답 길이 한도에 도달해 해석이 중간에 끊겼을 수 있습니다.',
            ),
          )
        }
        controller.close()
      } catch (err) {
        try {
          controller.enqueue(
            encoder.encode(
              `\n\n[오류] ${err?.message || '스트림 연결이 끊어졌습니다.'}`,
            ),
          )
          controller.close()
        } catch {
          controller.error(err)
        }
      }
    },
  })
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
