import { useCallback, useEffect, useRef, useState } from 'react'
import MascotCat from './MascotCat.jsx'

const SIZE = 92
const HIDE_KEY = 'sajujalbom-hide-wander-cat'

const SAJU_WAITING_LINES = [
  '명식을 펼치는 중이다냥. 보채지 마라냥.',
  '하품… 네 사주는 한 줄로 안 끝난다냥.',
  '꼬리를 말고 기다려라냥. 곧 팩트를 던져 준다냥.',
  '운세는 전자레인지가 아니다냥. 익을 때까지다냥.',
  '눈을 감고 네 명줄을 더듬는 중이다냥.',
]

const TAROT_WAITING_LINES = [
  '구슬을 들여다보는 중이다냥. 보채지 마라냥.',
  '카드가 아직 입을 여는 중이다냥. 하품하지 마라냥.',
  '꼬리를 말고 기다려라냥. 곧 팩트를 던져 준다냥.',
  '운세는 전자레인지가 아니다냥. 익을 때까지다냥.',
]

const READING_LINES = [
  '다 읽었으면 이제 네가 움직여라냥.',
  '좋은 말만 골라 듣지 마라냥. 아픈 데가 약이다냥.',
  '운은 앉아 있는 놈한테 안 온다냥. 정신 차려라냥.',
  '변명 연습 중이지냥? 그만하고 한 가지만 하라냥.',
  '내가 봐줬으면 됐으니, 다음은 네 발이다냥.',
  '현실은 달콤하지 않다냥. 그래도 네가 하면 된다냥.',
  '하품하지 마라냥. 네 얘기다냥.',
]

const PET_LINES = [
  '쓰다듬지 마라냥. 지금은 상담 중이다냥.',
  '냐옹. …흥, 잠깐만이다냥.',
  '집중하라냥. 네 운세다냥.',
  '꼬리 만지지 마라냥. 팩트는 이미 적혀 있다냥.',
]

function randomItem(list, except) {
  const pool = except ? list.filter((item) => item !== except) : list
  const source = pool.length > 0 ? pool : list
  return source[Math.floor(Math.random() * source.length)]
}

function padLeft(avoidSidebar) {
  if (!avoidSidebar || typeof window === 'undefined') return 12
  return window.innerWidth >= 900 ? 180 : 12
}

function pickEdgePosition(avoidSidebar, prev) {
  const pad = 12
  const left = padLeft(avoidSidebar)
  const top = 56
  const right = Math.max(left, window.innerWidth - SIZE - pad)
  const bottom = Math.max(top, window.innerHeight - SIZE - pad - 8)
  const midY = Math.round(top + (bottom - top) * 0.45)
  const midX = Math.round(left + (right - left) * 0.5)

  const spots = [
    { x: left, y: bottom },
    { x: right, y: bottom },
    { x: right, y: top },
    { x: left, y: Math.min(bottom, top + 72) },
    { x: right, y: midY },
    { x: left, y: midY },
    { x: midX, y: bottom },
  ]

  const far = spots.filter((spot) => {
    if (!prev) return true
    const dx = spot.x - prev.x
    const dy = spot.y - prev.y
    return dx * dx + dy * dy > 80 * 80
  })

  return randomItem(far.length > 0 ? far : spots)
}

function startPosition(avoidSidebar) {
  if (typeof window === 'undefined') return { x: 24, y: 240 }
  const pad = 12
  return {
    x: window.innerWidth - SIZE - pad,
    y: window.innerHeight - SIZE - pad - 8,
  }
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * 해석 대기·결과 화면에서 가장자리를 따라 떠다니는 묘선.
 * 글을 가리지 않게 모서리 위주로 다니고, 클릭하면 한마디 합니다.
 */
export default function WanderingCat({
  mood = 'reading',
  kind = 'saju',
  avoidSidebar = false,
}) {
  const [hidden, setHidden] = useState(() => {
    try {
      return sessionStorage.getItem(HIDE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [pos, setPos] = useState(() => startPosition(avoidSidebar))
  const [facing, setFacing] = useState(-1)
  const [walking, setWalking] = useState(false)
  const [bubble, setBubble] = useState('')
  const [hop, setHop] = useState(false)
  const posRef = useRef(pos)
  const bubbleRef = useRef('')
  posRef.current = pos
  bubbleRef.current = bubble

  const waitingLines = kind === 'tarot' ? TAROT_WAITING_LINES : SAJU_WAITING_LINES
  const lines = mood === 'waiting' ? waitingLines : READING_LINES

  const speak = useCallback(
    (pool = lines) => {
      const next = randomItem(pool, bubbleRef.current)
      setBubble(next)
    },
    [lines],
  )

  useEffect(() => {
    if (hidden) return undefined

    speak(lines)
    if (prefersReducedMotion()) return undefined

    let walkTimer
    let pauseTimer
    let cancelled = false

    function roam() {
      if (cancelled) return
      const next = pickEdgePosition(avoidSidebar, posRef.current)
      setFacing(next.x < posRef.current.x ? -1 : 1)
      setBubble('')
      setWalking(true)
      setPos(next)
      walkTimer = window.setTimeout(() => {
        if (cancelled) return
        setWalking(false)
        speak()
        pauseTimer = window.setTimeout(roam, 3200)
      }, 5200)
    }

    const startTimer = window.setTimeout(roam, 1800)

    function onResize() {
      const maxX = window.innerWidth - SIZE - 12
      const maxY = window.innerHeight - SIZE - 12
      setPos((prev) => ({
        x: Math.min(Math.max(padLeft(avoidSidebar), prev.x), Math.max(12, maxX)),
        y: Math.min(Math.max(56, prev.y), Math.max(56, maxY)),
      }))
    }

    window.addEventListener('resize', onResize)

    return () => {
      cancelled = true
      window.clearTimeout(startTimer)
      window.clearTimeout(walkTimer)
      window.clearTimeout(pauseTimer)
      window.removeEventListener('resize', onResize)
    }
  }, [hidden, avoidSidebar, speak, lines])

  function handleDismiss(event) {
    event.stopPropagation()
    setHidden(true)
    try {
      sessionStorage.setItem(HIDE_KEY, '1')
    } catch {
      // ignore
    }
  }

  function handlePet() {
    speak(PET_LINES)
    setHop(true)
    window.setTimeout(() => setHop(false), 420)
  }

  if (hidden) return null

  const onLeft = typeof window !== 'undefined' && pos.x < window.innerWidth / 2

  return (
    <div
      className={`wander-cat${walking ? ' is-walking' : ''}${hop ? ' is-hop' : ''}${onLeft ? ' is-left' : ''}`}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
    >
      {bubble && (
        <p className="wander-bubble" aria-live="polite">
          {bubble}
        </p>
      )}
      <button
        type="button"
        className="wander-dismiss"
        aria-label="묘선 숨기기"
        onClick={handleDismiss}
      >
        ×
      </button>
      <button
        type="button"
        className="wander-pet"
        aria-label="묘선 — 클릭하면 한마디 합니다"
        onClick={handlePet}
      >
        <span
          className="wander-body"
          style={{ transform: `scaleX(${facing})` }}
        >
          <MascotCat variant="buddy" className="mascot-buddy" />
        </span>
      </button>
    </div>
  )
}
