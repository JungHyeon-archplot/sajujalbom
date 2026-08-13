/** 사주 카드에 들어가는 동양 용 — 흰 바탕 위 금·먹 선화 */
export default function DragonMark() {
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
        <path
          d="M22 84 C 34 66, 22 48, 38 36 C 54 24, 76 30, 84 44 C 92 58, 82 72, 68 72 C 58 72, 52 64, 56 56"
          strokeWidth="4.2"
        />
        <path
          d="M34 60 l-7 -5 M40 48 l-8 -4 M50 38 l-6 -7 M63 32 l-3 -8 M77 36 l1 -8"
          strokeWidth="2"
          strokeOpacity="0.75"
        />
        <path d="M22 84 C 18 92, 26 98, 34 94" strokeWidth="3" />
        <path d="M74 56 c 7 2, 11 8, 10 14 M70 60 c 5 4, 6 9, 4 13" strokeWidth="2.2" />
        <path d="M84 44 c 6 -6, 14 -6, 18 -1 M88 38 c 2 -7, -2 -12, -7 -13" strokeWidth="2.2" />
        <circle cx="82" cy="47" r="2.1" fill="#6d4f14" stroke="none" />
        <path
          d="M16 40 c 6 -6, 16 -4, 18 3 M14 48 c 8 -3, 14 0, 16 4 M88 88 c 8 -5, 16 -2, 18 4"
          strokeWidth="1.8"
          strokeOpacity="0.5"
        />
      </g>
    </svg>
  )
}
