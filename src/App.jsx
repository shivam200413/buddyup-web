import { useEffect, useState } from 'react'
import { useStore } from './lib/store'
import AuthPage from './pages/AuthPage'
import MapPage from './pages/MapPage'
import LoadingScreen from './components/LoadingScreen'
import ProfileSetup from './components/ProfileSetup'

export default function App() {
  const { session, profile, authLoading, initAuth } = useStore()

  useEffect(() => { initAuth() }, [])

  if (authLoading) return <LoadingScreen />

  // Not logged in
  if (!session) return <AuthPage />

  // Logged in but no username yet (e.g. first magic-link login)
  if (session && !profile) return <ProfileSetup />

  return <MapPage />
}
