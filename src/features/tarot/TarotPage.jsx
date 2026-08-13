import { useEffect, useState } from 'react'
import Toast from '../../components/toast/Toast.jsx'
import { useToast } from '../../components/toast/useToast.js'
import { trackEvent } from '../../lib/analytics.js'
import { analyzeTarot } from '../../lib/claude.js'
import { stripMarkdown } from '../../lib/text.js'
import ProfileRail from '../profile/ProfileRail.jsx'
import CrystalBall from './components/CrystalBall.jsx'
import RecordPanel from './components/RecordPanel.jsx'
import ShuffleStack from './components/ShuffleStack.jsx'
import TarotFan from './components/TarotFan.jsx'
import TarotIntro from './components/TarotIntro.jsx'
import TarotResult from './components/TarotResult.jsx'
import { fetchAdminRecords } from './lib/admin.js'
import { teaserText } from './lib/teaserText.js'
import { SPREAD, describeCard, drawCardIds } from './lib/tarotDeck.js'

export default function TarotPage({
  onBack,
  profile,
  onEditProfile,
  onSelect,
  isLoggedIn = false,
  initialResume = null,
  onResumeConsumed,
}) {
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
    trackEvent('tarot_start', { logged_in: isLoggedIn })
    setError('')
    setPhase('shuffle')
  }

  async function handleRead() {
    trackEvent('tarot_analyze', { logged_in: isLoggedIn })
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
      trackEvent('tarot_analyze_success', { logged_in: isLoggedIn })
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
    trackEvent('tarot_reset')
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
          <TarotIntro
            name={name}
            concern={concern}
            onNameChange={setName}
            onConcernChange={setConcern}
            onStart={handleStart}
          />
        )}

        {phase === 'shuffle' && <ShuffleStack />}

        {(phase === 'pick' || phase === 'reading') && (
          <TarotFan phase={phase} cardForSlot={cardForSlot} onPick={handlePick} />
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
          <TarotResult
            drawn={drawn}
            result={result}
            preview={preview}
            name={name.trim()}
            concern={concern.trim()}
            onReset={handleReset}
          />
        )}
      </div>

      <Toast toast={toast} />
    </div>
  )
}
