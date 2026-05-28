// Configuration & Constants for Language Learner App

// Supabase environment
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// App versioning
export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '0.0.0';
export const APP_BUILD_ID = import.meta.env.VITE_BUILD_ID ?? 'dev';
export const APP_DISPLAY_VERSION = `${APP_VERSION}.${APP_BUILD_ID}`;

// Admin & Class defaults
export const ADMIN_EMAIL = 'samuel.joseph@live.com';
export const DEFAULT_CLASS_SLUG = 'spanish-200';
export const DEFAULT_CLASS_NAME = 'Spanish 200';

// Storage keys
export const profileStorageKey = (userId) => `languagelearner_profile_${userId}`;
export const studyProgressStorageKey = (userId) => `languagelearner_study_progress_${userId}`;
export const darkModeStorageKey = 'languagelearner_dark_mode';

// Practice mode help
export const PRACTICE_SYNTAX_HELP = `# Comments start with #
# Shared context (multi-line until blank line or next directive)
@context exam1
Read the passage once. Maria va al mercado cada sábado.

# Normal question (standalone)
Q: Translate "hola" | hello

# Context question (reuses @exam1 — passage shown automatically)
@exam1 Q: Where does Maria go? | al mercado

# Legacy one-liners still work:
¿Cómo se dice "book"? | el libro`;
