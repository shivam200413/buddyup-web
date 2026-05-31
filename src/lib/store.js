import { create } from 'zustand'
import { supabase } from './supabase'
import ngeohash from 'ngeohash'

const GEO_PRECISION = 5

// Module-level refs — never stored in Zustand state to avoid re-renders
let presenceChannel = null
let watchId = null
let flareInterval = null
let lastRouteDest = null  // { lat, lng } — used by RouteCard mode toggle

export const useStore = create((set, get) => ({

  // ── Auth ────────────────────────────────────────────────────────────────────
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
    try {
      const { data } = await supabase
        .from('users').select('*').eq('id', userId).single()
      set({ profile: data || null })
    } catch (_) {
      set({ profile: null })
    }
  },

  signInWithPassword: async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password })
  },

  signUpWithPassword: async (email, password) => {
    return supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin }
    })
  },

  createProfile: async (username) => {
    const { session } = get()
    if (!session) return { error: new Error('Not authenticated') }
    const { data, error } = await supabase
      .from('users')
      .insert({ id: session.user.id, username })
      .select().single()
    if (!error) set({ profile: data })
    return { data, error }
  },

  signOut: async () => {
    // Clear state immediately so UI responds before async work finishes
    set({
      session: null, profile: null,
      nearbyUsers: [], flares: [], selectedFlare: null,
      conversations: {}, activeChatFlareId: null,
      activeRoute: null, routeLoading: false,
      position: null, locationError: null, geohashCell: null
    })
    try { await get().stopSession() } catch (_) {}
    try { await supabase.auth.signOut() } catch (_) {}
  },

  // ── Location ─────────────────────────────────────────────────────────────
  position: null,
  locationError: null,
  geohashCell: null,

  startLocation: () => {
    if (!navigator.geolocation) {
      set({ locationError: 'Geolocation not supported in this browser' })
      return
    }
    // Don't double-start
    if (watchId !== null) return

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const cell = ngeohash.encode(lat, lng, GEO_PRECISION)
        const prev = get()

        set({ position: { lat, lng }, locationError: null, geohashCell: cell })

        // Re-subscribe presence if moved to a new geohash cell
        if (cell !== prev.geohashCell && prev.session) {
          get().joinPresenceChannel(cell)
        }

        // Broadcast position update to current channel
        if (presenceChannel && prev.session) {
          presenceChannel.track({
            user_id: prev.session.user.id,
            username: prev.profile?.username || 'Anonymous',
            lat, lng,
            activity: prev.currentActivity || 'chill',
            online_at: new Date().toISOString()
          }).catch(() => {})
        }
      },
      (err) => {
        const msg = err.code === 1
          ? 'Location permission denied — allow it in browser settings'
          : err.code === 2
          ? 'Location unavailable — check GPS signal'
          : 'Location timed out'
        set({ locationError: msg })
      },
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
    // Unsubscribe old channel before joining new one
    if (presenceChannel) {
      try { await presenceChannel.unsubscribe() } catch (_) {}
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
        const users = Object.values(state).flat()
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
          try {
            await presenceChannel.track({
              user_id: session.user.id,
              username: profile?.username || 'Anonymous',
              lat: position.lat,
              lng: position.lng,
              activity: get().currentActivity || 'chill',
              online_at: new Date().toISOString()
            })
          } catch (_) {}
        }
      })
  },

  leavePresenceChannel: async () => {
    if (presenceChannel) {
      try { await presenceChannel.untrack() } catch (_) {}
      try { await presenceChannel.unsubscribe() } catch (_) {}
      presenceChannel = null
    }
    set({ nearbyUsers: [] })
  },

  setCurrentActivity: (activity) => set({ currentActivity: activity }),

  // ── Flares ────────────────────────────────────────────────────────────────
  flares: [],
  flaresLoading: false,
  selectedFlare: null,

  fetchNearbyFlares: async () => {
    const { position } = get()
    if (!position) return
    set({ flaresLoading: true })
    try {
      const { data, error } = await supabase.rpc('get_nearby_flares', {
        user_lat: position.lat,
        user_lng: position.lng,
        radius_meters: 2000
      })
      if (!error && data) set({ flares: data })
    } catch (_) {}
    set({ flaresLoading: false })
  },

  dropFlare: async (activityType, description) => {
    const { position, session } = get()
    if (!position || !session) return { error: { message: 'GPS not ready yet' } }

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
        description: description || null,
        location: `POINT(${position.lng} ${position.lat})`,
        expires_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString()
      })
      .select().single()

    if (error) {
      set(s => ({ flares: s.flares.filter(f => f.id !== tempId) }))
      return { error }
    }

    set(s => ({
      flares: s.flares.map(f =>
        f.id === tempId ? { ...optimistic, id: data.id, _pending: false } : f
      )
    }))
    return { data }
  },

  joinFlare: async (flareId) => {
    const { session } = get()
    if (!session) return { error: { message: 'Not authenticated' } }
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
              [flare.id]: {
                ...conv,
                messages: [...conv.messages, payload],
                unread: isActive ? 0 : conv.unread + 1
              }
            }
          }
        })
      })
      .subscribe()

    set(s => ({
      conversations: {
        ...s.conversations,
        [flare.id]: {
          ...(s.conversations[flare.id] || { flare, messages: [], unread: 0 }),
          channel: ch
        }
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
        [flareId]: {
          ...s.conversations[flareId],
          messages: [...(s.conversations[flareId]?.messages || []), msg]
        }
      }
    }))
    try {
      await conv.channel.send({ type: 'broadcast', event: 'msg', payload: msg })
    } catch (_) {}
  },

  clearUnread: (flareId) => {
    set(s => ({
      conversations: {
        ...s.conversations,
        [flareId]: { ...s.conversations[flareId], unread: 0 }
      }
    }))
  },

  // ── Routing (OSRM) ────────────────────────────────────────────────────────
  activeRoute: null,
  routeLoading: false,

  fetchRoute: async (destLat, destLng, mode = 'walking') => {
    const { position } = get()
    if (!position) return
    // Store dest for mode-toggle re-fetch
    lastRouteDest = { lat: destLat, lng: destLng }
    set({ routeLoading: true, activeRoute: null })
    const osrmProfile = mode === 'cycling' ? 'bike' : 'foot'
    const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${position.lng},${position.lat};${destLng},${destLat}?overview=full&geometries=geojson`
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`OSRM ${res.status}`)
      const data = await res.json()
      if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route found')
      const route = data.routes[0]
      const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
      set({
        activeRoute: {
          coords,
          distanceKm: (route.distance / 1000).toFixed(1),
          durationMin: Math.ceil(route.duration / 60),
          mode
        },
        routeLoading: false
      })
    } catch (e) {
      console.warn('Route fetch failed:', e.message)
      set({ routeLoading: false })
    }
  },

  refetchRouteWithMode: (mode) => {
    if (lastRouteDest) {
      get().fetchRoute(lastRouteDest.lat, lastRouteDest.lng, mode)
    }
  },

  clearRoute: () => {
    lastRouteDest = null
    set({ activeRoute: null })
  },

  // ── Session lifecycle ─────────────────────────────────────────────────────
  startSession: async () => {
    get().startLocation()
    // Join presence only once we have a geohash cell (may come from watchPosition callback)
    const { geohashCell, session } = get()
    if (geohashCell && session) await get().joinPresenceChannel(geohashCell)
    await get().fetchNearbyFlares()

    // Refresh flares every 30s — guard against double-interval
    if (flareInterval) clearInterval(flareInterval)
    flareInterval = setInterval(() => get().fetchNearbyFlares(), 30000)
  },

  stopSession: async () => {
    get().stopLocation()
    await get().leavePresenceChannel()
    if (flareInterval) { clearInterval(flareInterval); flareInterval = null }
  }
}))
