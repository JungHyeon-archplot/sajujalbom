import { SAJU_SYSTEM_INSTRUCTION, buildSajuUserPrompt } from './sajuPrompt.js'

/**
 * Claude 해석을 요청합니다.
 * 서버는 타임아웃 방지를 위해 스트림으로 보내지만,
 * 여기서는 전체를 모은 뒤 완성된 텍스트만 반환합니다. (화면엔 한 번에 표시)
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

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    if (response.status === 504) {
      throw new Error(
        '서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.',
      )
    }
    throw new Error(
      data?.error || `사주 해석 요청에 실패했습니다. (${response.status})`,
    )
  }

  const contentType = response.headers.get('content-type') || ''

  // JSON 응답(오류·구버전 호환)
  if (contentType.includes('application/json')) {
    const data = await response.json().catch(() => ({}))
    const text = String(data?.text || '').trim()
    if (!text) {
      throw new Error('Claude 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.')
    }
    return text
  }

  // 스트림을 끝까지 읽은 뒤 완성본만 반환 (중간 표시 없음)
  const text = String(await response.text()).trim()
  if (!text) {
    throw new Error('Claude 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.')
  }
  return text
}
