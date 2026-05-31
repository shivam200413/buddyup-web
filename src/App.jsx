import { useEffect, useState } from 'react'
import { useStore } from './lib/store'
import { supabase } from './lib/supabase'
import AuthPage from './pages/AuthPage'
import MapPage from './pages/MapPage'
import LoadingScreen from './components/LoadingScreen'
import ProfileSetup from './components/ProfileSetup'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
  const { session, profile, authLoading, initAuth } = useStore()
  const [exchanging, setExchanging] = useState(false)

  useEffect(() => {
    // Handle OAuth / magic link redirect — Supabase puts tokens in URL hash or query
    const url = new URL(window.location.href)
    const hasCode  = url.searchParams.has('code')
    const hasToken = url.hash.includes('access_token')

    if (hasCode || hasToken) {
      setExchanging(true)
      supabase.auth.getSession().then(() => {
        window.history.replaceState({}, document.title, window.location.pathname)
        setExchanging(false)
      })
    }

    initAuth()
  }, [])

  if (authLoading || exchanging) return <LoadingScreen />
  if (!session)                   return <AuthPage />
  if (!profile)                   return <ProfileSetup />

  return (
    <ErrorBoundary>
      <MapPage />
    </ErrorBoundary>
  )
}
