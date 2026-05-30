import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import ngeohash from 'ngeohash'

// ── Geohash precision 5 ≈ 4.9km × 4.9km cells ─────────────────────────────
const GEO_PRECISION = 5

let presenceChannel = null
let watchId = null

export const useStore = create((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────────────────────
  session: null,
  profile: null,
  authLoading: true,

  initAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, authLoading: false })
    if (session) await get().fetchProfile(session.user.id)

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session })
      if (session) await get().fetchProfile(session.user.id)
      else set({ profile: null })
    })
  },

  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    set({ profile: data })
  },

  // Magic link — sends email, user clicks link, session is created automatically
  sendMagicLink: async (email) => {
    return supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })
  },

  // Email + password sign-in
  signInWithPassword: async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password })
  },

  // Email + password sign-up (new account)
  signUpWithPassword: async (email, password) => {
    return supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin }
    })
  },

  createProfile: async (username) => {
    const { session } = get()
    const { data, error } = await supabase
      .from('users')
      .insert({ id: session.user.id, username })
      .select()
      .single()
    if (!error) set({ profile: data })
    return { data, error }
  },

  signOut: async () => {
    await get().stopSession()
    await supabase.auth.signOut()
    set({ session: null, profile: null, nearbyUsers: [], flares: [] })
  },

  // ── Location ──────────────────────────────────────────────────────────────
  position: null,        // { lat, lng }
  locationError: null,
  geohashCell: null,

  startLocation: () => {
    if (!navigator.geolocation) {
      set({ locationError: 'Geolocation not supported' })
      return
    }
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const cell = ngeohash.encode(lat, lng, GEO_PRECISION)
        const prev = get()

        set({ position: { lat, lng }, locationError: null, geohashCell: cell })

        // Re-subscribe if moved to a different geohash cell
        if (cell !== prev.geohashCell && prev.session) {
          get().joinPresenceChannel(cell)
        }

        // Broadcast updated position to current channel
        if (presenceChannel) {
          presenceChannel.track({
            user_id: prev.session?.user?.id,
            username: prev.profile?.username || 'Anonymous',
            lat, lng,
            activity: prev.currentActivity,
            online_at: new Date().toISOString()
          })
        }
      },
      (err) => set({ locationError: err.message }),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    )
  },

  stopLocation: () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
  },

  // ── Presence ──────────────────────────────────────────────────────────────
  nearbyUsers: [],
  currentActivity: 'chill',

  joinPresenceChannel: async (cell) => {
    // Leave old channel first
    if (presenceChannel) {
      await presenceChannel.unsubscribe()
      presenceChannel = null
    }

    const { session, profile, position } = get()
    if (!session || !position) return

    presenceChannel = supabase.channel(`room:${cell}`, {
      config: { presence: { key: session.user.id } }
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const users = Object.values(state)
          .flat()
          .filter(u => u.user_id !== session.user.id)
        set({ nearbyUsers: users })
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        set(s => ({
          nearbyUsers: [
            ...s.nearbyUsers.filter(u => !newPresences.find(n => n.user_id === u.user_id)),
            ...newPresences.filter(n => n.user_id !== session.user.id)
          ]
        }))
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        set(s => ({
          nearbyUsers: s.nearbyUsers.filter(
            u => !leftPresences.find(l => l.user_id === u.user_id)
          )
        }))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: session.user.id,
            username: profile?.username || 'Anonymous',
            lat: position.lat,
            lng: position.lng,
            activity: get().currentActivity,
            online_at: new Date().toISOString()
          })
        }
      })
  },

  leavePresenceChannel: async () => {
    if (presenceChannel) {
      await presenceChannel.untrack()
      await presenceChannel.unsubscribe()
      presenceChannel = null
    }
    set({ nearbyUsers: [] })
  },

  setCurrentActivity: (activity) => {
    set({ currentActivity: activity })
  },

  // ── Flares ────────────────────────────────────────────────────────────────
  flares: [],
  flaresLoading: false,
  selectedFlare: null,

  fetchNearbyFlares: async () => {
    const { position } = get()
    if (!position) return
    set({ flaresLoading: true })

    const { data, error } = await supabase.rpc('get_nearby_flares', {
      user_lat: position.lat,
      user_lng: position.lng,
      radius_meters: 2000
    })

    if (!error && data) set({ flares: data })
    set({ flaresLoading: false })
  },

  dropFlare: async (activityType, description) => {
    const { position, session } = get()
    if (!position || !session) return { error: 'Not ready' }

    // Optimistic update
    const tempId = `temp_${Date.now()}`
    const optimistic = {
      id: tempId,
      host_id: session.user.id,
      activity_type: activityType,
      description,
      distance_meters: 0,
      participant_count: 0,
      expires_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      geojson: JSON.stringify({ type: 'Point', coordinates: [position.lng, position.lat] }),
      _pending: true
    }
    set(s => ({ flares: [optimistic, ...s.flares] }))

    const { data, error } = await supabase
      .from('flares')
      .insert({
        host_id: session.user.id,
        activity_type: activityType,
        description,
        location: `POINT(${position.lng} ${position.lat})`,
        expires_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString()
      })
      .select()
      .single()

    if (error) {
      // Rollback optimistic update
      set(s => ({ flares: s.flares.filter(f => f.id !== tempId) }))
      return { error }
    }

    // Replace optimistic with real
    const confirmed = {
      ...optimistic,
      id: data.id,
      _pending: false
    }
    set(s => ({ flares: s.flares.map(f => f.id === tempId ? confirmed : f) }))
    return { data }
  },

  joinFlare: async (flareId) => {
    const { session } = get()
    if (!session) return { error: 'Not authenticated' }

    const { error } = await supabase
      .from('flare_participants')
      .insert({ flare_id: flareId, user_id: session.user.id })

    if (!error) {
      set(s => ({
        flares: s.flares.map(f =>
          f.id === flareId
            ? { ...f, participant_count: Number(f.participant_count) + 1 }
            : f
        )
      }))
    }
    return { error }
  },

  setSelectedFlare: (flare) => set({ selectedFlare: flare }),

  // ── Direct Messages ───────────────────────────────────────────────────────
  conversations: {},
  activeChatFlareId: null,

  openChat: (flare) => {
    set(s => ({
      activeChatFlareId: flare.id,
      conversations: {
        ...s.conversations,
        [flare.id]: s.conversations[flare.id] || { flare, messages: [], unread: 0, channel: null }
      }
    }))
    get().subscribeToMessages(flare)
  },

  closeChat: () => set({ activeChatFlareId: null }),

  subscribeToMessages: (flare) => {
    const { session, conversations } = get()
    if (!session || conversations[flare.id]?.channel) return
    const ch = supabase
      .channel(`chat:${flare.id}`)
      .on('broadcast', { event: 'msg' }, ({ payload }) => {
        set(s => {
          const conv = s.conversations[flare.id] || { flare, messages: [], unread: 0 }
          const isActive = s.activeChatFlareId === flare.id
          return {
            conversations: {
              ...s.conversations,
              [flare.id]: { ...conv, messages: [...conv.messages, payload], unread: isActive ? 0 : conv.unread + 1 }
            }
          }
        })
      })
      .subscribe()
    set(s => ({
      conversations: {
        ...s.conversations,
        [flare.id]: { ...(s.conversations[flare.id] || { flare, messages: [], unread: 0 }), channel: ch }
      }
    }))
  },

  sendMessage: async (flareId, text) => {
    const { session, profile, conversations } = get()
    if (!session || !text.trim()) return
    const conv = conversations[flareId]
    if (!conv?.channel) return
    const msg = {
      id: `${Date.now()}_${session.user.id}`,
      user_id: session.user.id,
      username: profile?.username || 'anon',
      text: text.trim(),
      sent_at: new Date().toISOString()
    }
    set(s => ({
      conversations: {
        ...s.conversations,
        [flareId]: { ...s.conversations[flareId], messages: [...(s.conversations[flareId]?.messages || []), msg] }
      }
    }))
    await conv.channel.send({ type: 'broadcast', event: 'msg', payload: msg })
  },

  clearUnread: (flareId) => {
    set(s => ({
      conversations: { ...s.conversations, [flareId]: { ...s.conversations[flareId], unread: 0 } }
    }))
  },

  // ── Route / Distance (OSRM free API) ──────────────────────────────────────
  activeRoute: null,
  routeLoading: false,

  fetchRoute: async (destLat, destLng, mode = 'walking') => {
    const { position } = get()
    if (!position) return
    set({ routeLoading: true, activeRoute: null })
    const profile = mode === 'cycling' ? 'bike' : 'foot'
    const url = `https://router.project-osrm.org/route/v1/${profile}/${position.lng},${position.lat};${destLng},${destLat}?overview=full&geometries=geojson`
    try {
      const res = await fetch(url)
      const data = await res.json()
      if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route')
      const route = data.routes[0]
      const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
      set({ activeRoute: { coords, distanceKm: (route.distance/1000).toFixed(1), durationMin: Math.ceil(route.duration/60), mode }, routeLoading: false })
    } catch(e) { set({ routeLoading: false }) }
  },

  clearRoute: () => set({ activeRoute: null }),

  // ── Session lifecycle ─────────────────────────────────────────────────────
  startSession: async () => {
    get().startLocation()
    const { geohashCell } = get()
    if (geohashCell) await get().joinPresenceChannel(geohashCell)
    await get().fetchNearbyFlares()

    // Refresh flares every 30s
    get()._flareInterval = setInterval(() => get().fetchNearbyFlares(), 30000)
  },

  stopSession: async () => {
    get().stopLocation()
    await get().leavePresenceChannel()
    if (get()._flareInterval) clearInterval(get()._flareInterval)
  },

  _flareInterval: null
}))
