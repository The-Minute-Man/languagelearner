-- Run this in Supabase Dashboard → SQL Editor → Run
-- Fixes: missing user_profiles, classes without slug, duplicate Spanish 200 rows

-- 1) Add slug to existing classes table (if you created classes without it)
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2) Remove duplicate "Spanish 200" rows (keep the oldest)
DELETE FROM public.classes a
USING public.classes b
WHERE a.name = 'Spanish 200'
  AND b.name = 'Spanish 200'
  AND a.id <> b.id
  AND a.created_at > b.created_at;

-- 3) Ensure one default class row
INSERT INTO public.classes (slug, name, description)
SELECT 'spanish-200', 'Spanish 200', 'Default course — vocabulary decks and stories for the class.'
WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE name = 'Spanish 200');

UPDATE public.classes
SET slug = 'spanish-200',
    description = COALESCE(description, 'Default course — vocabulary decks and stories for the class.')
WHERE name = 'Spanish 200' AND (slug IS NULL OR slug = '');

CREATE UNIQUE INDEX IF NOT EXISTS classes_slug_key ON public.classes (slug);

-- 4) User profiles (class membership)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  active_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  study_progress JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS study_progress JSONB DEFAULT '{}'::jsonb;

-- 5) Link decks & stories to classes
ALTER TABLE public.decks ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

-- Ensure expected columns exist (app uses these fields)
ALTER TABLE public.decks ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;

UPDATE public.decks
SET class_id = (SELECT id FROM public.classes WHERE slug = 'spanish-200' OR name = 'Spanish 200' ORDER BY created_at LIMIT 1)
WHERE class_id IS NULL;

UPDATE public.stories
SET class_id = (SELECT id FROM public.classes WHERE slug = 'spanish-200' OR name = 'Spanish 200' ORDER BY created_at LIMIT 1)
WHERE class_id IS NULL;

-- 6) Admin helper + auto-enroll on signup
CREATE OR REPLACE FUNCTION public.is_content_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((auth.jwt() ->> 'email') = 'samuel.joseph@live.com', false);
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_class_id UUID;
BEGIN
  SELECT id INTO default_class_id
  FROM public.classes
  WHERE slug = 'spanish-200'
  LIMIT 1;

  IF default_class_id IS NULL THEN
    SELECT id INTO default_class_id
    FROM public.classes
    WHERE name = 'Spanish 200'
    ORDER BY created_at
    LIMIT 1;
  END IF;

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

-- 7) Row Level Security
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read classes" ON public.classes;
CREATE POLICY "Authenticated users can read classes"
  ON public.classes FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users read own profile" ON public.user_profiles;
CREATE POLICY "Users read own profile"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own profile" ON public.user_profiles;
CREATE POLICY "Users insert own profile"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own profile" ON public.user_profiles;
CREATE POLICY "Users update own profile"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read decks for active class" ON public.decks;
CREATE POLICY "Read decks for active class"
  ON public.decks FOR SELECT TO authenticated
  USING (
    public.is_content_admin()
    OR class_id IS NULL
    OR class_id = (SELECT active_class_id FROM public.user_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin insert decks" ON public.decks;
CREATE POLICY "Admin insert decks"
  ON public.decks FOR INSERT TO authenticated
  WITH CHECK (public.is_content_admin());

DROP POLICY IF EXISTS "Admin update decks" ON public.decks;
CREATE POLICY "Admin update decks"
  ON public.decks FOR UPDATE TO authenticated
  USING (public.is_content_admin())
  WITH CHECK (public.is_content_admin());

DROP POLICY IF EXISTS "Admin delete decks" ON public.decks;
CREATE POLICY "Admin delete decks"
  ON public.decks FOR DELETE TO authenticated
  USING (public.is_content_admin());

DROP POLICY IF EXISTS "Read cards for visible decks" ON public.cards;
CREATE POLICY "Read cards for visible decks"
  ON public.cards FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.decks d
      WHERE d.id = cards.deck_id
      AND (
        public.is_content_admin()
        OR d.class_id IS NULL
        OR d.class_id = (SELECT active_class_id FROM public.user_profiles WHERE user_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Admin insert cards" ON public.cards;
CREATE POLICY "Admin insert cards"
  ON public.cards FOR INSERT TO authenticated
  WITH CHECK (public.is_content_admin());

DROP POLICY IF EXISTS "Admin update cards" ON public.cards;
CREATE POLICY "Admin update cards"
  ON public.cards FOR UPDATE TO authenticated
  USING (public.is_content_admin());

DROP POLICY IF EXISTS "Admin delete cards" ON public.cards;
CREATE POLICY "Admin delete cards"
  ON public.cards FOR DELETE TO authenticated
  USING (public.is_content_admin());

DROP POLICY IF EXISTS "Read stories for active class" ON public.stories;
CREATE POLICY "Read stories for active class"
  ON public.stories FOR SELECT TO authenticated
  USING (
    public.is_content_admin()
    OR class_id IS NULL
    OR class_id = (SELECT active_class_id FROM public.user_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin insert stories" ON public.stories;
CREATE POLICY "Admin insert stories"
  ON public.stories FOR INSERT TO authenticated
  WITH CHECK (public.is_content_admin());

DROP POLICY IF EXISTS "Admin update stories" ON public.stories;
CREATE POLICY "Admin update stories"
  ON public.stories FOR UPDATE TO authenticated
  USING (public.is_content_admin());

DROP POLICY IF EXISTS "Admin delete stories" ON public.stories;
CREATE POLICY "Admin delete stories"
  ON public.stories FOR DELETE TO authenticated
  USING (public.is_content_admin());

-- 8) Enroll existing users into Spanish 200
INSERT INTO public.user_profiles (user_id, email, active_class_id)
SELECT
  u.id,
  u.email,
  (SELECT id FROM public.classes WHERE slug = 'spanish-200' OR name = 'Spanish 200' ORDER BY created_at LIMIT 1)
FROM auth.users u
ON CONFLICT (user_id) DO UPDATE
SET active_class_id = COALESCE(
  public.user_profiles.active_class_id,
  EXCLUDED.active_class_id
);
