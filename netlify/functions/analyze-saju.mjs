// Netlify V2 함수(스트리밍). Claude 응답을 실시간으로 브라우저에 흘려보내
// Netlify 함수의 응답 대기 시간 초과(504)를 방지합니다.
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-5'
const MAX_TOKENS = 8192

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

  // 스트림이 시작되기 전(헤더 단계)의 오류는 JSON으로 명확히 반환합니다.
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
    if (upstream.status === 402 || /credit|billing|balance/i.test(message)) {
      return jsonError(
        402,
        'Anthropic 크레딧이 부족합니다. Claude Console에서 자금을 추가한 뒤 다시 시도해 주세요.',
      )
    }
    return jsonError(upstream.status || 502, message)
  }

  return new Response(anthropicTextStream(upstream.body), {
    status: 200,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}

// Anthropic SSE 스트림에서 텍스트 델타만 뽑아 평문으로 재방출합니다.
function anthropicTextStream(body) {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''

  return new ReadableStream({
    async start(controller) {
      const reader = body.getReader()
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split('\n')
          buffer = lines.pop() ?? '' // 마지막 미완성 라인은 다음 청크로 이월

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const dataStr = trimmed.slice(5).trim()
            if (!dataStr || dataStr === '[DONE]') continue
            try {
              const evt = JSON.parse(dataStr)
              if (
                evt.type === 'content_block_delta' &&
                evt.delta?.type === 'text_delta'
              ) {
                controller.enqueue(encoder.encode(evt.delta.text))
              } else if (evt.type === 'error') {
                controller.enqueue(
                  encoder.encode(
                    `\n\n[오류] ${evt.error?.message || '스트리밍 중 오류가 발생했습니다.'}`,
                  ),
                )
              }
            } catch {
              // 부분 JSON은 무시하고 다음 청크에서 이어붙입니다.
            }
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
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
