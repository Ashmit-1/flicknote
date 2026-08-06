import { useCallback, useEffect, useState } from 'react'

// --- Theme-aware web app manifest -------------------------------------------
// The manifest is generated statically at build time, but Chrome/Android read
// `theme_color` and `background_color` from it for the status bar and splash
// screen. We swap in a Blob-URL version matching the current theme so the
// colors always match the app, whatever mode the user is in.

const MANIFEST_PATH = '/manifest.webmanifest'
const THEME_COLORS = {
  dark: { theme_color: '#0b1120', background_color: '#0b1120' },
  light: { theme_color: '#0f172a', background_color: '#0f172a' },
}

let manifestTextPromise = null
let appliedBlobUrl = null

async function getManifestText() {
  if (!manifestTextPromise) {
    manifestTextPromise = fetch(MANIFEST_PATH, { cache: 'no-store' }).then((r) => r.text())
  }
  return manifestTextPromise
}

export async function applyThemeAwareManifest(resolved) {
  // Only swap to a Blob-URL manifest once the app is installed (standalone).
  // While running in a browser tab, a Blob-URL manifest can suppress the
  // `beforeinstallprompt` event in some Chromium versions, which would break
  // the install button. Status bar / splash colors only matter once installed.
  if (!isStandalone()) return

  try {
    const theme = resolved ?? (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
    const colors = THEME_COLORS[theme]
    const text = (await getManifestText())
      .replace(/"theme_color"\s*:\s*"[^"]*"/, `"theme_color": "${colors.theme_color}"`)
      .replace(/"background_color"\s*:\s*"[^"]*"/, `"background_color": "${colors.background_color}"`)

    const blobUrl = URL.createObjectURL(new Blob([text], { type: 'application/manifest+json' }))

    let link = document.querySelector('link[rel="manifest"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'manifest'
      document.head.appendChild(link)
    }
    if (appliedBlobUrl && appliedBlobUrl !== blobUrl) URL.revokeObjectURL(appliedBlobUrl)
    link.href = blobUrl
    appliedBlobUrl = blobUrl
  } catch {
    // Keep the static manifest if anything fails (e.g. dev server without SW).
  }
}

// --- Install prompt ----------------------------------------------------------

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function isIos() {
  const ua = window.navigator.userAgent
  const iPad =
    /iPad/.test(ua) || (window.navigator.maxTouchPoints > 1 && /Macintosh/.test(ua))
  return iPad || /iPhone|iPod/.test(ua)
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(isStandalone())

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }, [deferredPrompt])

  return {
    canInstall: !!deferredPrompt,
    installed,
    isIos: isIos(),
    install,
  }
}
