import { FAN_SIZE } from '../lib/tarotDeck.js'

export default function TarotFan({ phase, cardForSlot, onPick }) {
  return (
    <div className="fan">
      {Array.from({ length: FAN_SIZE }, (_, slot) => {
        const card = cardForSlot(slot)
        return (
          <span key={slot} className="fan-slot" style={{ '--i': slot }}>
            <button
              type="button"
              className={`tarot-card${card ? ' is-picked' : ''}`}
              onClick={() => onPick(slot)}
              disabled={phase !== 'pick'}
              aria-label={card ? card.display : `카드 ${slot + 1}`}
            >
              <span className="tarot-card-inner">
                <span className="tarot-face tarot-back" />
                <span className="tarot-face tarot-front">
                  {card && (
                    <span
                      className={`tarot-art${card.reversed ? ' is-rev' : ''}`}
                    >
                      <img src={card.image} alt="" />
                    </span>
                  )}
                </span>
              </span>
            </button>
          </span>
        )
      })}
    </div>
  )
}
