import { useState } from 'react'
import dragonBg from './assets/dragon-bg.png'
import {
  analyzeSaju,
  getStoredAccessPassword,
  unlockAccess,
} from './claude.js'
import './App.css'

const ACCESS_HINT = '동방 비밀번호'

/** 화면에 보이는 ##, **, * 같은 마크다운 기호를 제거합니다. */
function stripMarkdown(text) {
  return String(text || '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^[-*•]\s+/gm, '· ')
    .replace(/`([^`]+)`/g, '$1')
}

function App() {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('') // 예: 2004-09-07
  const [birthTime, setBirthTime] = useState('') // 예: 10:45
  const [gender, setGender] = useState('') // 'male' | 'female'
  const [calendarType, setCalendarType] = useState('solar') // 'solar' | 'lunar'

  const [accessPassword, setAccessPassword] = useState('')
  const [unlocked, setUnlocked] = useState(() => Boolean(getStoredAccessPassword()))
  const [unlocking, setUnlocking] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  async function handleUnlock() {
    if (!accessPassword.trim()) {
      setError('비밀번호를 입력해 주세요.')
      return
    }

    setUnlocking(true)
    setError('')
    try {
      await unlockAccess(accessPassword.trim())
      setUnlocked(true)
      setAccessPassword('')
    } catch (err) {
      setUnlocked(false)
      setError(err?.message || '비밀번호가 올바르지 않습니다.')
    } finally {
      setUnlocking(false)
    }
  }

  async function handleAnalyze() {
    if (!unlocked) {
      setError('비밀번호를 먼저 입력해 잠금을 해제해 주세요.')
      return
    }

    if (!name.trim() || !birthDate || !birthTime || !gender) {
      setError('이름, 생년월일, 태어난 시간, 성별을 모두 입력해 주세요.')
      return
    }

    setLoading(true)
    setError('')
    setResult('')

    try {
      const text = await analyzeSaju({
        name: name.trim(),
        birthDate,
        birthTime,
        gender,
        calendarType,
      })
      setResult(stripMarkdown(text))
    } catch (err) {
      console.error(err)
      const message = err?.message || '사주 해석 중 오류가 발생했습니다.'
      setError(message)
      if (message.includes('비밀번호')) {
        setUnlocked(false)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div
        className="app-bg"
        style={{ backgroundImage: `url(${dragonBg})` }}
        aria-hidden="true"
      />

      <div className="app-content">
        <h1>정보입력</h1>

        <label htmlFor="name">
          이름
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
          />
        </label>

        {/* 생년월일: type="date"면 달력으로 고를 수 있습니다 */}
        <label htmlFor="birthDate">
          생년월일
          <input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </label>

        {/* 태어난 시간: type="time"이면 시:분 형식입니다 */}
        <label htmlFor="birthTime">
          태어난 시간
          <input
            id="birthTime"
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
          />
        </label>

        <fieldset>
          <legend>성별</legend>
          <label className="radio-label">
            <input
              type="radio"
              name="gender"
              value="male"
              checked={gender === 'male'}
              onChange={(e) => setGender(e.target.value)}
            />
            남성
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="gender"
              value="female"
              checked={gender === 'female'}
              onChange={(e) => setGender(e.target.value)}
            />
            여성
          </label>
        </fieldset>

        <fieldset>
          <legend>양력 / 음력</legend>
          <label className="radio-label">
            <input
              type="radio"
              name="calendarType"
              value="solar"
              checked={calendarType === 'solar'}
              onChange={(e) => setCalendarType(e.target.value)}
            />
            양력
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="calendarType"
              value="lunar"
              checked={calendarType === 'lunar'}
              onChange={(e) => setCalendarType(e.target.value)}
            />
            음력
          </label>
        </fieldset>

        {!unlocked ? (
          <div className="access-lock">
            <label htmlFor="accessPassword">
              비밀번호
              <input
                id="accessPassword"
                type="password"
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUnlock()
                }}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
              />
            </label>
            <button
              type="button"
              className="analyze-btn"
              onClick={handleUnlock}
              disabled={unlocking}
            >
              {unlocking ? '확인 중...' : '잠금 해제'}
            </button>
            <button
              type="button"
              className="hint-toggle"
              onClick={() => setShowHint((v) => !v)}
            >
              {showHint ? '힌트 숨기기' : '힌트 보기'}
            </button>
            {showHint && <p className="hint-text">{ACCESS_HINT}</p>}
          </div>
        ) : (
          <button
            type="button"
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? '해석 중...' : '사주 해석하기'}
          </button>
        )}

        {error && <p className="error">{error}</p>}

        {loading && (
          <div className="result skeleton" aria-busy="true" aria-live="polite">
            <p className="skeleton-status">사주를 읽고 있습니다…</p>
            <div className="skeleton-block">
              <div className="skeleton-line title" />
              <div className="skeleton-line short" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line medium" />
            </div>
            <div className="skeleton-block">
              <div className="skeleton-line title" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
              <div className="skeleton-line medium" />
              <div className="skeleton-line" />
            </div>
            <div className="skeleton-block">
              <div className="skeleton-line title" />
              <div className="skeleton-line" />
              <div className="skeleton-line medium" />
              <div className="skeleton-line short" />
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="result" aria-live="polite">
            <pre className="result-text">{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
