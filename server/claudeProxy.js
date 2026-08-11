const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-5'
const MAX_TOKENS = 8192

/**
 * Claude Messages API 호출 (Vite 미들웨어 / Netlify Function 공용)
 */
export async function callClaude({ system, user, apiKey }) {
  if (!apiKey) {
    return {
      status: 500,
      body: {
        error:
          'ANTHROPIC_API_KEY가 없습니다. 프로젝트 루트 .env에 키를 넣고 개발 서버를 다시 시작해 주세요.',
      },
    }
  }

  if (!system || !user) {
    return {
      status: 400,
      body: { error: '요청 본문이 올바르지 않습니다.' },
    }
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
        status: 401,
        body: {
          error:
            'Anthropic API 키가 유효하지 않습니다. .env의 ANTHROPIC_API_KEY를 확인해 주세요.',
        },
      }
    }

    if (response.status === 402 || /credit|billing|balance/i.test(message)) {
      return {
        status: 402,
        body: {
          error:
            'Anthropic 크레딧이 부족합니다. Claude Console에서 자금을 추가한 뒤 다시 시도해 주세요.',
        },
      }
    }

    return { status: response.status, body: { error: message } }
  }

  const text = (data?.content || [])
    .filter((part) => part?.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim()

  if (!text) {
    return {
      status: 502,
      body: { error: 'Claude 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.' },
    }
  }

  return { status: 200, body: { text } }
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
