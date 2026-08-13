import { useEffect, useState } from 'react'
import { trackEvent } from '../../lib/analytics.js'
import { upsertMyProfile } from '../../lib/supabase.js'
import ProfileCat from './ProfileCat.jsx'
import { isProfileComplete } from './profile.js'

/**
 * 처음 로그인한 사용자는 이 창을 채워야 넘어갈 수 있고,
 * 이미 채운 사용자는 '내 정보'에서 다시 열어 고칠 수 있습니다.
 */
export default function ProfileModal({ profile, onSaved, onClose }) {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('solar')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setName(profile?.name || '')
    setBirthDate(profile?.birthDate || '')
    setBirthTime(profile?.birthTime || '')
    setGender(profile?.gender || '')
    setCalendarType(profile?.calendarType || 'solar')
  }, [profile])

  const ready = Boolean(name.trim() && birthDate && birthTime && gender)
  const firstTime = !isProfileComplete(profile)

  async function handleSave() {
    if (!ready) {
      setError('이름, 생년월일, 태어난 시간, 성별을 모두 입력해 주세요.')
      return
    }

    setSaving(true)
    setError('')
    const next = {
      name: name.trim(),
      birthDate,
      birthTime,
      gender,
      calendarType,
    }

    try {
      await upsertMyProfile(next)
      trackEvent('profile_save', { first_time: firstTime })
      onSaved(next)
    } catch (err) {
      console.error(err)
      setError(err?.message || '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-portrait" aria-hidden="true">
          <ProfileCat gender={gender} />
        </div>
        <h2 className="modal-title">
          {firstTime ? '처음이시네요' : '내 정보'}
        </h2>
        <p className="modal-desc">
          {firstTime
            ? '사주와 타로에 같이 쓰일 정보입니다. 한 번만 입력하면 다음부터는 자동으로 채워집니다.'
            : '저장된 정보를 고칠 수 있습니다. 사주와 타로에 같이 쓰입니다.'}
        </p>

        <div className="modal-form">
          <label htmlFor="profileName">
            이름
            <input
              id="profileName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
            />
          </label>

          <label htmlFor="profileBirthDate">
            생년월일
            <input
              id="profileBirthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </label>

          <label htmlFor="profileBirthTime">
            태어난 시간
            <input
              id="profileBirthTime"
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
            />
          </label>

          <div className="field">
            <span className="field-label">성별</span>
            <div className="radio-row">
              <label className="radio-label">
                <input
                  type="radio"
                  name="profileGender"
                  value="male"
                  checked={gender === 'male'}
                  onChange={(e) => setGender(e.target.value)}
                />
                남성
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="profileGender"
                  value="female"
                  checked={gender === 'female'}
                  onChange={(e) => setGender(e.target.value)}
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
                  name="profileCalendar"
                  value="solar"
                  checked={calendarType === 'solar'}
                  onChange={(e) => setCalendarType(e.target.value)}
                />
                양력
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="profileCalendar"
                  value="lunar"
                  checked={calendarType === 'lunar'}
                  onChange={(e) => setCalendarType(e.target.value)}
                />
                음력
              </label>
            </div>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="modal-actions">
          {!firstTime && (
            <button
              type="button"
              className="modal-btn modal-btn-ghost"
              onClick={onClose}
              disabled={saving}
            >
              닫기
            </button>
          )}
          <button
            type="button"
            className="modal-btn"
            onClick={handleSave}
            disabled={saving || !ready}
          >
            {saving ? '저장 중...' : firstTime ? '시작하기' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
