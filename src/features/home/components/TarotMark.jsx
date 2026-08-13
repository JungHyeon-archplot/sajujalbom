/** 타로 카드에 들어가는 달·별 문양 */
export default function TarotMark() {
  return (
    <svg viewBox="0 0 120 120" className="choice-art" aria-hidden="true">
      <g fill="none" stroke="#f3e3ff" strokeLinecap="round" strokeLinejoin="round">
        <rect x="18" y="34" width="34" height="52" rx="4" strokeWidth="2.4" transform="rotate(-14 35 60)" opacity="0.65" />
        <rect x="43" y="30" width="34" height="52" rx="4" strokeWidth="2.6" opacity="0.85" />
        <rect x="68" y="34" width="34" height="52" rx="4" strokeWidth="2.4" transform="rotate(14 85 60)" opacity="0.65" />
        <path d="M66 47 a 11 11 0 1 0 8 15 a 9 9 0 0 1 -8 -15 z" strokeWidth="2" fill="#f6ecff" fillOpacity="0.22" />
        <path d="M55 68 l2.2 4.6 l5 0.7 l-3.6 3.5 l0.9 5 l-4.5 -2.4 l-4.5 2.4 l0.9 -5 l-3.6 -3.5 l5 -0.7 z"
          strokeWidth="1.4" fill="#f6ecff" fillOpacity="0.3" />
      </g>
      <g fill="#fff8ff">
        <circle cx="28" cy="26" r="1.6" opacity="0.9" />
        <circle cx="96" cy="30" r="1.2" opacity="0.75" />
        <circle cx="104" cy="82" r="1.5" opacity="0.8" />
        <circle cx="22" cy="92" r="1.2" opacity="0.7" />
      </g>
    </svg>
  )
}
