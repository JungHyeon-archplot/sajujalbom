const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-5'
const MAX_TOKENS = 8192

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: corsHeaders() })
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method Not Allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    return json(500, {
      error:
        'ANTHROPIC_API_KEY가 없습니다. Netlify 환경 변수에 키를 설정해 주세요.',
    })
  }

  let payload
  try {
    payload = await req.json()
  } catch {
    return json(400, { error: '요청 본문이 올바르지 않습니다.' })
  }

  if (!payload?.system || !payload?.user) {
    return json(400, { error: '요청 본문이 올바르지 않습니다.' })
  }

  try {
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
        system: payload.system,
        messages: [{ role: 'user', content: payload.user }],
      }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message =
        data?.error?.message ||
        data?.message ||
        `Claude API 오류 (${response.status})`

      if (response.status === 401) {
        return json(401, {
          error:
            'Anthropic API 키가 유효하지 않습니다. Netlify 환경 변수를 확인해 주세요.',
        })
      }
      if (
        response.status === 402 ||
        /credit|billing|balance|usage/i.test(message)
      ) {
        return json(402, {
          error:
            'Anthropic 크레딧이 부족합니다. Claude Console에서 자금을 추가한 뒤 다시 시도해 주세요.',
        })
      }
      return json(response.status || 502, { error: message })
    }

    let text = (data?.content || [])
      .filter((part) => part?.type === 'text')
      .map((part) => part.text)
      .join('\n')
      .trim()

    if (!text) {
      return json(502, {
        error: 'Claude 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.',
      })
    }

    if (data?.stop_reason === 'max_tokens') {
      text +=
        '\n\n[안내] 응답 길이 한도에 도달해 해석이 중간에 끊겼을 수 있습니다.'
    }

    return json(200, { text })
  } catch (err) {
    return json(500, {
      error: err?.message || '사주 해석 중 오류가 발생했습니다.',
    })
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
    },
  })
}
