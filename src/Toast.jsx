/** useToast가 만든 메시지를 화면 아래에 띄웁니다. */
export default function Toast({ toast }) {
  if (!toast) return null

  return (
    <div className="toast-layer" aria-live="polite">
      <div key={toast.id} className={`toast toast-${toast.tone}`}>
        <span className="toast-dot" aria-hidden="true" />
        {toast.message}
      </div>
    </div>
  )
}
