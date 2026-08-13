import { useEffect, useMemo, useState } from 'react'
import { analyzeTarot } from './claude.js'
import { fetchAdminRecords, groupByName } from './admin.js'
import ProfileRail from './ProfileRail.jsx'
import ResultLoginGate from './ResultLoginGate.jsx'
import ResultMascot from './ResultMascot.jsx'
import { FAN_SIZE, SPREAD, describeCard, drawCardIds } from './tarotDeck.js'
import Toast from './Toast.jsx'
import { stripMarkdown } from './text.js'
import { useToast } from './useToast.js'

function teaserText(text) {
  const raw = String(text || '')
  const paras = raw.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  if (paras.length >= 2) {
    const keep = Math.max(1, Math.ceil(paras.length / 2))
    return {
      visible: paras.slice(0, keep).join('\n\n'),
      locked: keep < paras.length,
    }
  }
  const cut = Math.max(120, Math.ceil(raw.length / 2))
  return {
    visible: raw.slice(0, cut),
    locked: raw.length > cut,
  }
}

/** 마스터 계정에게만 보이는 기록 패널 */
function RecordPanel({ records }) {
  const groups = useMemo(() => groupByName(records), [records])
  const [openName, setOpenName] = useState(null)

  const opened = groups.find((g) => g.name === openName)

  return (
    <div className="tarot-admin" aria-label="기록">
      <h2 className="tarot-admin-title">기록 ({records.length})</h2>

      {groups.length === 0 ? (
        <p className="tarot-admin-empty">아직 기록이 없습니다.</p>
      ) : !opened ? (
        <ul className="tarot-admin-list">
          {groups.map((group) => (
            <li key={group.name}>
              <button
                type="button"
                className="tarot-admin-name"
                onClick={() => setOpenName(group.name)}
              >
                <span>{group.name}</span>
                <em>{group.rows.length}</em>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="tarot-admin-detail">
          <button
            type="button"
            className="tarot-admin-back"
            onClick={() => setOpenName(null)}
          >
            ← 이름 목록
          </button>
          <h3 className="tarot-admin-subtitle">{opened.name}</h3>

          {opened.rows.map((row) => (
            <article key={row.id} className="tarot-admin-entry">
              <p className="tarot-admin-date">
                {new Date(row.created_at).toLocaleString('ko-KR')}
              </p>
              <p className="tarot-admin-concern">
                {row.concern || '고민을 적지 않음'}
              </p>
              <p className="tarot-admin-cards">
                {(row.cards || [])
                  .map((c) => `${c.position}: ${c.card}`)
                  .join(' / ')}
              </p>
              <details>
                <summary>해석 보기</summary>
                <pre className="tarot-admin-result">{row.result}</pre>
              </details>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

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

export default function TarotPage({
  onBack,
  profile,
  onEditProfile,
  onSelect,
  isLoggedIn = false,
  initialResume = null,
  onResumeConsumed,
}) {
  // 화면에는 여러 장 중 고르는 것으로 보이지만, 실제로는 미리 뽑아 둔 번호를 순서대로 배정합니다.
  const [drawn, setDrawn] = useState(() =>
    initialResume?.drawn?.length
      ? initialResume.drawn
      : drawCardIds(SPREAD.length),
  )
  const [picked, setPicked] = useState(() =>
    initialResume?.result ? Array.from({ length: SPREAD.length }, (_, i) => i) : [],
  )
  const [phase, setPhase] = useState(() => (initialResume?.result ? 'done' : 'intro'))
  const [name, setName] = useState(() => initialResume?.name || '')
  const [concern, setConcern] = useState(() => initialResume?.concern || '')
  const [result, setResult] = useState(() => initialResume?.result || '')
  const [error, setError] = useState('')
  // 마스터 계정이 아니면 서버가 거절해서 계속 null로 남습니다.
  const [records, setRecords] = useState(null)
  const { toast, showToast } = useToast()

  useEffect(() => {
    if (!initialResume?.result) return
    onResumeConsumed?.()
    if (isLoggedIn) showToast('전체 결과를 확인할 수 있어요')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let active = true
    fetchAdminRecords().then((rows) => {
      if (active && rows) setRecords(rows)
    })
    return () => {
      active = false
    }
  }, [phase])

  useEffect(() => {
    if (profile?.name) setName((prev) => prev || profile.name)
  }, [profile])

  const done = picked.length === SPREAD.length
  const preview = !isLoggedIn && result ? teaserText(result) : { visible: result, locked: false }

  // 섞는 연출을 잠깐 보여준 뒤 카드를 펼칩니다.
  useEffect(() => {
    if (phase !== 'shuffle') return undefined
    const timer = setTimeout(() => setPhase('pick'), 1600)
    return () => clearTimeout(timer)
  }, [phase])

  function handlePick(slot) {
    if (phase !== 'pick') return
    if (picked.includes(slot)) {
      showToast('이미 고른 카드예요.')
      return
    }
    if (done) {
      showToast(`카드는 ${SPREAD.length}장까지만 고를 수 있어요.`)
      return
    }
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
      if (!isLoggedIn) {
        showToast('로그인하면 전체 결과를 볼 수 있어요')
      }
    } catch (err) {
      console.error(err)
      setError(err?.message || '타로 해석 중 오류가 발생했습니다.')
      setPhase('pick')
    }
  }

  function handleReset() {
    showToast('카드를 다시 섞을게요.')
    setDrawn(drawCardIds(SPREAD.length))
    setPicked([])
    setResult('')
    setError('')
    setPhase('shuffle')
  }

  return (
    <div className="tarot">
      <div className="tarot-table" aria-hidden="true" />

      <ProfileRail
        theme="tarot"
        profile={profile}
        onEditProfile={onEditProfile}
        onSelect={onSelect}
        navLocked={phase === 'reading'}
      >
        {records ? (
          <RecordPanel records={records} />
        ) : (
          <p className="rail-hint">
            {isLoggedIn
              ? '타로는 매번 새로 뽑습니다. 사주 기록은 사주 화면에서 이어서 볼 수 있어요.'
              : '로그인하면 대기 없이 더 많이 볼 수 있고, 사주 기록도 저장됩니다.'}
          </p>
        )}
      </ProfileRail>

      <div className="tarot-content">
        <button type="button" className="back-btn back-btn-dark" onClick={onBack}>
          ← 처음으로
        </button>

        <header className="tarot-head">
          <h1>타로</h1>
          <p>
            {phase === 'intro'
              ? profile?.name
                ? `${profile.name}님, 요즘 마음에 걸리는 일을 알려주세요`
                : '이름과 요즘 마음에 걸리는 일을 알려주세요'
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
            <p className="tarot-reading-text">카드를 읽는 중…</p>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        {phase === 'done' && (
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
                    name: name.trim(),
                    concern: concern.trim(),
                    drawn,
                  }}
                />
              )}
              <p className="result-font-credit tarot-font-credit">
                글꼴 · 페어 큰부리새
              </p>
            </div>

            <button type="button" className="tarot-btn" onClick={handleReset}>
              다시 뽑기
            </button>
          </div>
        )}
      </div>

      <Toast toast={toast} />
    </div>
  )
}
