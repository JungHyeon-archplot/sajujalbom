import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.jsx'
import './index.css'
import './styles/fonts.css'
import './styles/rail.css'
import './styles/shell.css'
import './features/saju/saju.css'
import './features/home/home.css'
import './features/tarot/tarot.css'
import './features/profile/profile.css'
import './components/mascot/mascot.css'
import './components/toast/toast.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
