/** users에 저장할 필수 정보가 다 있는지 */
export function isProfileComplete(profile) {
  return Boolean(
    profile?.name?.trim() &&
      profile?.birthDate &&
      profile?.birthTime &&
      profile?.gender,
  )
}

export function genderLabel(value) {
  if (value === 'male') return '남성'
  if (value === 'female') return '여성'
  return ''
}

export function calendarLabel(value) {
  if (value === 'lunar') return '음력'
  if (value === 'solar') return '양력'
  return ''
}

export function formatBirthTime(value) {
  if (!value) return ''
  return String(value).slice(0, 5)
}

export function formatBirthDate(value) {
  if (!value) return ''
  const [year, month, day] = String(value).split('-')
  if (!year || !month || !day) return String(value)
  return `${year}.${month}.${day}`
}

export function formatHistoryDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

/** 생년월일 · 시간 · 양력/음력 · 성별을 한 줄로 */
export function profileMetaLine(profile) {
  if (!profile) return ''
  return [
    formatBirthDate(profile.birthDate),
    formatBirthTime(profile.birthTime),
    calendarLabel(profile.calendarType),
    genderLabel(profile.gender),
  ]
    .filter(Boolean)
    .join(' · ')
}
