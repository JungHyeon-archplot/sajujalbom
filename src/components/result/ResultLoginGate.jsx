import { useState } from 'react'
import { trackEvent } from '../../lib/analytics.js'
import { stashGuestResume } from '../../lib/guestResume.js'
import { signInWithGoogle } from '../../lib/supabase.js'

/** 비로그인 결과 하단에 붙는 로그인 유도 */
export default function ResultLoginGate({
  message = '나머지 해석은 Google 로그인 후 확인할 수 있어요.',
  resumePayload = null,
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    trackEvent('login_click', {
      method: 'google',
      location: 'result_gate',
      service: resumePayload?.view || 'unknown',
    })
    setLoading(true)
    setError('')
    try {
      if (resumePayload) stashGuestResume(resumePayload)
      await signInWithGoogle()
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Google 로그인을 시작하지 못했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="result-lock">
      <div className="result-lock-fade" aria-hidden="true" />
      <div className="result-lock-panel">
        <p className="result-lock-message">{message}</p>
        <button
          type="button"
          className="result-lock-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Google로 이동 중...' : 'Google로 로그인하고 전체 보기'}
        </button>
        <p className="result-lock-note">
          로그인하면 결과 저장·공유와 추가 해석도 바로 이용할 수 있어요.
        </p>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  )
}
