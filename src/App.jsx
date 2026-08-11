import { useState } from 'react'
import HomePage from './HomePage.jsx'
import SajuPage from './SajuPage.jsx'
import TarotPage from './TarotPage.jsx'
import { getStoredAccessPassword } from './claude.js'
import './App.css'

export default function App() {
  const [view, setView] = useState('home') // 'home' | 'saju' | 'tarot'
  const [unlocked, setUnlocked] = useState(() =>
    Boolean(getStoredAccessPassword()),
  )

  if (view === 'saju') {
    return <SajuPage onBack={() => setView('home')} />
  }

  if (view === 'tarot') {
    return <TarotPage onBack={() => setView('home')} />
  }

  return (
    <HomePage
      unlocked={unlocked}
      onUnlocked={() => setUnlocked(true)}
      onSelect={setView}
    />
  )
}
