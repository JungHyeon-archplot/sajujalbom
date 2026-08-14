const GA_ID = 'G-96VDGEK8B1'

const VIEW_PATHS = {
  home: { path: '/', title: '홈' },
  saju: { path: '/saju', title: '사주' },
  tarot: { path: '/tarot', title: '타로' },
  'shared-result': { path: '/result', title: '공유 사주' },
}

function gtag(...args) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag(...args)
}

/** SPA 화면 전환을 GA4 page_view로 보냅니다. */
export function trackPageView(view) {
  const meta = VIEW_PATHS[view] || VIEW_PATHS.home
  // 공유 링크의 UUID는 그 자체가 사주 열람 열쇠라 애널리틱스에 남기지 않습니다.
  const pagePath = meta.path

  gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: meta.title,
    send_to: GA_ID,
  })
}

/** 커스텀 이벤트 */
export function trackEvent(eventName, params = {}) {
  gtag('event', eventName, params)
}
