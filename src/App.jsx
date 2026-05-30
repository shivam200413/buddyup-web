import { useEffect, useState } from 'react'
import { useStore } from './lib/store'
import { supabase } from './lib/supabase'
import AuthPage from './pages/AuthPage'
import MapPage from './pages/MapPage'
import LoadingScreen from './components/LoadingScreen'
import ProfileSetup from './components/ProfileSetup'

export default function App() {
  const { session, profile, authLoading, initAuth } = useStore()
  const [exchanging, setExchanging] = useState(false)

  useEffect(() => {
    // Handle magic link / email confirmation redirect
    // Supabase puts #access_token=... or ?code=... in the URL
    const url = new URL(window.location.href)
    const hasCode = url.searchParams.has('code')
    const hasToken = url.hash.includes('access_token')

    if (hasCode || hasToken) {
      setExchanging(true)
      // Let Supabase SDK pick up the token automatically
      supabase.auth.getSession().then(() => {
        // Clean the URL so it doesn't show tokens
        window.history.replaceState({}, document.title, window.location.pathname)
        setExchanging(false)
      })
    }

    initAuth()
  }, [])

  if (authLoading || exchanging) return <LoadingScreen />

  // Not logged in
  if (!session) return <AuthPage />

  // Logged in but no username yet
  if (session && !profile) return <ProfileSetup />

  return <MapPage />
}
