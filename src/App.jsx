import { useMemo, useState } from 'react'
import dragonBg from './assets/dragon-bg.png'
import { analyzeSaju } from './claude.js'
import './App.css'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1920 + 1 }, (_, i) => CURRENT_YEAR - i)
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

function daysInMonth(year, month) {
  if (!year || !month) return 31
  return new Date(year, month, 0).getDate()
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

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
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [hour, setHour] = useState('')
  const [minute, setMinute] = useState('')
  const [gender, setGender] = useState('') // 'male' | 'female'
  const [calendarType, setCalendarType] = useState('solar') // 'solar' | 'lunar'

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  const dayOptions = useMemo(() => {
    const max = daysInMonth(Number(year), Number(month))
    return Array.from({ length: max }, (_, i) => i + 1)
  }, [year, month])

  function handleMonthOrYearChange(nextYear, nextMonth) {
    const max = daysInMonth(Number(nextYear), Number(nextMonth))
    if (day && Number(day) > max) setDay(String(max))
  }

  async function handleAnalyze() {
    if (!name.trim() || !year || !month || !day || hour === '' || minute === '' || !gender) {
      setError('이름, 생년월일, 태어난 시간, 성별을 모두 입력해 주세요.')
      return
    }

    const birthDate = `${year}-${pad2(month)}-${pad2(day)}`
    const birthTime = `${pad2(hour)}:${pad2(minute)}`

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
      setError(err?.message || '사주 해석 중 오류가 발생했습니다.')
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

        <fieldset className="select-fieldset">
          <legend>생년월일</legend>
          <div className="select-row">
            <label className="select-label" htmlFor="birthYear">
              <select
                id="birthYear"
                value={year}
                onChange={(e) => {
                  const next = e.target.value
                  setYear(next)
                  handleMonthOrYearChange(next, month)
                }}
              >
                <option value="">년</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
            </label>
            <label className="select-label" htmlFor="birthMonth">
              <select
                id="birthMonth"
                value={month}
                onChange={(e) => {
                  const next = e.target.value
                  setMonth(next)
                  handleMonthOrYearChange(year, next)
                }}
              >
                <option value="">월</option>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}월
                  </option>
                ))}
              </select>
            </label>
            <label className="select-label" htmlFor="birthDay">
              <select
                id="birthDay"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              >
                <option value="">일</option>
                {dayOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}일
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="select-fieldset">
          <legend>태어난 시간</legend>
          <div className="select-row">
            <label className="select-label" htmlFor="birthHour">
              <select
                id="birthHour"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
              >
                <option value="">시</option>
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {h}시
                  </option>
                ))}
              </select>
            </label>
            <label className="select-label" htmlFor="birthMinute">
              <select
                id="birthMinute"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
              >
                <option value="">분</option>
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m}분
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

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

        <button
          type="button"
          className="analyze-btn"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? '해석 중...' : '사주 해석하기'}
        </button>

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
