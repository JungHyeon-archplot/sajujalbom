import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 화면 아래에 잠깐 떴다 사라지는 안내 메시지.
 * 같은 메시지를 다시 눌러도 애니메이션이 다시 돌도록 id를 붙입니다.
 */
export function useToast(duration = 2600) {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const showToast = useCallback(
    (message, tone = 'info') => {
      if (!message) return
      setToast({ id: Date.now(), message, tone })
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setToast(null), duration)
    },
    [duration],
  )

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  return { toast, showToast }
}
