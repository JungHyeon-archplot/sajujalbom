import HomePage from '../features/home/HomePage.jsx'
import ProfileModal from '../features/profile/ProfileModal.jsx'
import SajuPage from '../features/saju/SajuPage.jsx'
import SharedResultPage from '../features/shared-result/SharedResultPage.jsx'
import TarotPage from '../features/tarot/TarotPage.jsx'
import { useAppState } from './useAppState.js'

export default function App() {
  const {
    view,
    shareId,
    session,
    authReady,
    guestResume,
    profile,
    showProfile,
    isLoggedIn,
    setProfile,
    setShowProfile,
    setGuestResume,
    goHome,
    handleSelect,
    handleEditProfile,
    handleSignOut,
  } = useAppState()

  const modal = showProfile ? (
    <ProfileModal
      profile={profile}
      onSaved={(next) => {
        setProfile(next)
        setShowProfile(false)
      }}
      onClose={() => setShowProfile(false)}
    />
  ) : null

  const pageProps = {
    profile,
    isLoggedIn,
    onBack: goHome,
    onEditProfile: handleEditProfile,
    onSelect: handleSelect,
  }

  if (view === 'shared-result' && shareId) {
    return <SharedResultPage shareId={shareId} onHome={goHome} />
  }

  if (view === 'saju') {
    return (
      <>
        <SajuPage
          {...pageProps}
          initialResume={guestResume?.view === 'saju' ? guestResume : null}
          onResumeConsumed={() => setGuestResume(null)}
        />
        {modal}
      </>
    )
  }

  if (view === 'tarot') {
    return (
      <>
        <TarotPage
          {...pageProps}
          initialResume={guestResume?.view === 'tarot' ? guestResume : null}
          onResumeConsumed={() => setGuestResume(null)}
        />
        {modal}
      </>
    )
  }

  return (
    <>
      <HomePage
        authReady={authReady}
        session={session}
        profile={profile}
        onSignOut={handleSignOut}
        onEditProfile={handleEditProfile}
        onSelect={handleSelect}
      />
      {modal}
    </>
  )
}
