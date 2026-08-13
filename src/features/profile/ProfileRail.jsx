import ProfileCat from './ProfileCat.jsx'
import { isProfileComplete, profileMetaLine } from './profile.js'

/**
 * 사주·타로 공통 왼쪽 레일.
 * 위는 민화풍 프로필(내 정보), 아래는 화면별 기록.
 */
export default function ProfileRail({
  theme = 'saju',
  profile,
  onEditProfile,
  onSelect,
  navLocked = false,
  children,
}) {
  const complete = isProfileComplete(profile)
  const meta = profileMetaLine(profile)

  function go(next) {
    if (navLocked || next === theme) return
    onSelect?.(next)
  }

  return (
    <aside className={`app-rail app-rail-${theme}`} aria-label="내 정보와 기록">
      <section className="profile-card">
        <div className={`profile-portrait is-${profile?.gender || 'unknown'}`}>
          <ProfileCat gender={profile?.gender} />
        </div>
        <div className="profile-info">
          <p className="profile-kicker">내 정보</p>
          <h2 className="profile-name">
            {complete ? profile.name : '아직 비어 있어요'}
          </h2>
          {meta ? (
            <p className="profile-meta">{meta}</p>
          ) : (
            <p className="profile-meta">사주와 타로에 같이 쓰입니다</p>
          )}
          {onEditProfile && (
            <button
              type="button"
              className="profile-edit-btn"
              onClick={onEditProfile}
            >
              {complete ? '정보 수정' : '정보 입력'}
            </button>
          )}
        </div>
      </section>

      {onSelect && (
        <nav className="rail-nav" aria-label="사주와 타로">
          <button
            type="button"
            className={theme === 'saju' ? 'is-active' : ''}
            onClick={() => go('saju')}
            disabled={navLocked}
            aria-current={theme === 'saju' ? 'page' : undefined}
          >
            사주
          </button>
          <button
            type="button"
            className={theme === 'tarot' ? 'is-active' : ''}
            onClick={() => go('tarot')}
            disabled={navLocked}
            aria-current={theme === 'tarot' ? 'page' : undefined}
          >
            타로
          </button>
        </nav>
      )}

      {children ? <div className="rail-body">{children}</div> : null}
    </aside>
  )
}
