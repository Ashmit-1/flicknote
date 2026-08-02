import { useCallback, useEffect, useState } from 'react'

const THEME_KEY = 'quicknotes:theme'
const DARK_BG = '#0b1120'
const LIGHT_BG = '#0f172a'

export function getSystemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveTheme(theme) {
  return theme === 'dark' || (theme === 'system' && getSystemDark()) ? 'dark' : 'light'
}

function applyTheme(theme) {
  const resolved = resolveTheme(theme)
  document.documentElement.dataset.theme = resolved
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', resolved === 'dark' ? DARK_BG : LIGHT_BG)
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_KEY) || 'system')
  const [resolved, setResolved] = useState(() => resolveTheme(theme))

  useEffect(() => {
    applyTheme(theme)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (localStorage.getItem(THEME_KEY) === 'system') {
        applyTheme('system')
        setResolved(resolveTheme('system'))
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((next) => {
    localStorage.setItem(THEME_KEY, next)
    setThemeState(next)
    setResolved(resolveTheme(next))
  }, [])

  return { theme, resolved, setTheme }
}
