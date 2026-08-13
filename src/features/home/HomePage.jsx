import { useEffect, useState } from 'react'
import MascotCat from '../../components/mascot/MascotCat.jsx'
import { trackEvent } from '../../lib/analytics.js'
import { getSajuReadingCount, signInWithGoogle } from '../../lib/supabase.js'
import ProfileCat from '../profile/ProfileCat.jsx'
import { isProfileComplete, profileMetaLine } from '../profile/profile.js'
import DragonMark from './components/DragonMark.jsx'
import HyeonmuBackdrop from './components/HyeonmuBackdrop.jsx'
import TarotMark from './components/TarotMark.jsx'

export default function HomePage({
  authReady,
  session,
  profile,
  onSignOut,
  onEditProfile,
  onSelect,
}) {
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [sajuCount, setSajuCount] = useState(null)

  const userLabel =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email ||
    ''

  useEffect(() => {
    let active = true
    getSajuReadingCount()
      .then((count) => {
        if (active && count != null) setSajuCount(count)
      })
      .catch((err) => {
        console.error(err)
      })
    return () => {
      active = false
    }
  }, [])

  async function handleGoogleSignIn() {
    trackEvent('login_click', { method: 'google', location: 'home' })
    setGoogleLoading(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch (err) {
      console.error(err)
      setError(
        err?.message ||
          'Google 로그인을 시작하지 못했습니다. Supabase Google provider 설정을 확인해 주세요.',
      )
      setGoogleLoading(false)
    }
  }

  return (
    <div className="home">
      <HyeonmuBackdrop />

      <div className="home-content">
        <header className="home-head">
          <MascotCat className="mascot-home" />
          <h1>사주잘봄</h1>
          <p>오늘은 무엇을 보러 오셨나요</p>
        </header>

        <div className="choice-row">
          <button
            type="button"
            className="choice choice-saju"
            onClick={() => onSelect('saju')}
          >
            <DragonMark />
            <span className="choice-title">사주</span>
            <span className="choice-sub">타고난 기운을 읽다</span>
          </button>

          <button
            type="button"
            className="choice choice-tarot"
            onClick={() => onSelect('tarot')}
          >
            <TarotMark />
            <span className="choice-title">타로</span>
            <span className="choice-sub">지금의 흐름을 묻다</span>
          </button>
        </div>

        {session ? (
          <div className="home-unlocked-row">
            <button
              type="button"
              className="home-profile-chip"
              onClick={onEditProfile}
            >
              <span className="home-profile-avatar">
                <ProfileCat gender={profile?.gender} />
              </span>
              <span className="home-profile-copy">
                <strong>{profile?.name || userLabel || '내 정보'}</strong>
                <em>
                  {isProfileComplete(profile)
                    ? profileMetaLine(profile)
                    : '정보를 입력하면 사주와 타로에 쓰입니다'}
                </em>
              </span>
            </button>
            <p className="home-unlocked">원하는 쪽을 선택하세요</p>
            <div className="home-account-actions">
              <button
                type="button"
                className="home-signout-btn"
                onClick={onEditProfile}
              >
                내 정보
              </button>
              <button
                type="button"
                className="home-signout-btn"
                onClick={onSignOut}
              >
                로그아웃
              </button>
            </div>
          </div>
        ) : (
          <div className="home-guest-row">
            <p className="home-unlocked">로그인 없이 바로 시작할 수 있어요</p>
            <button
              type="button"
              className="home-google-btn home-google-btn-soft"
              onClick={handleGoogleSignIn}
              disabled={!authReady || googleLoading}
            >
              {googleLoading ? 'Google로 이동 중...' : 'Google로 로그인'}
            </button>
            <p className="home-lock-note">
              로그인하면 전체 결과 저장·공유와 추가 해석이 열려요.
            </p>
          </div>
        )}

        {error && <p className="home-error">{error}</p>}

        {sajuCount != null && sajuCount > 0 && (
          <p className="home-stat" aria-live="polite">
            지금까지 총{' '}
            <strong>{sajuCount.toLocaleString('ko-KR')}</strong>
            개의 사주가 생성되었습니다
          </p>
        )}
      </div>
    </div>
  )
}
