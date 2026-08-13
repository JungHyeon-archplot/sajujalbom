import { useMemo, useState } from 'react'
import { groupByName } from '../lib/admin.js'

/** 마스터 계정에게만 보이는 기록 패널 */
export default function RecordPanel({ records }) {
  const groups = useMemo(() => groupByName(records), [records])
  const [openName, setOpenName] = useState(null)

  const opened = groups.find((g) => g.name === openName)

  return (
    <div className="tarot-admin" aria-label="기록">
      <h2 className="tarot-admin-title">기록 ({records.length})</h2>

      {groups.length === 0 ? (
        <p className="tarot-admin-empty">아직 기록이 없습니다.</p>
      ) : !opened ? (
        <ul className="tarot-admin-list">
          {groups.map((group) => (
            <li key={group.name}>
              <button
                type="button"
                className="tarot-admin-name"
                onClick={() => setOpenName(group.name)}
              >
                <span>{group.name}</span>
                <em>{group.rows.length}</em>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="tarot-admin-detail">
          <button
            type="button"
            className="tarot-admin-back"
            onClick={() => setOpenName(null)}
          >
            ← 이름 목록
          </button>
          <h3 className="tarot-admin-subtitle">{opened.name}</h3>

          {opened.rows.map((row) => (
            <article key={row.id} className="tarot-admin-entry">
              <p className="tarot-admin-date">
                {new Date(row.created_at).toLocaleString('ko-KR')}
              </p>
              <p className="tarot-admin-concern">
                {row.concern || '고민을 적지 않음'}
              </p>
              <p className="tarot-admin-cards">
                {(row.cards || [])
                  .map((c) => `${c.position}: ${c.card}`)
                  .join(' / ')}
              </p>
              <details>
                <summary>해석 보기</summary>
                <pre className="tarot-admin-result">{row.result}</pre>
              </details>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
