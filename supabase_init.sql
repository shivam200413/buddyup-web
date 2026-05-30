-- ============================================================
--  BuddyUp — Supabase Database Initialization Script
--  Run this in Supabase > SQL Editor > New Query
-- ============================================================

-- 1. Extensions
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_cron;    -- may need Supabase Pro; see note below


-- 2. Tables
-- ─────────────────────────────────────────────────────────────

-- Users (mirrors auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE NOT NULL CHECK (username ~ '^[a-z0-9_]{3,20}$'),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Flares (active activity invitations)
CREATE TABLE IF NOT EXISTS public.flares (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type    TEXT NOT NULL,
  description      TEXT CHECK (char_length(description) <= 80),
  location         GEOGRAPHY(POINT, 4326) NOT NULL,
  radius_meters    INT NOT NULL DEFAULT 2000,
  max_participants INT NOT NULL DEFAULT 20,
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '2 hours',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CRITICAL spatial index — without this ST_DWithin does a full table scan
CREATE INDEX IF NOT EXISTS flares_location_gist ON public.flares USING GIST(location);

-- Flare participants
CREATE TABLE IF NOT EXISTS public.flare_participants (
  flare_id  UUID NOT NULL REFERENCES public.flares(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (flare_id, user_id)
);


-- 3. RPC: get_nearby_flares
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_nearby_flares(
  user_lat      FLOAT,
  user_lng      FLOAT,
  radius_meters FLOAT DEFAULT 2000
)
RETURNS TABLE (
  id                UUID,
  host_id           UUID,
  activity_type     TEXT,
  description       TEXT,
  expires_at        TIMESTAMPTZ,
  distance_meters   FLOAT,
  geojson           TEXT,
  participant_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    f.id,
    f.host_id,
    f.activity_type,
    f.description,
    f.expires_at,
    ST_Distance(
      f.location,
      ST_Point(user_lng, user_lat)::GEOGRAPHY
    )                          AS distance_meters,
    ST_AsGeoJSON(f.location)   AS geojson,
    COUNT(fp.user_id)          AS participant_count
  FROM public.flares f
  LEFT JOIN public.flare_participants fp ON fp.flare_id = f.id
  WHERE
    f.expires_at > NOW()
    AND ST_DWithin(
      f.location,
      ST_Point(user_lng, user_lat)::GEOGRAPHY,
      radius_meters
    )
  GROUP BY f.id
  ORDER BY distance_meters ASC;
$$;


-- 4. Rate Limit Trigger: max 3 active flares per user
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_flare_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM public.flares
    WHERE host_id = NEW.host_id
      AND expires_at > NOW()
  ) >= 3 THEN
    RAISE EXCEPTION 'You can only have 3 active flares at a time';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_flare_limit ON public.flares;
CREATE TRIGGER enforce_flare_limit
  BEFORE INSERT ON public.flares
  FOR EACH ROW EXECUTE FUNCTION public.check_flare_limit();


-- 5. Auto-create user profile on signup
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Profile is created manually by the user choosing a username.
  -- This trigger is a no-op placeholder for future onboarding automation.
  RETURN NEW;
END;
$$;


-- 6. Row Level Security (RLS)
-- ─────────────────────────────────────────────────────────────

-- users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- flares
ALTER TABLE public.flares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read active flares"
  ON public.flares FOR SELECT
  TO authenticated
  USING (expires_at > NOW());

CREATE POLICY "Authenticated users can create flares"
  ON public.flares FOR INSERT
  TO authenticated
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "Host can delete own flares"
  ON public.flares FOR DELETE
  TO authenticated
  USING (host_id = auth.uid());

-- flare_participants
ALTER TABLE public.flare_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read participants"
  ON public.flare_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can join flares"
  ON public.flare_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());


-- 7. Realtime — enable for presence & flare updates
-- ─────────────────────────────────────────────────────────────
-- Run in Supabase dashboard: Database > Replication
-- Or via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE public.flares;
ALTER PUBLICATION supabase_realtime ADD TABLE public.flare_participants;


-- 8. Cron job — purge expired flares (requires pg_cron / Supabase Pro)
-- If on free tier, skip this; expired flares are filtered by expires_at > NOW() everywhere.
-- Uncomment when on Pro:
--
-- SELECT cron.schedule(
--   'purge-expired-flares',
--   '0 * * * *',
--   $$ DELETE FROM public.flares WHERE expires_at < NOW() - INTERVAL '1 hour' $$
-- );


-- ============================================================
--  Done! Your BuddyUp schema is ready.
-- ============================================================


-- ============================================================
--  PHASE 2 ADDITIONS — Run after initial schema
-- ============================================================

-- 9. Messages table (persistent DM history per flare)
-- ─────────────────────────────────────────────────────────────
-- Note: Real-time delivery uses Supabase Broadcast (no DB writes needed
-- for ephemeral chat). Use this table only if you want persistent history.
-- For MVP, Broadcast-only is simpler and has no storage cost.

CREATE TABLE IF NOT EXISTS public.messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flare_id   UUID NOT NULL REFERENCES public.flares(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text       TEXT NOT NULL CHECK (char_length(text) <= 500),
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_flare_id_idx ON public.messages(flare_id, sent_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read flare messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.flare_participants
      WHERE flare_id = messages.flare_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.flares
      WHERE id = messages.flare_id AND host_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.flare_participants
        WHERE flare_id = messages.flare_id AND user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.flares
        WHERE id = messages.flare_id AND host_id = auth.uid()
      )
    )
  );
