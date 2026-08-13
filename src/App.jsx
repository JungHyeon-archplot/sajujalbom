import { useEffect, useState } from 'react'
import HomePage from './HomePage.jsx'
import SajuPage from './SajuPage.jsx'
import TarotPage from './TarotPage.jsx'
import ProfileModal from './ProfileModal.jsx'
import { isProfileComplete } from './profile.js'
import {
  getMyProfile,
  getSession,
  onAuthStateChange,
  signOut,
} from './supabase.js'
import './App.css'

export default function App() {
  const [view, setView] = useState('home') // 'home' | 'saju' | 'tarot'
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  const [profile, setProfile] = useState(null)
  const [showProfile, setShowProfile] = useState(false)

  const unlocked = Boolean(session)

  // 로그인했는데 저장된 정보가 없으면 먼저 입력받습니다.
  useEffect(() => {
    if (!session) {
      setProfile(null)
      setShowProfile(false)
      return undefined
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

  async function handleSignOut() {
    try {
      await signOut()
    } catch (err) {
      console.error(err)
    }
    setSession(null)
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

  if (view === 'saju') {
    return (
      <>
        <SajuPage onBack={() => setView('home')} />
        {modal}
      </>
    )
  }

  if (view === 'tarot') {
    return (
      <>
        <TarotPage onBack={() => setView('home')} />
        {modal}
      </>
    )
  }

  return (
    <>
      <HomePage
        unlocked={unlocked}
        authReady={authReady}
        session={session}
        profile={profile}
        onSignOut={handleSignOut}
        onEditProfile={() => setShowProfile(true)}
        onSelect={setView}
      />
      {modal}
    </>
  )
}
