export default function ShuffleStack() {
  return (
    <div className="shuffle-stack" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="shuffle-card" style={{ '--i': i }} />
      ))}
    </div>
  )
}
