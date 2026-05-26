-- Classes, user profiles, and content scoping for Language Learner
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

-- ---------------------------------------------------------------------------
-- Classes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO classes (slug, name, description)
VALUES ('spanish-200', 'Spanish 200', 'Default course — vocabulary decks and stories for the class.')
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- User profiles (active class membership)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  active_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Link decks & stories to a class
-- ---------------------------------------------------------------------------
ALTER TABLE decks ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- Backfill existing global content to Spanish 200
UPDATE decks
SET class_id = (SELECT id FROM classes WHERE slug = 'spanish-200' LIMIT 1)
WHERE class_id IS NULL AND (is_global = true OR is_global IS NULL);

UPDATE stories
SET class_id = (SELECT id FROM classes WHERE slug = 'spanish-200' LIMIT 1)
WHERE class_id IS NULL AND (is_global = true OR is_global IS NULL);

-- ---------------------------------------------------------------------------
-- Admin helper (content publisher)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_content_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((auth.jwt() ->> 'email') = 'samuel.joseph@live.com', false);
$$;

-- Auto-create profile on signup with default class
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_class_id UUID;
BEGIN
  SELECT id INTO default_class_id FROM classes WHERE slug = 'spanish-200' LIMIT 1;

  INSERT INTO public.user_profiles (user_id, email, active_class_id)
  VALUES (NEW.id, NEW.email, default_class_id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read classes" ON classes;
CREATE POLICY "Authenticated users can read classes"
  ON classes FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users read own profile" ON user_profiles;
CREATE POLICY "Users read own profile"
  ON user_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own profile" ON user_profiles;
CREATE POLICY "Users insert own profile"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own profile" ON user_profiles;
CREATE POLICY "Users update own profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Decks: members read class content; only admin inserts/updates/deletes
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read decks for active class" ON decks;
CREATE POLICY "Read decks for active class"
  ON decks FOR SELECT TO authenticated
  USING (
    public.is_content_admin()
    OR class_id IS NULL
    OR class_id = (
      SELECT active_class_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin insert decks" ON decks;
CREATE POLICY "Admin insert decks"
  ON decks FOR INSERT TO authenticated
  WITH CHECK (public.is_content_admin());

DROP POLICY IF EXISTS "Admin update decks" ON decks;
CREATE POLICY "Admin update decks"
  ON decks FOR UPDATE TO authenticated
  USING (public.is_content_admin())
  WITH CHECK (public.is_content_admin());

DROP POLICY IF EXISTS "Admin delete decks" ON decks;
CREATE POLICY "Admin delete decks"
  ON decks FOR DELETE TO authenticated
  USING (public.is_content_admin());

-- Cards: readable when parent deck is readable; writable by admin only
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read cards for visible decks" ON cards;
CREATE POLICY "Read cards for visible decks"
  ON cards FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM decks d
      WHERE d.id = cards.deck_id
      AND (
        public.is_content_admin()
        OR d.class_id IS NULL
        OR d.class_id = (
          SELECT active_class_id FROM user_profiles
          WHERE user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Admin insert cards" ON cards;
CREATE POLICY "Admin insert cards"
  ON cards FOR INSERT TO authenticated
  WITH CHECK (public.is_content_admin());

DROP POLICY IF EXISTS "Admin update cards" ON cards;
CREATE POLICY "Admin update cards"
  ON cards FOR UPDATE TO authenticated
  USING (public.is_content_admin());

DROP POLICY IF EXISTS "Admin delete cards" ON cards;
CREATE POLICY "Admin delete cards"
  ON cards FOR DELETE TO authenticated
  USING (public.is_content_admin());

-- Stories
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read stories for active class" ON stories;
CREATE POLICY "Read stories for active class"
  ON stories FOR SELECT TO authenticated
  USING (
    public.is_content_admin()
    OR class_id IS NULL
    OR class_id = (
      SELECT active_class_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin insert stories" ON stories;
CREATE POLICY "Admin insert stories"
  ON stories FOR INSERT TO authenticated
  WITH CHECK (public.is_content_admin());

DROP POLICY IF EXISTS "Admin update stories" ON stories;
CREATE POLICY "Admin update stories"
  ON stories FOR UPDATE TO authenticated
  USING (public.is_content_admin());

DROP POLICY IF EXISTS "Admin delete stories" ON stories;
CREATE POLICY "Admin delete stories"
  ON stories FOR DELETE TO authenticated
  USING (public.is_content_admin());
