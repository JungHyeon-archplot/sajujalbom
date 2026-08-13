import MascotCat from './MascotCat.jsx'

/**
 * 결과 화면 상단의 묘선 — 손을 흔드는 짧은 인사.
 */
export default function ResultMascot({ tone = 'saju' }) {
  return (
    <div className={`result-mascot result-mascot-${tone}`} aria-hidden="true">
      <div className="result-mascot-fig">
        <MascotCat variant="buddy" className="mascot-buddy mascot-wave" />
      </div>
    </div>
  )
}
