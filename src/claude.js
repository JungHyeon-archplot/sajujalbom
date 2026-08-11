import { SAJU_SYSTEM_INSTRUCTION, buildSajuUserPrompt } from './sajuPrompt.js'

const ACCESS_STORAGE_KEY = 'saju_access_password'

function isNetlifyHost() {
  return (
    typeof window !== 'undefined' &&
    /netlify\.app$/i.test(window.location.hostname)
  )
}

function getUnlockUrl() {
  return isNetlifyHost() ? '/.netlify/functions/unlock' : '/api/unlock'
}

function getAnalyzeUrl() {
  return isNetlifyHost()
    ? '/.netlify/functions/analyze-saju'
    : '/api/analyze-saju'
}

export function getStoredAccessPassword() {
  try {
    return sessionStorage.getItem(ACCESS_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function storeAccessPassword(password) {
  try {
    sessionStorage.setItem(ACCESS_STORAGE_KEY, password)
  } catch {
    // ignore
  }
}

export function clearAccessPassword() {
  try {
    sessionStorage.removeItem(ACCESS_STORAGE_KEY)
  } catch {
    // ignore
  }
}

/** 서버에서 비밀번호를 확인합니다. */
export async function unlockAccess(password) {
  const response = await fetch(getUnlockUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error || '비밀번호가 올바르지 않습니다.')
  }

  storeAccessPassword(password)
  return true
}

/**
 * Claude 해석을 요청합니다.
 * 서버는 타임아웃 방지를 위해 스트림으로 보내지만,
 * 여기서는 전체를 모은 뒤 완성된 텍스트만 반환합니다.
 */
export async function analyzeSaju(formData) {
  const password = getStoredAccessPassword()
  if (!password) {
    throw new Error('비밀번호 인증이 필요합니다. 먼저 잠금을 해제해 주세요.')
  }

  const response = await fetch(getAnalyzeUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      password,
      system: SAJU_SYSTEM_INSTRUCTION,
      user: buildSajuUserPrompt(formData),
    }),
  })

  const raw = await response.text()
  const body = raw.replace(/^\u200b+/, '').trim()

  if (!response.ok) {
    if (response.status === 504) {
      throw new Error(
        '서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.',
      )
    }

    let message = `사주 해석 요청에 실패했습니다. (${response.status})`
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

    if (response.status === 401) {
      clearAccessPassword()
    }

    throw new Error(message)
  }

  if (!body) {
    throw new Error(
      'Claude 응답이 비어 있습니다. Netlify에 ANTHROPIC_API_KEY가 있는지, Claude Console 크레딧이 있는지 확인한 뒤 다시 시도해 주세요.',
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
