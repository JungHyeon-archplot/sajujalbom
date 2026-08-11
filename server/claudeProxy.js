const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-5'
const MAX_TOKENS = 8192

/**
 * Claude Messages API 스트리밍 호출 (Vite 개발 미들웨어용).
 * 성공 시 { ok: true, stream }, 실패 시 { ok: false, status, error }를 반환합니다.
 * stream은 텍스트(Uint8Array) 청크를 내보내는 ReadableStream입니다.
 */
export async function streamClaude({ system, user, apiKey }) {
  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      error:
        'ANTHROPIC_API_KEY가 없습니다. 프로젝트 루트 .env에 키를 넣고 개발 서버를 다시 시작해 주세요.',
    }
  }

  if (!system || !user) {
    return { ok: false, status: 400, error: '요청 본문이 올바르지 않습니다.' }
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
        status: 401,
        error:
          'Anthropic API 키가 유효하지 않습니다. .env의 ANTHROPIC_API_KEY를 확인해 주세요.',
      }
    }
    if (upstream.status === 402 || /credit|billing|balance/i.test(message)) {
      return {
        ok: false,
        status: 402,
        error:
          'Anthropic 크레딧이 부족합니다. Claude Console에서 자금을 추가한 뒤 다시 시도해 주세요.',
      }
    }
    return { ok: false, status: upstream.status || 502, error: message }
  }

  return { ok: true, stream: anthropicTextStream(upstream.body) }
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
          buffer = lines.pop() ?? ''

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
              // 부분 JSON은 무시
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

export async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw)
}
