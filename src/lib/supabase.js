import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '[BuddyUp] Missing Supabase env vars.\n' +
    'Copy .env.example to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: { eventsPerSecond: 10 }
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// ── Activity types ────────────────────────────────────────────────────────
export const ACTIVITIES = [
  { id: 'run',        label: 'Running',       emoji: '🏃', color: '#f97316' },
  { id: 'basketball', label: 'Basketball',    emoji: '🏀', color: '#ea580c' },
  { id: 'gym',        label: 'Gym',           emoji: '🏋️', color: '#7c3aed' },
  { id: 'coffee',     label: 'Coffee',        emoji: '☕', color: '#a16207' },
  { id: 'study',      label: 'Study',         emoji: '📚', color: '#0891b2' },
  { id: 'cycle',      label: 'Cycling',       emoji: '🚴', color: '#16a34a' },
  { id: 'football',   label: 'Football',      emoji: '⚽', color: '#15803d' },
  { id: 'chill',      label: 'Just chilling', emoji: '😎', color: '#6366f1' },
]

export const getActivity = (id) =>
  ACTIVITIES.find(a => a.id === id) ?? ACTIVITIES[ACTIVITIES.length - 1]
