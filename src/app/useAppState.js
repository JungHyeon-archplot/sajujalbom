import { useEffect, useState } from 'react'
import { trackEvent, trackPageView } from '../lib/analytics.js'
import { clearGuestResume, loadGuestResume } from '../lib/guestResume.js'
import { isProfileComplete } from '../features/profile/profile.js'
import {
  getMyProfile,
  getSession,
  onAuthStateChange,
  signInWithGoogle,
  signOut,
} from '../lib/supabase.js'
import { readShareId } from './routing.js'

/** 인증·프로필·화면 전환을 App에서 분리한 상태 훅 */
export function useAppState() {
  const [view, setView] = useState(() => (readShareId() ? 'shared-result' : 'home'))
  const [shareId, setShareId] = useState(() => readShareId())
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [guestResume, setGuestResume] = useState(null)
  const [profile, setProfile] = useState(null)
  const [showProfile, setShowProfile] = useState(false)

  const isLoggedIn = Boolean(session)

  useEffect(() => {
    trackPageView(view, shareId)
  }, [view, shareId])

  useEffect(() => {
    function syncFromUrl() {
      const nextId = readShareId()
      setShareId(nextId)
      setView(nextId ? 'shared-result' : (prev) => (prev === 'shared-result' ? 'home' : prev))
    }

    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      setShowProfile(false)
      return undefined
    }

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
    trackEvent('go_home')
    setShareId(null)
    setGuestResume(null)
    clearGuestResume()
    setView('home')
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/')
    }
  }

  function handleSelect(nextView) {
    trackEvent('select_service', { service: nextView })
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
      trackEvent('login_click', { method: 'google', location: 'profile' })
      try {
        await signInWithGoogle()
      } catch (err) {
        console.error(err)
      }
      return
    }
    trackEvent('open_profile')
    setShowProfile(true)
  }

  async function handleSignOut() {
    trackEvent('logout')
    try {
      await signOut()
    } catch (err) {
      console.error(err)
    }
    setSession(null)
    goHome()
  }

  return {
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
  }
}
