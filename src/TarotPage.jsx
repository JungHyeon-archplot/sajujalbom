import { useEffect, useState } from 'react'
import { analyzeTarot } from './claude.js'
import { FAN_SIZE, SPREAD, describeCard, drawCardIds } from './tarotDeck.js'
import { stripMarkdown } from './text.js'

/** 유리구슬 — 해석 중 빛이 도는 연출 */
function CrystalBall() {
  return (
    <div className="crystal-wrap" aria-hidden="true">
      <div className="crystal-glow" />
      <div className="crystal-ball">
        <div className="crystal-swirl" />
        <div className="crystal-spark" />
        <div className="crystal-shine" />
      </div>
      <div className="crystal-stand" />
    </div>
  )
}

export default function TarotPage({ onBack }) {
  // 화면에는 여러 장 중 고르는 것으로 보이지만, 실제로는 미리 뽑아 둔 번호를 순서대로 배정합니다.
  const [drawn, setDrawn] = useState(() => drawCardIds(SPREAD.length))
  const [picked, setPicked] = useState([]) // 선택한 슬롯 index 순서
  const [phase, setPhase] = useState('intro') // 'intro' | 'pick' | 'reading' | 'done'
  const [name, setName] = useState('')
  const [concern, setConcern] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  const done = picked.length === SPREAD.length

  // 섞는 연출을 잠깐 보여준 뒤 카드를 펼칩니다.
  useEffect(() => {
    if (phase !== 'shuffle') return undefined
    const timer = setTimeout(() => setPhase('pick'), 1600)
    return () => clearTimeout(timer)
  }, [phase])

  function handlePick(slot) {
    if (phase !== 'pick' || picked.includes(slot) || done) return
    setPicked((prev) => [...prev, slot])
  }

  function cardForSlot(slot) {
    const order = picked.indexOf(slot)
    if (order === -1) return null
    return { ...describeCard(drawn[order]), position: SPREAD[order] }
  }

  function handleStart() {
    if (!name.trim()) {
      setError('이름을 입력해 주세요.')
      return
    }
    setError('')
    setPhase('shuffle')
  }

  async function handleRead() {
    setPhase('reading')
    setError('')
    setResult('')
    try {
      const text = await analyzeTarot(drawn, {
        name: name.trim(),
        concern: concern.trim(),
      })
      setResult(stripMarkdown(text))
      setPhase('done')
    } catch (err) {
      console.error(err)
      setError(err?.message || '타로 해석 중 오류가 발생했습니다.')
      setPhase('pick')
    }
  }

  function handleReset() {
    setDrawn(drawCardIds(SPREAD.length))
    setPicked([])
    setResult('')
    setError('')
    setPhase('shuffle')
  }

  return (
    <div className="tarot">
      <div className="tarot-table" aria-hidden="true" />

      <div className="tarot-content">
        <button type="button" className="back-btn back-btn-dark" onClick={onBack}>
          ← 처음으로
        </button>

        <header className="tarot-head">
          <h1>타로</h1>
          <p>
            {phase === 'intro'
              ? '이름과 요즘 마음에 걸리는 일을 알려주세요'
              : phase === 'shuffle'
                ? '카드를 섞고 있습니다…'
                : phase === 'pick' && !done
                  ? `마음이 가는 카드를 ${SPREAD.length - picked.length}장 더 고르세요`
                  : phase === 'reading'
                    ? '카드를 읽고 있습니다…'
                    : '뽑힌 카드입니다'}
          </p>
        </header>

        {phase === 'intro' && (
          <div className="tarot-intro">
            <label htmlFor="tarotName">
              이름
              <input
                id="tarotName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
              />
            </label>

            <label htmlFor="tarotConcern">
              요즘 고민 (한 줄, 선택)
              <input
                id="tarotConcern"
                type="text"
                value={concern}
                onChange={(e) => setConcern(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleStart()
                }}
                placeholder="예: 진로를 정하기가 어려워요"
                maxLength={60}
              />
            </label>

            <button type="button" className="tarot-btn" onClick={handleStart}>
              카드 펼치기
            </button>
          </div>
        )}

        {phase === 'shuffle' && (
          <div className="shuffle-stack" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className="shuffle-card" style={{ '--i': i }} />
            ))}
          </div>
        )}

        {(phase === 'pick' || phase === 'reading') && (
          <div className="fan">
            {Array.from({ length: FAN_SIZE }, (_, slot) => {
              const card = cardForSlot(slot)
              return (
                <span key={slot} className="fan-slot" style={{ '--i': slot }}>
                  <button
                    type="button"
                    className={`tarot-card${card ? ' is-picked' : ''}`}
                    onClick={() => handlePick(slot)}
                    disabled={phase !== 'pick' || (done && !card)}
                    aria-label={card ? card.display : `카드 ${slot + 1}`}
                  >
                    <span className="tarot-card-inner">
                      <span className="tarot-face tarot-back" />
                      <span className="tarot-face tarot-front">
                        {card && (
                          <>
                            <span
                              className={`tarot-art${card.reversed ? ' is-rev' : ''}`}
                            >
                              <img src={card.image} alt="" />
                            </span>
                            <span className="tarot-name">{card.name}</span>
                            <span
                              className={`tarot-dir${card.reversed ? ' is-rev' : ''}`}
                            >
                              {card.orientation}
                            </span>
                          </>
                        )}
                      </span>
                    </span>
                  </button>
                </span>
              )
            })}
          </div>
        )}

        {phase === 'pick' && (
          <button
            type="button"
            className="tarot-btn"
            onClick={handleRead}
            disabled={!done}
          >
            {done ? '카드 해석하기' : `${picked.length} / ${SPREAD.length} 선택`}
          </button>
        )}

        {phase === 'reading' && (
          <div className="tarot-reading" aria-busy="true" aria-live="polite">
            <CrystalBall />
            <p className="tarot-reading-text">구슬 속에서 답을 찾는 중…</p>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        {phase === 'done' && (
          <>
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

            <div className="result tarot-result" aria-live="polite">
              <pre className="result-text">{result}</pre>
            </div>

            <button type="button" className="tarot-btn" onClick={handleReset}>
              다시 뽑기
            </button>
          </>
        )}
      </div>
    </div>
  )
}
