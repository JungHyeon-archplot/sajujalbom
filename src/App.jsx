import { useState } from 'react'
import dragonBg from './assets/dragon-bg.png'
import { analyzeSaju } from './claude.js'
import './App.css'

function App() {
  // 각 입력값을 따로 상태로 관리합니다.
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('') // 예: 1990-05-20
  const [birthTime, setBirthTime] = useState('') // 예: 14:30
  const [gender, setGender] = useState('') // 'male' | 'female'
  const [calendarType, setCalendarType] = useState('solar') // 'solar'(양력) | 'lunar'(음력)

  // Claude 호출 상태
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  async function handleAnalyze() {
    // 필수값 간단 검사
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
      setResult(text)
    } catch (err) {
      console.error(err)
      setError(err?.message || '사주 해석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      {/* 용 이미지를 흐리게 배경으로 깔아 둡니다 */}
      <div
        className="app-bg"
        style={{ backgroundImage: `url(${dragonBg})` }}
        aria-hidden="true"
      />

      <div className="app-content">
        <h1>정보입력</h1>

        {/* 이름 */}
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

        {/*
          성별: radio는 같은 name을 쓰면 하나만 선택됩니다.
          checked={gender === 'male'} → 현재 상태가 male일 때만 체크됩니다.
        */}
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

        {/* 양력 / 음력도 성별과 같은 radio 패턴입니다 */}
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
          <div className="result">
            <pre className="result-text">{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
