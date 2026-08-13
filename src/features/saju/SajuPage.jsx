import { useEffect, useRef, useState } from 'react'
import dragonBg from '../../assets/dragon-bg.png'
import Toast from '../../components/toast/Toast.jsx'
import { useToast } from '../../components/toast/useToast.js'
import { trackEvent } from '../../lib/analytics.js'
import { analyzeSaju } from '../../lib/claude.js'
import { claimResumeAction } from '../../lib/guestResume.js'
import {
  deleteSajuReading,
  getSajuReading,
  getSajuShareUrl,
  listSajuReadings,
  saveSajuReading,
  updateSajuReading,
} from '../../lib/supabase.js'
import { stripMarkdown } from '../../lib/text.js'
import ProfileRail from '../profile/ProfileRail.jsx'
import { formatBirthTime } from '../profile/profile.js'
import SajuForm from './components/SajuForm.jsx'
import SajuHistoryPanel from './components/SajuHistoryPanel.jsx'
import SajuResultSkeleton from './components/SajuResultSkeleton.jsx'
import SajuResultView from './components/SajuResultView.jsx'
import SajuTopActions from './components/SajuTopActions.jsx'

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
  const [mode, setMode] = useState('create')
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

    if (mode === 'create' && !result && !selectedId) {
      showToast('이미 새 사주 화면이에요.')
      return
    }

    trackEvent('saju_new')
    setMode('create')
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
    trackEvent('saju_edit_start')
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
        trackEvent('saju_share', { method: 'native' })
        return
      }
    } catch (err) {
      if (err?.name === 'AbortError') return
    }

    try {
      await navigator.clipboard.writeText(url)
      trackEvent('saju_share', { method: 'clipboard' })
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

    trackEvent('saju_delete')
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

    trackEvent('saju_analyze', {
      mode: editingId ? 'edit' : 'create',
      logged_in: isLoggedIn,
    })

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
      trackEvent('saju_analyze_success', {
        mode: editingId ? 'edit' : 'create',
        logged_in: isLoggedIn,
      })

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
        <SajuHistoryPanel
          readings={readings}
          selectedId={selectedId}
          busy={busy}
          isLoggedIn={isLoggedIn}
          onNew={handleNewSaju}
          onSelect={handleSelectReading}
          onDelete={handleDeleteReading}
        />
      </ProfileRail>

      <div className="app-content">
        <SajuTopActions
          isViewMode={isViewMode}
          mode={mode}
          selectedId={selectedId}
          busy={busy}
          onBack={onBack}
          onShare={handleShare}
          onEdit={handleStartEdit}
          onNew={handleNewSaju}
          onCancelEdit={handleCancelEdit}
        />

        {isViewMode ? (
          <h1>{selectedId ? '저장된 사주' : '사주 결과'}</h1>
        ) : (
          <>
            <h1>{mode === 'edit' ? '사주 수정' : '정보입력'}</h1>
            {showForm && (
              <SajuForm
                name={name}
                birthDate={birthDate}
                birthTime={birthTime}
                gender={gender}
                calendarType={calendarType}
                busy={busy}
                onNameChange={setName}
                onBirthDateChange={setBirthDate}
                onBirthTimeChange={setBirthTime}
                onGenderChange={setGender}
                onCalendarTypeChange={setCalendarType}
                onKeyDown={handleFormKeyDown}
              />
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

        {loading && <SajuResultSkeleton />}

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
