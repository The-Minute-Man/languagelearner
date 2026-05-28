import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_EMAIL, DEFAULT_CLASS_SLUG, DEFAULT_CLASS_NAME, profileStorageKey } from '../utils/constants';
import { isMissingProfilesTable, loadLocalProfile, saveLocalProfile } from '../utils/storage';

const isValidSupabaseUrl = (url) => {
  try { return url && new URL(url).protocol.startsWith('http'); }
  catch { return false; }
};
const supabaseAutoClient = isValidSupabaseUrl(SUPABASE_URL) && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'undefined'
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export function useAuth() {
  const [session, setSession] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState(supabaseAutoClient);
  const [dbConnected, setDbConnected] = useState(false);
  const [dbError, setDbError] = useState("");

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!supabaseAutoClient) {
      setDbError("No Supabase env vars found. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.");
      return;
    }

    let mounted = true;
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabaseAutoClient.auth.getSession();
        if (error) console.warn("Supabase auth session error:", error);
        if (mounted) setSession(data?.session ?? null);
      } catch (err) {
        console.error("Failed to load auth session:", err);
      }
    };

    initializeAuth();
    const { data: { subscription } } = supabaseAutoClient.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });

    const checkConnection = async () => {
      try {
        const { error } = await supabaseAutoClient.from('decks').select('id').limit(1);
        if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
          console.warn("Supabase check:", error);
        }
        setDbConnected(true);
        setSupabaseClient(supabaseAutoClient);
      } catch (err) {
        console.error("Supabase connection failed:", err);
        setDbError("Could not reach Supabase. Check your project status.");
      }
    };
    checkConnection();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    if (!supabaseAutoClient) {
      setAuthError("Unable to authenticate: Supabase client is not initialized.");
      setAuthLoading(false);
      return;
    }

    try {
      if (authView === 'login') {
        const { data, error } = await supabaseAutoClient.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
        if (data?.session) setSession(data.session);
      } else {
        const { data, error } = await supabaseAutoClient.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
        if (data?.session) {
          setSession(data.session);
        } else {
          setAuthError("Sign up successful. Check your email to confirm your account before signing in.");
        }
      }
    } catch (error) {
      setAuthError(error?.message ?? "Authentication failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabaseAutoClient) return;
    await supabaseAutoClient.auth.signOut();
    setSession(null);
  };

  return {
    session, setSession,
    authView, setAuthView,
    authEmail, setAuthEmail,
    authPassword, setAuthPassword,
    authError, setAuthError,
    authLoading,
    supabaseClient,
    dbConnected,
    dbError,
    isAdmin,
    handleAuthSubmit,
    handleSignOut,
  };
}
