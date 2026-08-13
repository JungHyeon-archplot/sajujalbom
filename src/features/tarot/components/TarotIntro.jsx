export default function TarotIntro({
  name,
  concern,
  onNameChange,
  onConcernChange,
  onStart,
}) {
  return (
    <div className="tarot-intro">
      <label htmlFor="tarotName">
        이름
        <input
          id="tarotName"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="이름을 입력하세요"
        />
      </label>

      <label htmlFor="tarotConcern">
        요즘 고민 (한 줄, 선택)
        <input
          id="tarotConcern"
          type="text"
          value={concern}
          onChange={(e) => onConcernChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onStart()
          }}
          placeholder="예: 진로를 정하기가 어려워요"
          maxLength={60}
        />
      </label>

      <button type="button" className="tarot-btn" onClick={onStart}>
        카드 펼치기
      </button>
    </div>
  )
}
