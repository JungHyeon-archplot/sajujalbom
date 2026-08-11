const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-5'
const MAX_TOKENS = 8192

/**
 * Claude Messages API 일반(비스트리밍) 호출.
 * 성공 시 { ok: true, status: 200, text }
 * 실패 시 { ok: false, status, error }
 */
export async function callClaude({ system, user, apiKey }) {
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

  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `Claude API 오류 (${response.status})`

    if (response.status === 401) {
      return {
        ok: false,
        status: 401,
        error:
          'Anthropic API 키가 유효하지 않습니다. .env의 ANTHROPIC_API_KEY를 확인해 주세요.',
      }
    }
    if (response.status === 402 || /credit|billing|balance|usage/i.test(message)) {
      return {
        ok: false,
        status: 402,
        error:
          'Anthropic 크레딧이 부족합니다. Claude Console에서 자금을 추가한 뒤 다시 시도해 주세요.',
      }
    }
    return { ok: false, status: response.status || 502, error: message }
  }

  const text = (data?.content || [])
    .filter((part) => part?.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim()

  if (!text) {
    return {
      ok: false,
      status: 502,
      error: 'Claude 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.',
    }
  }

  if (data?.stop_reason === 'max_tokens') {
    return {
      ok: true,
      status: 200,
      text:
        text +
        '\n\n[안내] 응답 길이 한도에 도달해 해석이 중간에 끊겼을 수 있습니다.',
    }
  }

  return { ok: true, status: 200, text }
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
