const RESUME_KEY = 'sajujalbom:guest-resume'

/** 같은 페이지 로드 안에서는 한 번만 읽어 Strict Mode 재마운트에도 남깁니다. */
let memoryResume = undefined

/** Google 로그인 전에 보고 있던 화면·결과를 잠깐 보관합니다. */
export function stashGuestResume(payload) {
  memoryResume = undefined
  try {
    sessionStorage.setItem(
      RESUME_KEY,
      JSON.stringify({ ...payload, savedAt: Date.now() }),
    )
  } catch {
    // private mode 등에서는 무시
  }
}

function readStoredResume() {
  try {
    const raw = sessionStorage.getItem(RESUME_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    // 1시간 넘은 임시 값은 버립니다.
    if (!data?.savedAt || Date.now() - data.savedAt > 60 * 60 * 1000) {
      sessionStorage.removeItem(RESUME_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

/** 로그인 복귀 후 조회. 저장소에서는 지우지만 메모리에는 남겨 재마운트에 대비합니다. */
export function loadGuestResume() {
  if (memoryResume !== undefined) return memoryResume

  const data = readStoredResume()
  try {
    sessionStorage.removeItem(RESUME_KEY)
  } catch {
    // ignore
  }
  memoryResume = data
  return data
}

/** 홈으로 나가거나 다른 메뉴로 이동할 때 임시값을 비웁니다. */
export function clearGuestResume() {
  memoryResume = null
  try {
    sessionStorage.removeItem(RESUME_KEY)
  } catch {
    // ignore
  }
}

const claimedActions = new Set()

/** Strict Mode 재실행에도 저장 같은 부수효과를 한 번만 수행합니다. */
export function claimResumeAction(id) {
  if (!id || claimedActions.has(id)) return false
  claimedActions.add(id)
  return true
}
