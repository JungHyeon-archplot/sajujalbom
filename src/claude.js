import { SAJU_SYSTEM_INSTRUCTION, buildSajuUserPrompt } from './sajuPrompt.js'
import { TAROT_SYSTEM_INSTRUCTION, buildTarotUserPrompt } from './tarotPrompt.js'
import { getAccessToken } from './supabase.js'

function getAnalyzeUrl() {
  return '/api/analyze-saju'
}

/**
 * Claude 해석을 요청합니다.
 * 서버는 타임아웃 방지를 위해 스트림으로 보내지만,
 * 여기서는 전체를 모은 뒤 완성된 텍스트만 반환합니다.
 */
async function requestReading({ system, user, failMessage, kind }) {
  // 비로그인도 해석 가능. 토큰이 있으면 서버가 로그인 사용자로 취급합니다.
  const token = await getAccessToken().catch(() => '')

  const response = await fetch(getAnalyzeUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: token || undefined, system, user, kind }),
  })

  const raw = await response.text()
  const body = raw.replace(/^\u200b+/, '').trim()

  if (!response.ok) {
    if (response.status === 504) {
      throw new Error(
        '서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.',
      )
    }

    let message = `${failMessage} (${response.status})`
    if (body.startsWith('{')) {
      try {
        const data = JSON.parse(body)
        if (data?.error) message = data.error
      } catch {
        // keep default
      }
    } else if (body) {
      message = body
    }

    throw new Error(message)
  }

  if (!body) {
    throw new Error(
      'Claude 응답이 비어 있습니다. 배포 환경 변수에 ANTHROPIC_API_KEY가 있는지, Claude Console 크레딧이 있는지 확인한 뒤 다시 시도해 주세요.',
    )
  }

  if (body.startsWith('{')) {
    try {
      const data = JSON.parse(body)
      if (data?.error) throw new Error(data.error)
      const text = String(data?.text || '').trim()
      if (text) return text
    } catch (err) {
      if (err instanceof Error && err.message && !(err instanceof SyntaxError)) {
        throw err
      }
    }
  }

  if (body.startsWith('[오류]')) {
    throw new Error(body.replace(/^\[오류\]\s*/, ''))
  }

  return body
}

/** 사주 해석 */
export async function analyzeSaju(formData) {
  return requestReading({
    system: SAJU_SYSTEM_INSTRUCTION,
    user: buildSajuUserPrompt(formData),
    kind: 'saju',
    failMessage: '사주 해석 요청에 실패했습니다.',
  })
}

/** 타로 해석 (뽑은 카드 번호를 카드 이름으로 정리해 보냅니다) */
export async function analyzeTarot(draws, info) {
  return requestReading({
    system: TAROT_SYSTEM_INSTRUCTION,
    user: buildTarotUserPrompt(draws, info),
    kind: 'tarot',
    failMessage: '타로 해석 요청에 실패했습니다.',
  })
}
