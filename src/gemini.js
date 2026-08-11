import { GoogleGenAI } from '@google/genai/web'
import { SAJU_SYSTEM_INSTRUCTION, buildSajuUserPrompt } from './sajuPrompt.js'

// 신규 API 키는 2.5 Flash 대신 3.x 모델을 써야 합니다.
const MODEL = 'gemini-3.6-flash'

function getApiKey() {
  return import.meta.env.VITE_GEMINI_API_KEY?.trim()
}

function formatGeminiError(err) {
  const message = String(err?.message || err || '')

  if (message.includes('denied access') || message.includes('PERMISSION_DENIED')) {
    return [
      'Google이 이 API 키(또는 프로젝트) 접근을 차단했습니다. (403)',
      '코드 문제가 아니라 Google 계정/프로젝트 권한 문제입니다.',
      '',
      '해결 방법:',
      '1) https://aistudio.google.com/apikey 에서 새 API 키를 다시 발급',
      '2) .env의 VITE_GEMINI_API_KEY를 새 키로 바꾼 뒤 npm run dev 재시작',
      '3) AI Studio / Cloud Console에서 프로젝트가 Unavailable인지 확인',
      '4) 계속 막히면 Google Cloud Billing Support에 해제 요청',
    ].join('\n')
  }

  if (message.includes('no longer available') || message.includes('NOT_FOUND')) {
    return [
      '선택한 Gemini 모델을 이 API 키에서 사용할 수 없습니다.',
      '앱 설정의 모델 이름을 최신 모델로 바꿔야 합니다.',
      '',
      message.slice(0, 300),
    ].join('\n')
  }

  return message || '사주 해석 중 오류가 발생했습니다.'
}

/**
 * 입력 정보로 Gemini를 호출해 사주 해석 텍스트를 받습니다.
 */
export async function analyzeSaju(formData) {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error(
      'VITE_GEMINI_API_KEY가 없습니다. 프로젝트 루트 .env 파일을 확인한 뒤 개발 서버를 다시 시작해 주세요.',
    )
  }

  const ai = new GoogleGenAI({ apiKey })
  const userPrompt = buildSajuUserPrompt(formData)

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: SAJU_SYSTEM_INSTRUCTION,
      },
    })

    const text = response.text?.trim()
    if (!text) {
      throw new Error('Gemini 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.')
    }

    return text
  } catch (err) {
    throw new Error(formatGeminiError(err))
  }
}
