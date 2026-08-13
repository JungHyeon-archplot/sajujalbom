import { useEffect, useRef, useState } from 'react'
import dragonBg from './assets/dragon-bg.png'
import { analyzeSaju } from './claude.js'
import {
  formatBirthTime,
  formatHistoryDate,
} from './profile.js'
import ProfileRail from './ProfileRail.jsx'
import SajuResultView from './SajuResultView.jsx'
import {
  deleteSajuReading,
  getSajuReading,
  getSajuShareUrl,
  listSajuReadings,
  saveSajuReading,
  updateSajuReading,
} from './supabase.js'
import Toast from './Toast.jsx'
import { claimResumeAction } from './guestResume.js'
import { stripMarkdown } from './text.js'
import { useToast } from './useToast.js'

/** 사주 입력 + 해석 화면 (CRUD: 생성/조회/수정/삭제) */
export default function SajuPage({
  onBack,
  profile,
  onEditProfile,
  onSelect,
  isLoggedIn = false,
  initialResume = null,
  onResumeConsumed,
}) {
  const [mode, setMode] = useState('create') // 'create' | 'view' | 'edit'
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('solar')

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [readings, setReadings] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectedReading, setSelectedReading] = useState(null)
  const { toast, showToast } = useToast()
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [savedProfile, setSavedProfile] = useState(null)
  const resultRef = useRef(null)

  const formReady = Boolean(name.trim() && birthDate && birthTime && gender)
  const canAnalyze = formReady && !loading && !saving
  const busy = loading || saving

  useEffect(() => {
    let cancelled = false

    async function loadReadings() {
      try {
        const rows = await listSajuReadings()
        if (!cancelled) setReadings(rows)
      } catch (err) {
        console.error(err)
      }
    }

    loadReadings()
    return () => {
      cancelled = true
    }
  }, [])

  // 로그인 직 본 게스트 결과를 복원하고, 가능하면 저장합니다.
  useEffect(() => {
    if (!initialResume?.result) return

    setName(initialResume.name || '')
    setBirthDate(initialResume.birthDate || '')
    setBirthTime(initialResume.birthTime || '')
    setGender(initialResume.gender || '')
    setCalendarType(initialResume.calendarType || 'solar')
    setResult(initialResume.result)
    setSelectedReading({
      name: initialResume.name || '',
      birth_date: initialResume.birthDate || '',
      birth_time: initialResume.birthTime || '',
      gender: initialResume.gender || '',
      calendar_type: initialResume.calendarType || 'solar',
    })
    setMode('view')
    onResumeConsumed?.()

    if (!isLoggedIn) return undefined

    const actionId = `saju-save:${initialResume.savedAt || ''}:${initialResume.result?.slice(0, 40) || ''}`
    if (!claimResumeAction(actionId)) return

    saveSajuReading({
      name: initialResume.name || '',
      birthDate: initialResume.birthDate || '',
      birthTime: initialResume.birthTime || '',
      gender: initialResume.gender || '',
      calendarType: initialResume.calendarType || 'solar',
      result: initialResume.result,
    })
      .then((saved) => {
        setSelectedId(saved.id)
        setReadings((prev) => [
          { id: saved.id, name: saved.name, created_at: saved.created_at },
          ...prev.filter((row) => row.id !== saved.id),
        ])
        showToast('결과가 저장됐어요')
      })
      .catch((err) => {
        console.error(err)
      })
    // 마운트 시 1회만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!profile) return
    setSavedProfile(profile)
    setProfileLoaded(Boolean(profile.birthDate))
    if (mode !== 'create' || selectedId) return
    setName((prev) => prev || profile.name)
    setBirthDate((prev) => prev || profile.birthDate)
    setBirthTime((prev) => prev || profile.birthTime)
    setGender((prev) => prev || profile.gender)
    if (profile.calendarType) setCalendarType(profile.calendarType)
  }, [profile, mode, selectedId])

  function scrollToResult() {
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function applyReadingToForm(row) {
    setSelectedReading(row)
    setResult(stripMarkdown(row.result || ''))
    setName(row.name || '')
    setBirthDate(row.birth_date || '')
    setBirthTime(formatBirthTime(row.birth_time))
    setGender(row.gender || '')
    setCalendarType(row.calendar_type || 'solar')
  }

  async function handleSelectReading(id) {
    if (busy) return

    setError('')
    setSelectedId(id)
    setMode('view')

    try {
      const row = await getSajuReading(id)
      applyReadingToForm(row)
      scrollToResult()
    } catch (err) {
      console.error(err)
      setError(err?.message || '저장된 사주를 불러오지 못했습니다.')
    }
  }

  function handleNewSaju() {
    if (busy) {
      showToast('해석이 끝난 뒤에 눌러 주세요.')
      return
    }

    // 이미 비어 있는 새 화면이면 눌러도 바뀌는 게 없어 그 사실을 알려줍니다.
    if (mode === 'create' && !result && !selectedId) {
      showToast('이미 새 사주 화면이에요.')
      return
    }

    setMode('create')
    // 저장해 둔 내 정보로 되돌려 두면 바로 해석을 누를 수 있습니다.
    setName(savedProfile?.name || '')
    setBirthDate(savedProfile?.birthDate || '')
    setBirthTime(savedProfile?.birthTime || '')
    setGender(savedProfile?.gender || '')
    setCalendarType(savedProfile?.calendarType || 'solar')
    setResult('')
    setError('')
    setSelectedId(null)
    setSelectedReading(null)

    showToast(
      savedProfile?.birthDate
        ? '새 사주 화면이에요. 저장된 정보를 채워 뒀습니다.'
        : '새 사주 화면이에요.',
    )

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      document.getElementById('name')?.focus()
    })
  }

  function handleStartEdit() {
    if (busy || !selectedId) return
    setMode('edit')
    setError('')
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      document.getElementById('name')?.focus()
    })
  }

  function handleCancelEdit() {
    if (busy || !selectedId) return
    handleSelectReading(selectedId)
  }

  async function handleShare() {
    if (!selectedId) {
      showToast('저장이 끝난 뒤에 공유할 수 있어요.')
      return
    }

    const url = getSajuShareUrl(selectedId)
    const title = name.trim() ? `${name.trim()}의 사주` : '사주 결과'

    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({
          title,
          text: '사주 결과를 공유합니다.',
          url,
        })
        return
      }
    } catch (err) {
      if (err?.name === 'AbortError') return
    }

    try {
      await navigator.clipboard.writeText(url)
      showToast('공유 링크를 복사했어요')
    } catch (err) {
      console.error(err)
      showToast('링크 복사에 실패했어요')
    }
  }

  async function handleDeleteReading(event, id, readingName) {
    event.stopPropagation()
    if (busy) return

    const ok = window.confirm(`「${readingName}」사주를 삭제할까요?`)
    if (!ok) return

    try {
      await deleteSajuReading(id)
      setReadings((prev) => prev.filter((row) => row.id !== id))

      if (selectedId === id) {
        handleNewSaju()
      }
    } catch (err) {
      console.error(err)
      setError(err?.message || '삭제를 완료하지 못했습니다.')
    }
  }

  async function handleUpdateFields() {
    if (!selectedId || !formReady || busy) {
      setError('이름, 생년월일, 태어난 시간, 성별을 모두 입력해 주세요.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const updated = await updateSajuReading(selectedId, {
        name: name.trim(),
        birthDate,
        birthTime,
        gender,
        calendarType,
        result,
      })

      const nextReading = {
        ...selectedReading,
        id: selectedId,
        name: name.trim(),
        birth_date: birthDate,
        birth_time: birthTime,
        gender,
        calendar_type: calendarType,
        result,
      }

      setSelectedReading(nextReading)
      setReadings((prev) =>
        prev.map((row) => (row.id === selectedId ? { ...row, name: updated.name } : row)),
      )
      setMode('view')
      showToast('수정됨')
      scrollToResult()
    } catch (err) {
      console.error(err)
      setError(err?.message || '수정을 완료하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAnalyze() {
    if (!canAnalyze) {
      setError('이름, 생년월일, 태어난 시간, 성별을 모두 입력해 주세요.')
      return
    }

    const editingId = mode === 'edit' ? selectedId : null

    setLoading(true)
    setError('')
    setResult('')
    if (!editingId) {
      setSelectedId(null)
      setSelectedReading(null)
      setMode('create')
    }

    try {
      const text = await analyzeSaju({
        name: name.trim(),
        birthDate,
        birthTime,
        gender,
        calendarType,
      })
      const cleaned = stripMarkdown(text)
      setResult(cleaned)
      setSelectedReading({
        id: editingId || undefined,
        name: name.trim(),
        birth_date: birthDate,
        birth_time: birthTime,
        gender,
        calendar_type: calendarType,
      })
      scrollToResult()

      if (!isLoggedIn) {
        setMode('view')
        showToast('로그인하면 전체 결과와 저장·공유가 열려요')
        return
      }

      try {
        const payload = {
          name: name.trim(),
          birthDate,
          birthTime,
          gender,
          calendarType,
          result: cleaned,
        }

        const saved = editingId
          ? await updateSajuReading(editingId, payload)
          : await saveSajuReading(payload)

        setSelectedId(saved.id)
        setMode('view')
        setReadings((prev) => {
          const next = { id: saved.id, name: saved.name, created_at: saved.created_at }
          if (editingId) {
            return prev.map((row) => (row.id === saved.id ? next : row))
          }
          return [next, ...prev.filter((row) => row.id !== saved.id)]
        })
        showToast(editingId ? '수정됨' : '저장됨')
      } catch (saveErr) {
        console.error(saveErr)
        setMode('view')
        setError(
          editingId
            ? '해석은 완료됐지만 수정 저장에 실패했습니다.'
            : '해석은 완료됐지만 저장에 실패했습니다.',
        )
      }
    } catch (err) {
      console.error(err)
      setError(err?.message || '사주 해석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function handleFormKeyDown(event) {
    if (event.key !== 'Enter' || busy) return
    if (mode !== 'create' && mode !== 'edit') return
    if (event.target?.tagName === 'TEXTAREA') return
    event.preventDefault()
    if (canAnalyze) handleAnalyze()
  }

  const isViewMode = mode === 'view' && Boolean(result) && !loading
  const showForm = mode === 'create' || mode === 'edit'

  return (
    <div className="app">
      <div
        className="app-bg"
        style={{ backgroundImage: `url(${dragonBg})` }}
        aria-hidden="true"
      />

      <ProfileRail
        theme="saju"
        profile={profile}
        onEditProfile={onEditProfile}
        onSelect={onSelect}
        navLocked={busy}
      >
        <h2 className="saju-history-title">저장된 사주</h2>
        <button
          type="button"
          className="saju-new-btn"
          onClick={handleNewSaju}
          disabled={busy}
        >
          새 사주 만들기
        </button>
        {readings.length === 0 ? (
          <p className="saju-history-empty">
            {isLoggedIn
              ? '아직 저장된 사주가 없습니다.'
              : '로그인하면 사주 기록을 여기에 모아 둘 수 있어요.'}
          </p>
        ) : (
          <ul className="saju-history-list">
            {readings.map((row) => (
              <li key={row.id} className="saju-history-row">
                <button
                  type="button"
                  className={
                    selectedId === row.id
                      ? 'saju-history-item is-active'
                      : 'saju-history-item'
                  }
                  onClick={() => handleSelectReading(row.id)}
                  disabled={busy}
                >
                  <span className="saju-history-name">{row.name}</span>
                  {row.created_at && (
                    <time className="saju-history-date" dateTime={row.created_at}>
                      {formatHistoryDate(row.created_at)}
                    </time>
                  )}
                </button>
                <button
                  type="button"
                  className="saju-history-delete"
                  aria-label={`${row.name} 삭제`}
                  onClick={(event) => handleDeleteReading(event, row.id, row.name)}
                  disabled={busy}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </ProfileRail>

      <div className="app-content">
        <div className="saju-top-actions">
          <button type="button" className="back-btn" onClick={onBack}>
            ← 처음으로
          </button>
          {isViewMode && (
            <div className="saju-top-actions-right">
              {selectedId && (
                <button
                  type="button"
                  className="saju-share-btn"
                  onClick={handleShare}
                  disabled={busy || !selectedId}
                >
                  공유하기
                </button>
              )}
              {selectedId && (
                <button
                  type="button"
                  className="saju-edit-btn"
                  onClick={handleStartEdit}
                  disabled={busy}
                >
                  수정하기
                </button>
              )}
              <button
                type="button"
                className="saju-new-btn saju-new-btn-inline"
                onClick={handleNewSaju}
                disabled={busy}
              >
                새 사주 만들기
              </button>
            </div>
          )}
          {mode === 'edit' && (
            <button
              type="button"
              className="back-btn"
              onClick={handleCancelEdit}
              disabled={busy}
            >
              수정 취소
            </button>
          )}
        </div>

        {isViewMode ? (
          <h1>{selectedId ? '저장된 사주' : '사주 결과'}</h1>
        ) : (
          <>
            <h1>{mode === 'edit' ? '사주 수정' : '정보입력'}</h1>
            {showForm && (
              <div className="saju-form" onKeyDown={handleFormKeyDown}>
                <label className="field-wide" htmlFor="name">
                  이름
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    disabled={busy}
                  />
                </label>

                <label htmlFor="birthDate">
                  생년월일
                  <input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    disabled={busy}
                  />
                </label>

                <label htmlFor="birthTime">
                  태어난 시간
                  <input
                    id="birthTime"
                    type="time"
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                    disabled={busy}
                  />
                </label>

                <div className="field">
                  <span className="field-label">성별</span>
                  <div className="radio-row">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={gender === 'male'}
                        onChange={(e) => setGender(e.target.value)}
                        disabled={busy}
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
                        disabled={busy}
                      />
                      여성
                    </label>
                  </div>
                </div>

                <div className="field">
                  <span className="field-label">양력 / 음력</span>
                  <div className="radio-row">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="calendarType"
                        value="solar"
                        checked={calendarType === 'solar'}
                        onChange={(e) => setCalendarType(e.target.value)}
                        disabled={busy}
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
                        disabled={busy}
                      />
                      음력
                    </label>
                  </div>
                </div>
              </div>
            )}

            {mode === 'edit' ? (
              <div className="saju-edit-actions">
                <button
                  type="button"
                  className="analyze-btn analyze-btn-secondary"
                  onClick={handleUpdateFields}
                  disabled={!formReady || busy}
                >
                  {saving ? '저장 중...' : '변경 저장'}
                </button>
                <button
                  type="button"
                  className="analyze-btn"
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                >
                  {loading ? '해석 중...' : '다시 해석 후 저장'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="analyze-btn"
                onClick={handleAnalyze}
                disabled={!canAnalyze}
              >
                {loading ? '해석 중...' : '사주 해석하기'}
              </button>
            )}

            {!formReady && !busy && (
              <p className="saju-form-hint">
                이름, 생년월일, 태어난 시간, 성별을 입력하면{' '}
                {mode === 'edit' ? '수정할' : '해석할'} 수 있습니다.
              </p>
            )}

            {profileLoaded && formReady && mode === 'create' && !busy && (
              <p className="saju-form-hint">
                저장해 둔 정보를 불러왔습니다. 바뀐 내용이 있으면 고치면 됩니다.
              </p>
            )}
          </>
        )}

        {error && <p className="error">{error}</p>}

        {loading && (
          <div className="result skeleton" aria-busy="true" aria-live="polite">
            <p className="skeleton-status">명식을 펼치는 중…</p>
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
          <div ref={resultRef}>
            {selectedId && (
              <div className="result-share-bar">
                <button
                  type="button"
                  className="saju-share-btn saju-share-btn-primary"
                  onClick={handleShare}
                  disabled={busy}
                >
                  친구에게 공유하기
                </button>
                <p className="result-share-hint">
                  링크로 들어온 사람은 로그인 없이 결과를 볼 수 있어요.
                </p>
              </div>
            )}
            <SajuResultView
              reading={selectedReading}
              resultText={result}
              locked={!isLoggedIn}
              resumePayload={
                !isLoggedIn && result
                  ? {
                      view: 'saju',
                      result,
                      name: name.trim(),
                      birthDate,
                      birthTime,
                      gender,
                      calendarType,
                    }
                  : null
              }
            />
          </div>
        )}
      </div>

      <Toast toast={toast} />
    </div>
  )
}
