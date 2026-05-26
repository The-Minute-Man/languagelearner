# Supabase setup — classes & permissions

Run the migration once in your Supabase project:

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Paste the contents of `migrations/001_classes_and_profiles.sql`
3. Click **Run**

This creates:

- **classes** — includes default **Spanish 200** (`slug: spanish-200`)
- **user_profiles** — stores each user’s active class (defaults to Spanish 200 on signup)
- **class_id** on `decks` and `stories` — content is scoped to a class
- **RLS policies** — only `samuel.joseph@live.com` can insert/update/delete decks, cards, and stories; enrolled users can read their class content

After migration, redeploy the web app. Users manage enrollment under **Settings → Class Enrollment**.
