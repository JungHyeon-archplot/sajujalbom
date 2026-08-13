import { useId } from 'react'

/**
 * 성별에 따라 달라지는 프로필 고양이.
 * 남성: 먹색 턱시도 + 금빛 이마띠
 * 여성: 삼색 + 모란 장식
 * 미입력: 민화풍 기본 묘선
 */
export default function ProfileCat({ gender = '', className = '' }) {
  const uid = useId().replace(/:/g, '')
  const kind = gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'neutral'
  const haloId = `pcHalo-${uid}`
  const furId = `pcFur-${uid}`
  const skyId = `pcSky-${uid}`
  const inkId = `pcInk-${uid}`
  const patchId = `pcPatch-${uid}`

  const palettes = {
    male: {
      sky0: '#16324a',
      sky1: '#2a5e6e',
      halo: '#f0d98c',
      fur0: '#f3ead6',
      fur1: '#cfc3a8',
      patch: '#3d3a38',
      eyes: '#c9a227',
      eyesInner: '#f3e0a4',
      pupil: '#2a220c',
      nose: '#b07a6a',
    },
    female: {
      sky0: '#6a3140',
      sky1: '#d48a8a',
      halo: '#f6c9d0',
      fur0: '#fff6e8',
      fur1: '#f0d7b4',
      patch: '#d4566a',
      eyes: '#3f7d4a',
      eyesInner: '#7cc98a',
      pupil: '#17301c',
      nose: '#d99a95',
    },
    neutral: {
      sky0: '#1b4a63',
      sky1: '#2f7f8c',
      halo: '#ffe9a8',
      fur0: '#f6ecd8',
      fur1: '#d6c096',
      patch: '#a8814a',
      eyes: '#3f7d4a',
      eyesInner: '#7cc98a',
      pupil: '#17301c',
      nose: '#d99a95',
    },
  }

  const p = palettes[kind]

  return (
    <svg
      viewBox="0 0 160 160"
      className={`profile-cat ${className}`.trim()}
      role="img"
      aria-label={
        kind === 'male'
          ? '남성 프로필 고양이'
          : kind === 'female'
            ? '여성 프로필 고양이'
            : '프로필 고양이'
      }
    >
      <defs>
        <clipPath id={`pcClip-${uid}`}>
          <circle cx="80" cy="80" r="78" />
        </clipPath>
        <radialGradient id={haloId} cx="50%" cy="42%" r="48%">
          <stop offset="0%" stopColor={p.halo} stopOpacity="0.95" />
          <stop offset="70%" stopColor={p.halo} stopOpacity="0.18" />
          <stop offset="100%" stopColor={p.halo} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.sky0} />
          <stop offset="100%" stopColor={p.sky1} />
        </linearGradient>
        <linearGradient id={furId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.fur0} />
          <stop offset="100%" stopColor={p.fur1} />
        </linearGradient>
        <linearGradient id={inkId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8a6a1f" />
          <stop offset="55%" stopColor="#caa64a" />
          <stop offset="100%" stopColor="#6d4f14" />
        </linearGradient>
        <linearGradient id={patchId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={p.patch} stopOpacity="0.92" />
          <stop offset="100%" stopColor={p.patch} stopOpacity="0.55" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#pcClip-${uid})`}>
        <rect width="160" height="160" fill={`url(#${skyId})`} />
        <circle cx="80" cy="72" r="54" fill={`url(#${haloId})`} />

        {kind === 'male' && (
          <g opacity="0.55" fill="none" stroke="#f0d98c" strokeWidth="1.4">
            <path d="M-4 128 L36 86 L76 128" />
            <path d="M84 128 L124 78 L168 128" />
          </g>
        )}

        {kind === 'female' && (
          <g className="mascot-clouds" fill="none" stroke="#f6e4c8" strokeOpacity="0.7" strokeWidth="1.6">
            <path d="M8 48 c 8 -8, 20 -5, 22 4 c 8 -3, 16 2, 16 8" />
            <path d="M122 42 c 8 -7, 20 -4, 22 4 c 8 -4, 14 1, 14 7" />
          </g>
        )}

        {kind === 'neutral' && (
          <g opacity="0.7">
            <path d="M-6 132 L32 92 L70 132 Z" fill="#1b4a63" />
            <path d="M92 132 L128 86 L168 132 Z" fill="#1b4a63" />
          </g>
        )}

        {/* 몸통 */}
        <path
          d="M42 150 C 40 112, 52 92, 80 90 C 108 92, 120 112, 118 150 Z"
          fill={`url(#${furId})`}
          stroke={`url(#${inkId})`}
          strokeWidth="2"
        />

        {/* 귀 */}
        <path
          d="M48 78 L40 38 L74 62 Z"
          fill={`url(#${furId})`}
          stroke={`url(#${inkId})`}
          strokeWidth="2"
        />
        <path
          d="M112 78 L120 38 L86 62 Z"
          fill={`url(#${furId})`}
          stroke={`url(#${inkId})`}
          strokeWidth="2"
        />
        <path
          d="M50 70 L48 48 L66 60 Z M110 70 L112 48 L94 60 Z"
          fill={kind === 'female' ? '#f2b8bf' : '#e8b8b0'}
          stroke="none"
        />

        {kind === 'male' && (
          <>
            <path d="M42 58 L70 70 L48 78 Z" fill={`url(#${patchId})`} stroke="none" />
            <path d="M118 56 L90 70 L112 78 Z" fill={`url(#${patchId})`} stroke="none" />
            <path
              d="M58 58 H102"
              stroke="#e8c86a"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <circle cx="80" cy="58" r="3.2" fill="#f0d98c" stroke="#8a6a1f" strokeWidth="0.8" />
          </>
        )}

        {kind === 'female' && (
          <g className="mascot-peony">
            <circle cx="34" cy="52" r="11" fill="#d4566a" />
            <circle cx="34" cy="52" r="5.2" fill="#f2b8bf" />
            <path
              d="M26 64 c -5 -1, -9 -6, -8 -11 M44 62 c 5 -2, 8 -7, 7 -11"
              stroke="#3f7d4a"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        )}

        <ellipse
          cx="80"
          cy="86"
          rx="34"
          ry="30"
          fill={`url(#${furId})`}
          stroke={`url(#${inkId})`}
          strokeWidth="2"
        />

        {kind === 'male' && (
          <ellipse cx="80" cy="108" rx="16" ry="10" fill={`url(#${patchId})`} />
        )}

        {kind === 'female' && (
          <>
            <ellipse cx="58" cy="100" rx="10" ry="8" fill="#e8b07a" opacity="0.85" />
            <ellipse cx="104" cy="78" rx="9" ry="7" fill="#d4566a" opacity="0.55" />
          </>
        )}

        <g className="mascot-eyes">
          <ellipse cx="66" cy="86" rx="8" ry="9" fill={p.eyes} />
          <ellipse cx="94" cy="86" rx="8" ry="9" fill={p.eyes} />
          <ellipse cx="66" cy="86" rx="6" ry="7" fill={p.eyesInner} />
          <ellipse cx="94" cy="86" rx="6" ry="7" fill={p.eyesInner} />
          <ellipse cx="66" cy="86" rx="2" ry="7" fill={p.pupil} />
          <ellipse cx="94" cy="86" rx="2" ry="7" fill={p.pupil} />
          <circle cx="63.6" cy="82.6" r="1.5" fill="#fffdf3" />
          <circle cx="91.6" cy="82.6" r="1.5" fill="#fffdf3" />
        </g>

        <path d="M76 98 L80 102 L84 98 Z" fill={p.nose} />
        <path
          d="M80 102 v4 M80 106 c -3 4, -8 3, -9 0 M80 106 c 3 4, 8 3, 9 0"
          fill="none"
          stroke={`url(#${inkId})`}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M48 90 l-16 -4 M48 96 l-16 2 M112 90 l16 -4 M112 96 l16 2"
          fill="none"
          stroke={`url(#${inkId})`}
          strokeWidth="1.2"
          strokeOpacity="0.55"
          strokeLinecap="round"
        />

        {kind === 'male' && (
          <g>
            <path
              d="M56 128 C 62 122, 98 122, 104 128"
              fill="none"
              stroke="#2c2926"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx="80" cy="132" r="4.5" fill="#e8c86a" stroke="#8a6a1f" strokeWidth="1" />
          </g>
        )}

        {kind === 'female' && (
          <path
            d="M58 128 C 70 122, 90 122, 102 128"
            fill="none"
            stroke="#d4566a"
            strokeWidth="3.2"
            strokeLinecap="round"
            opacity="0.85"
          />
        )}
      </g>

      <circle
        cx="80"
        cy="80"
        r="77"
        fill="none"
        stroke="#e8c86a"
        strokeWidth="3"
        strokeOpacity="0.85"
      />
    </svg>
  )
}
