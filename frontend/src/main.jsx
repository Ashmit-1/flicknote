import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyThemeAwareManifest } from './pwa'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Keep the web app manifest in sync with the current theme (splash screen and
// status bar colors) as early as possible, even before the user logs in.
applyThemeAwareManifest()
