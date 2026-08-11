import { SAJU_SYSTEM_INSTRUCTION, buildSajuUserPrompt } from './sajuPrompt.js'

/**
 * 입력 정보로 Claude를 호출해 사주 해석 텍스트를 스트리밍으로 받습니다.
 * API 키는 서버 프록시(/api/analyze-saju)에서만 사용합니다.
 *
 * @param {object} formData 입력값
 * @param {(partial: string) => void} [onProgress] 지금까지 누적된 텍스트를 매 청크마다 전달
 * @returns {Promise<string>} 최종 전체 텍스트
 */
export async function analyzeSaju(formData, onProgress) {
  const response = await fetch('/api/analyze-saju', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: SAJU_SYSTEM_INSTRUCTION,
      user: buildSajuUserPrompt(formData),
    }),
  })

  // 오류는 스트림 시작 전 JSON으로 옵니다.
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(
      data?.error || `사주 해석 요청에 실패했습니다. (${response.status})`,
    )
  }

  // 스트리밍을 지원하지 않는 환경 대비 폴백
  if (!response.body) {
    const text = String(await response.text()).trim()
    if (!text) {
      throw new Error('Claude 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.')
    }
    onProgress?.(text)
    return text
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let full = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    full += decoder.decode(value, { stream: true })
    onProgress?.(full)
  }
  full += decoder.decode() // 남은 멀티바이트 마무리

  const text = full.trim()
  if (!text) {
    throw new Error('Claude 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.')
  }
  return text
}
