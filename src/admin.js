import { getAccessToken } from './supabase.js'

/**
 * 마스터 계정일 때만 기록 목록을 돌려줍니다.
 * 권한이 없거나 로그인 전이면 null이라 화면에 아무것도 뜨지 않습니다.
 */
export async function fetchAdminRecords() {
  const token = await getAccessToken().catch(() => '')
  if (!token) return null

  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    if (!res.ok) return null

    const data = await res.json().catch(() => null)
    return Array.isArray(data?.records) ? data.records : null
  } catch {
    return null
  }
}

/** 이름별로 묶어 최신순으로 정리합니다. */
export function groupByName(records) {
  const map = new Map()

  for (const row of records) {
    const key = (row.name || '이름 없음').trim() || '이름 없음'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(row)
  }

  return [...map.entries()]
    .map(([name, rows]) => ({ name, rows }))
    .sort((a, b) =>
      String(b.rows[0]?.created_at || '').localeCompare(
        String(a.rows[0]?.created_at || ''),
      ),
    )
}
