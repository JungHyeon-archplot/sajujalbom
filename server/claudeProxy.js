const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-5'
const MAX_TOKENS = 4096

/**
 * Anthropic 스트리밍 응답을 읽어 텍스트를 모읍니다.
 * onChunk가 있으면 조각이 올 때마다 호출합니다.
 */
export async function collectClaudeText({ system, user, apiKey, onChunk }) {
  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      error:
        'ANTHROPIC_API_KEY가 없습니다. 프로젝트 루트 .env 또는 Netlify 환경 변수를 확인해 주세요.',
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
          'Anthropic API 키가 유효하지 않습니다. API 키 설정을 확인해 주세요.',
      }
    }
    if (
      upstream.status === 402 ||
      /credit|billing|balance|usage/i.test(message)
    ) {
      return {
        ok: false,
        status: 402,
        error:
          'Anthropic 크레딧이 부족합니다. Claude Console에서 자금을 추가한 뒤 다시 시도해 주세요.',
      }
    }
    return { ok: false, status: upstream.status || 502, error: message }
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
        // 다음 청크에서 이어받음
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

  if (streamError) {
    return { ok: false, status: 502, error: streamError }
  }

  if (stopReason === 'max_tokens') {
    const notice =
      '\n\n[안내] 응답 길이 한도에 도달해 해석이 중간에 끊겼을 수 있습니다.'
    full += notice
    onChunk?.(notice)
  }

  const text = full.trim()
  if (!text) {
    return {
      ok: false,
      status: 502,
      error:
        'Claude가 빈 응답을 반환했습니다. 크레딧·모델 권한·네트워크를 확인한 뒤 다시 시도해 주세요.',
    }
  }

  return { ok: true, status: 200, text }
}

/**
 * Vite 미들웨어용 스트림. 헤더를 먼저 연 뒤 토큰을 흘려보냅니다.
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

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Netlify/프록시 타임아웃 방지: 첫 바이트를 바로 보냄
        controller.enqueue(encoder.encode('\u200b'))

        const result = await collectClaudeText({
          system,
          user,
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

  return { ok: true, stream }
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
