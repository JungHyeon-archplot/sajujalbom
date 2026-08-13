export default function SajuTopActions({
  isViewMode,
  mode,
  selectedId,
  busy,
  onBack,
  onShare,
  onEdit,
  onNew,
  onCancelEdit,
}) {
  return (
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
              onClick={onShare}
              disabled={busy || !selectedId}
            >
              공유하기
            </button>
          )}
          {selectedId && (
            <button
              type="button"
              className="saju-edit-btn"
              onClick={onEdit}
              disabled={busy}
            >
              수정하기
            </button>
          )}
          <button
            type="button"
            className="saju-new-btn saju-new-btn-inline"
            onClick={onNew}
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
          onClick={onCancelEdit}
          disabled={busy}
        >
          수정 취소
        </button>
      )}
    </div>
  )
}
