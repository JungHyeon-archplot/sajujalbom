import { useState } from 'react'
import { signInWithGoogle } from './supabase.js'

/** 현무(북방·물·거북과 뱀)를 청나라풍 청색 + 금색 바람선으로 표현한 배경 */
function HyeonmuBackdrop() {
  return (
    <svg
      className="home-bg"
      viewBox="0 0 400 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b2545" />
          <stop offset="45%" stopColor="#12395f" />
          <stop offset="100%" stopColor="#071a30" />
        </linearGradient>
        <radialGradient id="glowGrad" cx="50%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#2f6f9e" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#0b2545" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b8860b" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#f0d98c" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#b8860b" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      <rect width="400" height="800" fill="url(#skyGrad)" />
      <rect width="400" height="800" fill="url(#glowGrad)" />

      {/* 금색 바람선 — 부드럽게 흐르는 곡선 */}
      <g
        fill="none"
        stroke="url(#goldGrad)"
        strokeLinecap="round"
        className="wind-lines"
      >
        <path d="M-40 150 C 80 90, 200 210, 330 140 S 470 90, 520 150" strokeWidth="1.6" />
        <path d="M-40 205 C 90 150, 210 265, 340 195 S 470 145, 520 205" strokeWidth="1" opacity="0.75" />
        <path d="M-40 560 C 90 500, 210 620, 340 550 S 470 500, 520 560" strokeWidth="1.4" />
        <path d="M-40 615 C 80 560, 200 675, 330 605 S 470 560, 520 615" strokeWidth="0.9" opacity="0.7" />
        <path d="M-40 700 C 100 650, 220 760, 350 690" strokeWidth="1.1" opacity="0.6" />
      </g>

      {/* 현무: 거북 등껍질을 뱀이 휘감은 형상 */}
      <g
        transform="translate(200 390)"
        fill="none"
        stroke="#e8c86a"
        strokeOpacity="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* 등껍질 */}
        <ellipse cx="0" cy="0" rx="86" ry="66" strokeWidth="2" />
        <ellipse cx="0" cy="0" rx="58" ry="43" strokeWidth="1.2" strokeOpacity="0.42" />
        {/* 등껍질 육각 무늬 */}
        <path d="M-58 -14 L-30 -34 L2 -34 L30 -14 M-58 14 L-30 34 L2 34 L30 14 M-30 -34 L-30 34 M2 -34 L2 34"
          strokeWidth="1" strokeOpacity="0.4" />
        {/* 다리 */}
        <path d="M-74 42 C -92 56, -96 70, -84 78 M74 42 C 92 56, 96 70, 84 78" strokeWidth="1.6" />
        <path d="M-74 -42 C -94 -54, -100 -66, -88 -74 M74 -42 C 94 -54, 100 -66, 88 -74" strokeWidth="1.6" />
        {/* 뱀이 휘감는 곡선 */}
        <path
          d="M-104 -70 C -30 -108, 60 -84, 104 -30 C 132 8, 96 74, 30 92 C -34 110, -104 74, -96 22"
          strokeWidth="2.4"
          strokeOpacity="0.62"
        />
        {/* 뱀 머리 */}
        <path d="M-96 22 C -104 4, -92 -8, -78 -6 C -68 -4, -64 6, -70 14" strokeWidth="2.2" strokeOpacity="0.62" />
        <circle cx="-80" cy="2" r="1.8" fill="#e8c86a" fillOpacity="0.55" stroke="none" />
      </g>
    </svg>
  )
}

/** 사주 카드에 들어가는 동양 용 — 흰 바탕 위 금·먹 선화 */
function DragonMark() {
  return (
    <svg viewBox="0 0 120 120" className="choice-art" aria-hidden="true">
      <defs>
        <linearGradient id="dragonInk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8a6a1f" />
          <stop offset="55%" stopColor="#caa64a" />
          <stop offset="100%" stopColor="#6d4f14" />
        </linearGradient>
      </defs>
      <g
        fill="none"
        stroke="url(#dragonInk)"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* 몸통: S자로 감기는 형태 */}
        <path
          d="M22 84 C 34 66, 22 48, 38 36 C 54 24, 76 30, 84 44 C 92 58, 82 72, 68 72 C 58 72, 52 64, 56 56"
          strokeWidth="4.2"
        />
        {/* 등지느러미 */}
        <path
          d="M34 60 l-7 -5 M40 48 l-8 -4 M50 38 l-6 -7 M63 32 l-3 -8 M77 36 l1 -8"
          strokeWidth="2"
          strokeOpacity="0.75"
        />
        {/* 꼬리 */}
        <path d="M22 84 C 18 92, 26 98, 34 94" strokeWidth="3" />
        {/* 앞발 */}
        <path d="M74 56 c 7 2, 11 8, 10 14 M70 60 c 5 4, 6 9, 4 13" strokeWidth="2.2" />
        {/* 머리·수염 */}
        <path d="M84 44 c 6 -6, 14 -6, 18 -1 M88 38 c 2 -7, -2 -12, -7 -13" strokeWidth="2.2" />
        <circle cx="82" cy="47" r="2.1" fill="#6d4f14" stroke="none" />
        {/* 구름 */}
        <path
          d="M16 40 c 6 -6, 16 -4, 18 3 M14 48 c 8 -3, 14 0, 16 4 M88 88 c 8 -5, 16 -2, 18 4"
          strokeWidth="1.8"
          strokeOpacity="0.5"
        />
      </g>
    </svg>
  )
}

/** 타로 카드에 들어가는 달·별 문양 */
function TarotMark() {
  return (
    <svg viewBox="0 0 120 120" className="choice-art" aria-hidden="true">
      <g fill="none" stroke="#f3e3ff" strokeLinecap="round" strokeLinejoin="round">
        {/* 카드 세 장 */}
        <rect x="18" y="34" width="34" height="52" rx="4" strokeWidth="2.4" transform="rotate(-14 35 60)" opacity="0.65" />
        <rect x="43" y="30" width="34" height="52" rx="4" strokeWidth="2.6" opacity="0.85" />
        <rect x="68" y="34" width="34" height="52" rx="4" strokeWidth="2.4" transform="rotate(14 85 60)" opacity="0.65" />
        {/* 가운데 카드의 달과 별 */}
        <path d="M66 47 a 11 11 0 1 0 8 15 a 9 9 0 0 1 -8 -15 z" strokeWidth="2" fill="#f6ecff" fillOpacity="0.22" />
        <path d="M55 68 l2.2 4.6 l5 0.7 l-3.6 3.5 l0.9 5 l-4.5 -2.4 l-4.5 2.4 l0.9 -5 l-3.6 -3.5 l5 -0.7 z"
          strokeWidth="1.4" fill="#f6ecff" fillOpacity="0.3" />
      </g>
      {/* 반짝임 */}
      <g fill="#fff8ff">
        <circle cx="28" cy="26" r="1.6" opacity="0.9" />
        <circle cx="96" cy="30" r="1.2" opacity="0.75" />
        <circle cx="104" cy="82" r="1.5" opacity="0.8" />
        <circle cx="22" cy="92" r="1.2" opacity="0.7" />
      </g>
    </svg>
  )
}

export default function HomePage({
  unlocked,
  authReady,
  session,
  profile,
  onSignOut,
  onEditProfile,
  onSelect,
}) {
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const userLabel =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email ||
    ''

  async function handleGoogleSignIn() {
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

  function handleChoice(kind) {
    if (!unlocked) {
      setError('먼저 Google 로그인을 해 주세요.')
      return
    }
    onSelect(kind)
  }

  return (
    <div className="home">
      <HyeonmuBackdrop />

      <div className="home-content">
        <header className="home-head">
          <h1>사주잘봄</h1>
          <p>오늘은 무엇을 보러 오셨나요</p>
        </header>

        <div className="choice-row">
          <button
            type="button"
            className="choice choice-saju"
            onClick={() => handleChoice('saju')}
            disabled={!unlocked}
          >
            <DragonMark />
            <span className="choice-title">사주</span>
            <span className="choice-sub">타고난 기운을 읽다</span>
          </button>

          <button
            type="button"
            className="choice choice-tarot"
            onClick={() => handleChoice('tarot')}
            disabled={!unlocked}
          >
            <TarotMark />
            <span className="choice-title">타로</span>
            <span className="choice-sub">지금의 흐름을 묻다</span>
          </button>
        </div>

        {!unlocked ? (
          <div className="home-lock">
            <button
              type="button"
              className="home-google-btn"
              onClick={handleGoogleSignIn}
              disabled={!authReady || googleLoading}
            >
              {googleLoading ? 'Google로 이동 중...' : 'Google로 로그인'}
            </button>

            <p className="home-lock-note">
              Google 계정으로 로그인하면 바로 시작할 수 있습니다.
            </p>
          </div>
        ) : (
          <div className="home-unlocked-row">
            <p className="home-unlocked">
              {`${profile?.name || userLabel}님, 원하는 쪽을 선택하세요.`}
            </p>
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
        )}

        {error && <p className="home-error">{error}</p>}
      </div>
    </div>
  )
}
