export default function SajuTopActions({
  isViewMode,
  mode,
  selectedId,
  busy,
  onBack,
  onShare,
  shared,
  onStopSharing,
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
              {shared ? '공유 링크 복사' : '공유하기'}
            </button>
          )}
          {selectedId && shared && (
            <button
              type="button"
              className="saju-edit-btn"
              onClick={onStopSharing}
              disabled={busy}
              title="링크를 아는 사람도 더 이상 볼 수 없게 합니다"
            >
              공유 끄기
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
