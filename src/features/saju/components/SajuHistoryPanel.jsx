import { formatHistoryDate } from '../../profile/profile.js'

export default function SajuHistoryPanel({
  readings,
  selectedId,
  busy,
  isLoggedIn,
  onNew,
  onSelect,
  onDelete,
}) {
  return (
    <>
      <h2 className="saju-history-title">저장된 사주</h2>
      <button
        type="button"
        className="saju-new-btn"
        onClick={onNew}
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
                onClick={() => onSelect(row.id)}
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
                onClick={(event) => onDelete(event, row.id, row.name)}
                disabled={busy}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
