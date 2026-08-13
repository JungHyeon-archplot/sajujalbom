/** 현무(북방·물·거북과 뱀)를 청나라풍 청색 + 금색 바람선으로 표현한 배경 */
export default function HyeonmuBackdrop() {
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

      <g
        transform="translate(200 390)"
        fill="none"
        stroke="#e8c86a"
        strokeOpacity="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="0" cy="0" rx="86" ry="66" strokeWidth="2" />
        <ellipse cx="0" cy="0" rx="58" ry="43" strokeWidth="1.2" strokeOpacity="0.42" />
        <path d="M-58 -14 L-30 -34 L2 -34 L30 -14 M-58 14 L-30 34 L2 34 L30 14 M-30 -34 L-30 34 M2 -34 L2 34"
          strokeWidth="1" strokeOpacity="0.4" />
        <path d="M-74 42 C -92 56, -96 70, -84 78 M74 42 C 92 56, 96 70, 84 78" strokeWidth="1.6" />
        <path d="M-74 -42 C -94 -54, -100 -66, -88 -74 M74 -42 C 94 -54, 100 -66, 88 -74" strokeWidth="1.6" />
        <path
          d="M-104 -70 C -30 -108, 60 -84, 104 -30 C 132 8, 96 74, 30 92 C -34 110, -104 74, -96 22"
          strokeWidth="2.4"
          strokeOpacity="0.62"
        />
        <path d="M-96 22 C -104 4, -92 -8, -78 -6 C -68 -4, -64 6, -70 14" strokeWidth="2.2" strokeOpacity="0.62" />
        <circle cx="-80" cy="2" r="1.8" fill="#e8c86a" fillOpacity="0.55" stroke="none" />
      </g>
    </svg>
  )
}
