# BuddyUp 🔥

> Hyper-local, real-time activity discovery. Open the app → appear on the map → find people nearby doing the same thing right now. Close the app → you vanish.

**Live demo:** Deploy to Vercel in 2 minutes (see below)

---

## Feature Overview

| Feature | Status | Tech |
|---|---|---|
| Live radar map (OSM) | ✅ Phase 1 | Leaflet + CartoDB dark tiles |
| Presence-based user markers | ✅ Phase 1 | Supabase Realtime Presence |
| Flare system (drop/join/expire) | ✅ Phase 1 | Supabase PostGIS RPC |
| Email auth (magic link + password) | ✅ Phase 1 | Supabase Auth |
| Direct messaging (per flare) | ✅ Phase 2 | Supabase Broadcast |
| Route planner + ETA | ✅ Phase 2 | OSRM free API |
| AI chatbot (BuddyBot) | ✅ Phase 2 | Claude Haiku API |
| Bottom navigation bar | ✅ Phase 2 | Built-in |

---

## Project Structure

```
buddyup/
├── src/
│   ├── lib/
│   │   ├── supabase.js           ← Supabase client + activity types
│   │   └── store.js              ← Zustand store (auth, location, presence,
│   │                                flares, DMs, routing)
│   ├── pages/
│   │   ├── AuthPage.jsx          ← Magic link + password login
│   │   └── MapPage.jsx           ← Main screen with bottom nav
│   ├── components/
│   │   ├── TopBar.jsx            ← Online count + profile menu
│   │   ├── FlareMarkers.jsx      ← Leaflet flare markers
│   │   ├── BuddyMarkers.jsx      ← Live presence markers
│   │   ├── UserMarker.jsx        ← Your own position
│   │   ├── RouteOverlay.jsx      ← OSRM polyline on map
│   │   ├── RouteCard.jsx         ← Distance/ETA floating card
│   │   ├── ChatWindow.jsx        ← DM chat per flare
│   │   ├── ChatbotPage.jsx       ← BuddyBot AI assistant
│   │   ├── DropFlareSheet.jsx    ← Create flare bottom sheet
│   │   ├── FlareDetailSheet.jsx  ← View/join/route/chat a flare
│   │   ├── ProfileSetup.jsx      ← Username after first login
│   │   ├── RadarPulse.jsx        ← Live/paused indicator
│   │   └── LoadingScreen.jsx
│   ├── styles/global.css
│   ├── App.jsx
│   └── main.jsx
├── supabase_init.sql             ← Full DB schema (run this first)
├── .env.example                  ← Copy to .env and fill in keys
├── vercel.json                   ← SPA routing fix for Vercel
├── vite.config.js
└── package.json
```

---

## Setup Guide

### Step 1 — Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project** (free tier is enough)
2. Pick a name, strong password, nearest region
3. Wait ~2 min for provisioning

### Step 2 — Run the Database Schema

1. Supabase Dashboard → **SQL Editor** → **New Query**
2. Paste the full contents of `supabase_init.sql`
3. Click **Run** — no errors = success

### Step 3 — Configure Email Auth

For local dev (no real emails needed):

Supabase → **Authentication** → **Settings** → scroll to **"Email"** section → toggle **"Enable email confirmations"** OFF

Now sign up with any email, no confirmation needed.

For production: leave confirmations ON and configure your SMTP or use Supabase's built-in email.

### Step 4 — Get API Keys

**Supabase keys:**
Supabase → **Settings** → **API**
- Copy **Project URL**
- Copy **anon public** key

**Claude API key (for BuddyBot — optional):**
Go to [console.anthropic.com](https://console.anthropic.com) → **API Keys** → **Create Key**
Uses `claude-haiku` — approximately $0.001 per conversation, very cheap.
Leave blank in `.env` to disable the chatbot.

### Step 5 — Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_CLAUDE_API_KEY=sk-ant-...   # optional
```

### Step 6 — Install & Run

```bash
npm install
npm run dev
# Opens at http://localhost:5173
```

> **Location:** Browser asks for location permission — allow it. Use Chrome or Firefox (Safari blocks geolocation on localhost).

---

## Feature Details

### Direct Messaging
- Tap any flare → "Chat" button → opens per-flare chat room
- Powered by Supabase Realtime **Broadcast** — no database writes for chat, zero storage cost
- Messages are ephemeral: they exist only while users have the channel open
- Unread badge shows on the Messages nav button
- If you want persistent message history, the `messages` table in the SQL schema is ready — just wire it up

### Route Planner
- Tap any flare → "Route" button
- Calls the free **OSRM public API** (`router.project-osrm.org`) — no API key needed, no cost
- Draws a blue polyline on the map, fits the view to show full route
- Shows distance (km) and ETA (minutes)
- Toggle between walking 🚶 and cycling 🚴 modes
- Route card has a close button to dismiss

### BuddyBot (AI Chatbot)
- Tap 🤖 in the bottom nav
- Powered by **Claude Haiku** via the Anthropic API
- System prompt is context-aware: it knows your username, your GPS position, and all currently nearby flares
- Suggests activities, gives icebreaker questions, meetup safety tips
- Requires `VITE_CLAUDE_API_KEY` in `.env` — shows a clear error if missing

---

## Deploy Free on Vercel

### Option A — CLI (2 minutes)

```bash
npm install -g vercel
vercel
```

When prompted for environment variables, add all three from your `.env`.

### Option B — GitHub + Dashboard

```bash
git init && git add . && git commit -m "buddyup v2"
git remote add origin https://github.com/YOUR_USERNAME/buddyup.git
git push -u origin main
```

1. [vercel.com](https://vercel.com) → **New Project** → import your repo
2. **Environment Variables** → add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CLAUDE_API_KEY`
3. Click **Deploy**

Set your live URL in Supabase → **Authentication** → **URL Configuration** → **Site URL**

---

## Resume Talking Points

- **PostGIS spatial queries** — `ST_DWithin` with GIST indexing; most web devs have never touched geospatial SQL
- **WebSocket presence with geohash sharding** — prevents global channel collapse; shows you understand scale
- **OSRM routing integration** — open-source routing engine, no paid API needed
- **AI context injection** — BuddyBot receives live flare data + GPS in its system prompt, not just a generic chatbot
- **Optimistic UI with rollback** — flare creation feels instant, errors are handled gracefully
- **Session-based ephemeral presence** — a deliberate privacy-first design decision worth explaining
- **PWA** — installable, works on mobile
- **Zero-trust database** — Row Level Security on all tables, users can only touch their own data

---

## Known Limitations (be honest in interviews)

- No push notifications (needs FCM/APNs + Supabase Edge Functions — Phase 3)
- No report/block system (critical before public launch)
- BuddyBot API key is exposed in the browser bundle — fine for a portfolio, not for production (move to an Edge Function proxy for prod)
- pg_cron auto-purge requires Supabase Pro; free tier relies on `expires_at > NOW()` filtering

---

## License

MIT
