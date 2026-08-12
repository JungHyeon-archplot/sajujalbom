import { useEffect, useState } from 'react'
import HomePage from './HomePage.jsx'
import SajuPage from './SajuPage.jsx'
import TarotPage from './TarotPage.jsx'
import { getStoredAccessPassword } from './claude.js'
import { getSession, onAuthStateChange, signOut } from './supabase.js'
import './App.css'

export default function App() {
  const [view, setView] = useState('home') // 'home' | 'saju' | 'tarot'
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [passwordUnlocked, setPasswordUnlocked] = useState(() =>
    Boolean(getStoredAccessPassword()),
  )

  const unlocked = Boolean(session) || passwordUnlocked

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

  if (view === 'saju') {
    return <SajuPage onBack={() => setView('home')} />
  }

  if (view === 'tarot') {
    return <TarotPage onBack={() => setView('home')} />
  }

  return (
    <HomePage
      unlocked={unlocked}
      authReady={authReady}
      session={session}
      onUnlocked={() => setPasswordUnlocked(true)}
      onSignOut={handleSignOut}
      onSelect={setView}
    />
  )
}
