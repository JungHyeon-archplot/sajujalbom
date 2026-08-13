import { useEffect, useState } from 'react'
import dragonBg from './assets/dragon-bg.png'
import SajuResultView from './SajuResultView.jsx'
import { getSharedSajuReading } from './supabase.js'
import { stripMarkdown } from './text.js'
import Toast from './Toast.jsx'
import { useToast } from './useToast.js'

export default function SharedResultPage({ shareId, onHome }) {
  const [reading, setReading] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { toast, showToast } = useToast()

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')
      try {
        const row = await getSharedSajuReading(shareId)
        if (!active) return
        setReading({
          ...row,
          result: stripMarkdown(row.result || ''),
        })
      } catch (err) {
        console.error(err)
        if (active) {
          setReading(null)
          setError(err?.message || '공유된 사주를 불러오지 못했습니다.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [shareId])

  async function handleCopyLink() {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      showToast('공유 링크를 복사했어요')
    } catch (err) {
      console.error(err)
      showToast('링크 복사에 실패했어요')
    }
  }

  return (
    <div className="app">
      <div
        className="app-bg"
        style={{ backgroundImage: `url(${dragonBg})` }}
        aria-hidden="true"
      />

      <div className="app-content shared-result-content">
        <div className="saju-top-actions">
          <button type="button" className="back-btn" onClick={onHome}>
            ← 처음으로
          </button>
          {reading && (
            <button type="button" className="saju-share-btn" onClick={handleCopyLink}>
              링크 복사
            </button>
          )}
        </div>

        <p className="shared-result-eyebrow">공유된 사주</p>
        <h1>{reading?.name ? `${reading.name}의 사주` : '사주 결과'}</h1>
        <p className="shared-result-lead">
          친구가 보낸 사주 결과예요. 로그인 없이 볼 수 있습니다.
        </p>

        {loading && (
          <div className="result skeleton" aria-busy="true" aria-live="polite">
            <p className="skeleton-status">명식을 펼치는 중…</p>
            <div className="skeleton-block">
              <div className="skeleton-line title" />
              <div className="skeleton-line short" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line medium" />
            </div>
          </div>
        )}

        {error && !loading && <p className="error">{error}</p>}

        {reading && !loading && (
          <SajuResultView reading={reading} resultText={reading.result} />
        )}
      </div>

      <Toast toast={toast} />
    </div>
  )
}
