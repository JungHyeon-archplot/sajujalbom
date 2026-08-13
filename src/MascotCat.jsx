/**
 * 사주잘봄 마스코트 — 민화풍 삼색 고양이 '묘선(妙仙)'.
 * 해 후광, 청록 산, 상서로운 구름, 모란을 배경으로 앉아 있습니다.
 */
export default function MascotCat({ className = '' }) {
  return (
    <svg
      viewBox="0 0 200 220"
      className={`mascot ${className}`.trim()}
      role="img"
      aria-label="사주잘봄 마스코트 고양이"
    >
      <defs>
        <radialGradient id="mascotHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe9a8" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#f0d98c" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#e8c86a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mascotFur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6ecd8" />
          <stop offset="60%" stopColor="#e7d6b4" />
          <stop offset="100%" stopColor="#d6c096" />
        </linearGradient>
        <linearGradient id="mascotMountain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2f7f8c" />
          <stop offset="100%" stopColor="#1b4a63" />
        </linearGradient>
        <linearGradient id="mascotInk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8a6a1f" />
          <stop offset="55%" stopColor="#caa64a" />
          <stop offset="100%" stopColor="#6d4f14" />
        </linearGradient>
      </defs>

      {/* 해 후광 */}
      <circle className="mascot-halo" cx="100" cy="84" r="66" fill="url(#mascotHalo)" />
      <circle
        cx="100"
        cy="84"
        r="46"
        fill="none"
        stroke="#f0d98c"
        strokeOpacity="0.5"
        strokeWidth="1.2"
      />

      {/* 청록 산 */}
      <g opacity="0.75">
        <path d="M6 168 L40 118 L74 168 Z" fill="url(#mascotMountain)" />
        <path d="M126 168 L160 112 L196 168 Z" fill="url(#mascotMountain)" />
        <path
          d="M40 118 L52 136 M160 112 L172 132"
          stroke="#9fe0e6"
          strokeOpacity="0.45"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
      </g>

      {/* 상서로운 구름 */}
      <g
        className="mascot-clouds"
        fill="none"
        stroke="#f2e3bb"
        strokeOpacity="0.7"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M12 92 c 8 -9, 22 -6, 24 4 c 9 -4, 17 1, 17 8" />
        <path d="M16 104 c 10 -4, 18 -1, 22 4" />
        <path d="M188 96 c -8 -9, -22 -6, -24 4 c -9 -4, -17 1, -17 8" />
        <path d="M184 108 c -10 -4, -18 -1, -22 4" />
      </g>

      {/* 고양이 */}
      <g stroke="url(#mascotInk)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
        {/* 꼬리 */}
        <path
          d="M142 196 C 174 196, 182 164, 160 146 C 150 138, 138 144, 141 155"
          fill="url(#mascotFur)"
        />
        <path
          d="M152 188 l10 -3 M160 176 l9 -2 M160 160 l8 1"
          stroke="#a8814a"
          strokeOpacity="0.75"
          strokeWidth="2"
          fill="none"
        />

        {/* 몸통 */}
        <path
          d="M68 122 C 58 150, 58 184, 70 200 L 130 200 C 142 184, 142 150, 132 122 Z"
          fill="url(#mascotFur)"
        />
        {/* 가슴 무늬 */}
        <path
          d="M76 150 c 8 6, 16 8, 24 8 s 16 -2, 24 -8 M78 168 c 8 5, 15 7, 22 7 s 14 -2, 22 -7"
          stroke="#a8814a"
          strokeOpacity="0.6"
          strokeWidth="2"
          fill="none"
        />
        {/* 앞발 */}
        <path
          d="M80 200 c -1 -10, 3 -14, 10 -14 s 11 4, 10 14"
          fill="url(#mascotFur)"
        />
        <path
          d="M100 200 c -1 -10, 3 -14, 10 -14 s 11 4, 10 14"
          fill="url(#mascotFur)"
        />

        {/* 귀 */}
        <path d="M70 78 L64 46 L92 62 Z" fill="url(#mascotFur)" />
        <path d="M130 78 L136 46 L108 62 Z" fill="url(#mascotFur)" />
        <path
          d="M72 72 L70 55 L84 63 Z M128 72 L130 55 L116 63 Z"
          fill="#e8b8b0"
          stroke="none"
        />

        {/* 머리 */}
        <ellipse cx="100" cy="90" rx="35" ry="32" fill="url(#mascotFur)" />
        {/* 이마 줄무늬 */}
        <path
          d="M88 64 l4 12 M100 62 l0 13 M112 64 l-4 12 M74 84 l-9 -4 M126 84 l9 -4"
          stroke="#a8814a"
          strokeOpacity="0.8"
          strokeWidth="2"
          fill="none"
        />
      </g>

      {/* 눈 — 영험한 초록빛 */}
      <g className="mascot-eyes">
        <ellipse cx="86" cy="90" rx="8.5" ry="9.5" fill="#3f7d4a" />
        <ellipse cx="114" cy="90" rx="8.5" ry="9.5" fill="#3f7d4a" />
        <ellipse cx="86" cy="90" rx="6.5" ry="7.5" fill="#7cc98a" />
        <ellipse cx="114" cy="90" rx="6.5" ry="7.5" fill="#7cc98a" />
        <ellipse cx="86" cy="90" rx="2.1" ry="7.4" fill="#17301c" />
        <ellipse cx="114" cy="90" rx="2.1" ry="7.4" fill="#17301c" />
        <circle cx="83.4" cy="86.4" r="1.7" fill="#fffdf3" />
        <circle cx="111.4" cy="86.4" r="1.7" fill="#fffdf3" />
      </g>

      {/* 코·입·수염 */}
      <g
        stroke="url(#mascotInk)"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      >
        <path d="M96 102 L100 106 L104 102 Z" fill="#d99a95" strokeWidth="1.2" />
        <path d="M100 106 l0 4 M100 110 c -3 4, -8 3, -9 0 M100 110 c 3 4, 8 3, 9 0" />
        <path
          d="M66 96 l-18 -5 M66 102 l-18 1 M134 96 l18 -5 M134 102 l18 1"
          strokeOpacity="0.55"
          strokeWidth="1.3"
        />
      </g>

      {/* 모란 */}
      <g className="mascot-peony">
        <circle cx="30" cy="192" r="9" fill="#d4566a" opacity="0.9" />
        <circle cx="30" cy="192" r="4.5" fill="#f2b8bf" />
        <path
          d="M22 202 c -6 -2, -10 -7, -9 -12 M40 200 c 6 -3, 9 -8, 8 -12"
          stroke="#3f7d4a"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </g>

      {/* 낙관 */}
      <g>
        <rect
          x="166"
          y="14"
          width="20"
          height="20"
          rx="3"
          fill="#c0392b"
          opacity="0.92"
        />
        <path
          d="M170 20 h12 M170 24 h12 M176 18 v12"
          stroke="#fff4ec"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}
