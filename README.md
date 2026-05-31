# BuddyUp

A hyper-local activity discovery app. Open it, appear on a live map, see who else is nearby and what they're doing. Drop a flare — a short-lived invite to join you for a run, a game, coffee, whatever. Close the app and you vanish instantly. No followers, no feed, no history.

Built as a progressive web app with a real-time backend. Works in any mobile browser and installs to the home screen.

---

## What it does

When you open BuddyUp, your device shares your GPS coordinates with a Supabase Realtime presence channel. Everyone else who has the app open shows up as a live dot on an OpenStreetMap map. You can see their activity status, how far they are from you, and open a direct chat.

Flares are the core mechanic. You drop one when you want company for something — it pins to your location, broadcasts to everyone within 2km, and expires automatically after two hours. Others can tap it, see the details, get walking or cycling directions, and join with one button. When they join, you both appear in the same chat room.

The AI assistant (BuddyBot) knows your location and can see all nearby flares in real time, so it gives contextually useful responses rather than generic ones.

---

## Features

- Live radar map showing active users nearby via WebSocket presence
- Flare system — drop, join, and expire activity invitations with PostGIS distance queries
- Per-flare real-time chat using Supabase Broadcast channels
- Walking and cycling route planner with live ETA using the OSRM open routing API
- BuddyBot AI assistant powered by Google Gemini with location and flare context injected
- Email magic link and password authentication
- Geohash-based presence channel sharding so the system scales beyond a single city
- Optimistic UI on flare creation with rollback on failure
- PWA — installable on Android from the browser, works offline for the map layer
- Session-based presence: you leave the map the moment you switch apps

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Vite | Fast build tooling, great ecosystem |
| State | Zustand | Minimal boilerplate, works well with async Supabase calls |
| Map | Leaflet + react-leaflet | Free, no API key, OpenStreetMap tiles via CartoDB |
| Backend | Supabase | Postgres + Realtime + Auth in one platform |
| Database | PostgreSQL + PostGIS | `ST_DWithin` for spatial proximity queries |
| Real-time | Supabase Realtime Presence + Broadcast | WebSocket presence for live user tracking |
| Routing | OSRM public API | Open-source routing engine, completely free |
| AI | Google Gemini 2.0 Flash | Free tier (1500 req/day), no billing setup needed |
| Deployment | Vercel | Auto-deploys on every git push |

---

## Project structure

```
buddyup/
│
├── src/
│   ├── lib/
│   │   ├── supabase.js        Supabase client initialisation + activity type definitions
│   │   └── store.js           Zustand store — auth, GPS, presence, flares, DMs, routing
│   │
│   ├── pages/
│   │   ├── AuthPage.jsx       Login flow — magic link, password sign-in, sign-up
│   │   └── MapPage.jsx        Main screen — map, nav bar, sheet management
│   │
│   ├── components/
│   │   ├── TopBar.jsx         Online count, flare count, profile menu
│   │   ├── UserMarker.jsx     Pulsing blue dot for your own position
│   │   ├── FlareMarkers.jsx   Leaflet markers for each nearby flare
│   │   ├── BuddyMarkers.jsx   Live markers for other online users from presence state
│   │   ├── RouteOverlay.jsx   Polyline drawn on map from OSRM route coordinates
│   │   ├── RouteCard.jsx      Floating card showing distance and ETA
│   │   ├── ChatWindow.jsx     Per-flare direct message panel
│   │   ├── ChatbotPage.jsx    BuddyBot AI chat interface
│   │   ├── DropFlareSheet.jsx Bottom sheet — activity picker and optional note
│   │   ├── FlareDetailSheet  Bottom sheet — flare info, join, route, chat buttons
│   │   ├── ProfileSetup.jsx   Username picker shown after first login
│   │   ├── RadarPulse.jsx     Live/paused indicator in bottom left
│   │   └── LoadingScreen.jsx  Spinner shown during auth initialisation
│   │
│   ├── styles/
│   │   └── global.css         Design tokens, Leaflet overrides, animations
│   │
│   ├── App.jsx                Route between auth, profile setup, and map screens
│   └── main.jsx               React entry point
│
├── supabase_init.sql          Full database schema — run this once to set up Supabase
├── .env.example               Environment variable template
├── vercel.json                SPA routing rule for Vercel
├── vite.config.js             Vite config with PWA plugin
└── package.json
```

---

## How the real-time system works

Understanding this is useful if you want to extend the project.

**Presence (live user dots)**

When the app opens, it computes a geohash from your GPS coordinates at precision 5, which gives a roughly 5×5km grid cell. You subscribe to a Supabase Realtime channel named `room:geohash_<cell>` — for example `room:u09tv`. You broadcast your `user_id`, `username`, `lat`, `lng`, and current activity to that channel every time your GPS updates.

Everyone else in the same cell sees your dot appear. When you close the app or switch tabs, the WebSocket drops and you disappear from their maps immediately. No database writes happen for presence — it's entirely in-memory.

If you move far enough to enter a different geohash cell, the client automatically unsubscribes from the old channel and subscribes to the new one.

**Flares (PostGIS proximity)**

Flares are stored in Postgres with a `GEOGRAPHY(POINT, 4326)` column. A GIST spatial index sits on that column. When the app loads or refreshes, it calls a Postgres function `get_nearby_flares(lat, lng, radius)` which runs:

```sql
WHERE ST_DWithin(location, ST_Point(lng, lat)::GEOGRAPHY, radius_meters)
AND expires_at > NOW()
```

This returns flares sorted by distance, including a participant count and a GeoJSON representation of each location for the map. The client parses the GeoJSON coordinates and places Leaflet markers.

**Chat (Broadcast)**

Each flare chat room uses Supabase Broadcast — ephemeral messages sent over a WebSocket channel named `chat:<flare_id>`. Messages are never written to the database, which means zero storage cost and automatic cleanup when the flare expires. If you want persistent chat history, there is a `messages` table already defined in the SQL schema waiting to be wired up.

---

## Getting started

### Prerequisites

- Node.js 18 or higher
- A Supabase account (free at supabase.com)
- A Google AI Studio account for the chatbot (free at aistudio.google.com)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/buddyup.git
cd buddyup
npm install
```

### 2. Set up Supabase

Go to [supabase.com](https://supabase.com), create a new project, and wait for it to provision (~2 minutes).

Then go to **SQL Editor → New Query**, paste the entire contents of `supabase_init.sql`, and run it. This creates all the tables, spatial index, RPC function, rate-limit trigger, and RLS policies in one shot.

For local development, go to **Authentication → Settings** and turn off email confirmations so you can sign up without clicking an email link.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_GEMINI_API_KEY=your_gemini_key_here
```

**Supabase keys** — Dashboard → Settings → API → Project URL and anon public key.

**Gemini key** — Go to [aistudio.google.com](https://aistudio.google.com) → Get API Key → Create API key in new project. The chatbot works without this key, it just shows an error message when opened.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). When the browser asks for location permission, allow it. Use Chrome or Firefox — Safari restricts geolocation on localhost.

---

## Deploying to Vercel

### Via CLI

```bash
npm install -g vercel
vercel
```

Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_GEMINI_API_KEY` when prompted for environment variables.

### Via GitHub

Push to GitHub, then import the repository at [vercel.com](https://vercel.com). Add the three environment variables under Project Settings → Environment Variables, then deploy.

After deploying, copy your live URL and go to **Supabase → Authentication → URL Configuration**. Set the Site URL to your Vercel URL and add it to the Redirect URLs list. Without this, magic link emails redirect to localhost instead of your live site.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key for client-side access |
| `VITE_GEMINI_API_KEY` | No | Google Gemini API key for BuddyBot. Get one free at aistudio.google.com |

---

## Database schema overview

```
users               id, username, avatar_url
flares              id, host_id, activity_type, description,
                    location (GEOGRAPHY), expires_at
flare_participants  flare_id, user_id, joined_at  [composite PK]
messages            id, flare_id, user_id, text, sent_at  [optional persistence]
```

Row Level Security is enabled on all tables. Users can only insert flares where `host_id = auth.uid()`. A trigger enforces a maximum of 3 active flares per user at any time. Expired flares are filtered out at query time via `expires_at > NOW()`.

---

## Known limitations

These are honest gaps, not oversights. They would need to be addressed before any serious public launch.

**No push notifications on iOS.** iOS Safari does not support the Web Push API for PWAs. On Android Chrome and desktop browsers, push works fine through the Web Push API and VAPID keys. Getting iOS push requires a native app.

**No report or block system.** There is no way for users to flag inappropriate behaviour or block someone from appearing on their map. This is the most important missing safety feature.

**Gemini API key is in the browser bundle.** For a portfolio project this is acceptable, but in production the API call should go through a Supabase Edge Function acting as a proxy. This keeps the key server-side only.

**No cron job on free tier.** Expired flares are filtered by `expires_at > NOW()` in all queries, so they never appear to users. However they accumulate in the database. The `pg_cron` setup in the SQL file is commented out because it requires Supabase Pro. On the free tier you'd need to clear them manually or write a lightweight cleanup script.

---

## Running on mobile right now

The app is a PWA, so you don't need to install anything from a store.

On Android: open the Vercel URL in Chrome, tap the three-dot menu, and select "Add to Home Screen". The app installs with a home screen icon and runs in standalone mode.

On iOS: open in Safari, tap the Share button, then "Add to Home Screen". Location access works, though push notifications don't.

---

## License

MIT
