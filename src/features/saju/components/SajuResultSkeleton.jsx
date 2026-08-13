export default function SajuResultSkeleton() {
  return (
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
  )
}
