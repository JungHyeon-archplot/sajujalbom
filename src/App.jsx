import { useEffect, useState } from 'react'
import HomePage from './HomePage.jsx'
import SajuPage from './SajuPage.jsx'
import SharedResultPage from './SharedResultPage.jsx'
import TarotPage from './TarotPage.jsx'
import ProfileModal from './ProfileModal.jsx'
import { clearGuestResume, loadGuestResume } from './guestResume.js'
import { isProfileComplete } from './profile.js'
import {
  getMyProfile,
  getSession,
  onAuthStateChange,
  signInWithGoogle,
  signOut,
} from './supabase.js'
import './App.css'

const RESULT_PATH = /^\/result\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i

function readShareId(pathname = window.location.pathname) {
  const match = pathname.match(RESULT_PATH)
  return match?.[1] || null
}

export default function App() {
  const [view, setView] = useState(() => (readShareId() ? 'shared-result' : 'home'))
  const [shareId, setShareId] = useState(() => readShareId())
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [guestResume, setGuestResume] = useState(null)

  const [profile, setProfile] = useState(null)
  const [showProfile, setShowProfile] = useState(false)

  const isLoggedIn = Boolean(session)

  useEffect(() => {
    function syncFromUrl() {
      const nextId = readShareId()
      setShareId(nextId)
      setView(nextId ? 'shared-result' : (prev) => (prev === 'shared-result' ? 'home' : prev))
    }

    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [])

  // 로그인했는데 저장된 정보가 없으면 먼저 입력받습니다.
  useEffect(() => {
    if (!session) {
      setProfile(null)
      setShowProfile(false)
      return undefined
    }

    // 비로그인으로 본 결과가 있으면 로그인 후 그 화면으로 되돌립니다.
    const resume = loadGuestResume()
    if (resume?.view === 'saju' || resume?.view === 'tarot') {
      setGuestResume(resume)
      setView(resume.view)
      if (window.location.pathname.startsWith('/result/')) {
        window.history.replaceState({}, '', '/')
      }
    }

    let active = true
    getMyProfile()
      .then((next) => {
        if (!active) return
        setProfile(next)
        if (!isProfileComplete(next)) setShowProfile(true)
      })
      .catch((err) => {
        console.error(err)
      })

    return () => {
      active = false
    }
  }, [session])

  useEffect(() => {
    let active = true

    getSession()
      .then((next) => {
        if (active) setSession(next)
      })
      .catch((err) => {
        console.error(err)
      })
      .finally(() => {
        if (active) setAuthReady(true)
      })

    const unsubscribe = onAuthStateChange((next) => {
      setSession(next)
      setAuthReady(true)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  function goHome() {
    setShareId(null)
    setGuestResume(null)
    clearGuestResume()
    setView('home')
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/')
    }
  }

  function handleSelect(nextView) {
    setShareId(null)
    setGuestResume(null)
    clearGuestResume()
    setView(nextView)
    if (window.location.pathname.startsWith('/result/')) {
      window.history.pushState({}, '', '/')
    }
  }

  async function handleEditProfile() {
    if (!session) {
      try {
        await signInWithGoogle()
      } catch (err) {
        console.error(err)
      }
      return
    }
    setShowProfile(true)
  }

  async function handleSignOut() {
    try {
      await signOut()
    } catch (err) {
      console.error(err)
    }
    setSession(null)
    goHome()
  }

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
