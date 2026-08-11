import { SAJU_SYSTEM_INSTRUCTION, buildSajuUserPrompt } from './sajuPrompt.js'

/**
 * 입력 정보로 Claude를 호출해 사주 해석 텍스트를 받습니다.
 * API 키는 서버 프록시(/api/analyze-saju)에서만 사용합니다.
 */
export async function analyzeSaju(formData) {
  const response = await fetch('/api/analyze-saju', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: SAJU_SYSTEM_INSTRUCTION,
      user: buildSajuUserPrompt(formData),
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data?.error || `사주 해석 요청에 실패했습니다. (${response.status})`,
    )
  }

  const text = String(data?.text || '').trim()
  if (!text) {
    throw new Error('Claude 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.')
  }

  return text
}
