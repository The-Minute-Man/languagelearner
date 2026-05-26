# Supabase setup — classes & permissions

## Quick fix (use this if you see “Default class is not set up yet”)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Paste the full contents of **`setup_now.sql`** (in this folder)
3. Click **Run**
4. Refresh the Language Learner app

`setup_now.sql` works with an existing `classes` table (adds `slug`, removes duplicate Spanish 200 rows, creates `user_profiles`, and RLS).

## Full migration (new projects)

Paste `migrations/001_classes_and_profiles.sql` instead if you are starting from scratch.

This creates:

- **classes** — includes default **Spanish 200** (`slug: spanish-200`)
- **user_profiles** — stores each user’s active class (defaults to Spanish 200 on signup)
- **class_id** on `decks` and `stories` — content is scoped to a class
- **RLS policies** — only `samuel.joseph@live.com` can insert/update/delete decks, cards, and stories; enrolled users can read their class content

After migration, redeploy the web app. Users manage enrollment under **Settings → Class Enrollment**.
