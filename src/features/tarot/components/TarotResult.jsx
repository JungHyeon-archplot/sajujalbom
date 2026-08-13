import ResultLoginGate from '../../../components/result/ResultLoginGate.jsx'
import ResultMascot from '../../../components/mascot/ResultMascot.jsx'
import { SPREAD, describeCard } from '../lib/tarotDeck.js'

export default function TarotResult({
  drawn,
  result,
  preview,
  name,
  concern,
  onReset,
}) {
  return (
    <div className="tarot-done-block">
      <ResultMascot tone="tarot" />

      <ul className="drawn-list">
        {drawn.map((draw, i) => {
          const card = describeCard(draw)
          return (
            <li key={draw.id} className="drawn-item">
              <img
                className={`drawn-art${card.reversed ? ' is-rev' : ''}`}
                src={card.image}
                alt=""
              />
              <span className="drawn-text">
                <span className="drawn-pos">{SPREAD[i].label}</span>
                <span className="drawn-name">
                  {card.name}
                  <em className={card.reversed ? 'is-rev' : ''}>
                    {card.orientation}
                  </em>
                </span>
              </span>
            </li>
          )
        })}
      </ul>

      <div
        className={`result tarot-result${preview.locked ? ' is-locked' : ''}`}
        aria-live="polite"
      >
        <pre className="result-text">{preview.visible}</pre>
        {preview.locked && (
          <ResultLoginGate
            resumePayload={{
              view: 'tarot',
              result,
              name,
              concern,
              drawn,
            }}
          />
        )}
        <p className="result-font-credit tarot-font-credit">
          글꼴 · 프리텐다드
        </p>
      </div>

      <button type="button" className="tarot-btn" onClick={onReset}>
        다시 뽑기
      </button>
    </div>
  )
}
