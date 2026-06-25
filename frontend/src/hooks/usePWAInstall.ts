import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWAInstall() {
  const ua = navigator.userAgent

  const isIOS = /iphone|ipad|ipod/i.test(ua)
  const isAndroid = /android/i.test(ua)
  const isMobile = isIOS || isAndroid

  const isInstalled =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  // true una vez que el timeout venció (sabemos si el prompt llegó o no)
  const [promptChecked, setPromptChecked] = useState(false)

  useEffect(() => {
    if (!isAndroid || isInstalled) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setPromptChecked(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Si en 2 s no llegó beforeinstallprompt → app ya instalada (Android no lo emite si ya existe)
    const timer = setTimeout(() => setPromptChecked(true), 2000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(timer)
    }
  }, [isAndroid, isInstalled])

  function promptInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    deferredPrompt.userChoice.then(() => setDeferredPrompt(null))
  }

  const canInstall = isAndroid && deferredPrompt !== null
  // Android mobile, no standalone, el prompt no llegó → ya estaba instalada
  const alreadyInstalledElsewhere = isAndroid && promptChecked && !deferredPrompt && !isInstalled

  return {
    isMobile,
    isIOS,
    isAndroid,
    isInstalled,
    canInstall,
    promptChecked,
    alreadyInstalledElsewhere,
    promptInstall,
  }
}
