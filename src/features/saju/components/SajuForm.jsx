export default function SajuForm({
  name,
  birthDate,
  birthTime,
  gender,
  calendarType,
  busy,
  onNameChange,
  onBirthDateChange,
  onBirthTimeChange,
  onGenderChange,
  onCalendarTypeChange,
  onKeyDown,
}) {
  return (
    <div className="saju-form" onKeyDown={onKeyDown}>
      <label className="field-wide" htmlFor="name">
        이름
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
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
          onChange={(e) => onBirthDateChange(e.target.value)}
          disabled={busy}
        />
      </label>

      <label htmlFor="birthTime">
        태어난 시간
        <input
          id="birthTime"
          type="time"
          value={birthTime}
          onChange={(e) => onBirthTimeChange(e.target.value)}
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
              onChange={(e) => onGenderChange(e.target.value)}
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
              onChange={(e) => onGenderChange(e.target.value)}
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
              onChange={(e) => onCalendarTypeChange(e.target.value)}
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
              onChange={(e) => onCalendarTypeChange(e.target.value)}
              disabled={busy}
            />
            음력
          </label>
        </div>
      </div>
    </div>
  )
}
