import { useState, useEffect } from 'react';
import { DEFAULT_CLASS_SLUG, DEFAULT_CLASS_NAME } from '../utils/constants';
import { isMissingProfilesTable, loadLocalProfile, saveLocalProfile } from '../utils/storage';

export function useClasses(supabaseClient, session, dbConnected) {
  const [availableClasses, setAvailableClasses] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [classActionLoading, setClassActionLoading] = useState(false);

  const activeClassId = userProfile?.active_class_id ?? null;
  const activeClass = availableClasses.find((c) => c.id === activeClassId) ?? null;
  const isInClass = Boolean(activeClassId);

  const getDefaultClassId = async () => {
    const fromList = availableClasses.find((c) => c.slug === DEFAULT_CLASS_SLUG || c.name === DEFAULT_CLASS_NAME) ?? availableClasses[0];
    if (fromList?.id) return fromList.id;
    if (!supabaseClient) return null;

    const { data: byName } = await supabaseClient
      .from('classes')
      .select('id')
      .eq('name', DEFAULT_CLASS_NAME)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (byName?.id) return byName.id;

    const { data: bySlug } = await supabaseClient
      .from('classes')
      .select('id')
      .eq('slug', DEFAULT_CLASS_SLUG)
      .maybeSingle();
    if (bySlug?.id) return bySlug.id;

    const { data: anyClass } = await supabaseClient
      .from('classes')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    return anyClass?.id ?? null;
  };

  const resolvePublishClassId = async () => {
    if (activeClassId) return activeClassId;
    return getDefaultClassId();
  };

  const fetchAvailableClasses = async () => {
    if (!supabaseClient) return;
    const { data, error } = await supabaseClient
      .from('classes')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Fetch classes error:', error);
      return;
    }
    const seen = new Set();
    const unique = (data || []).filter((c) => {
      const key = c.slug || c.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setAvailableClasses(unique);
  };

  const applyLocalProfile = (profile) => {
    saveLocalProfile(session.user.id, profile);
    setUserProfile(profile);
    return profile;
  };

  const fetchUserProfile = async () => {
    if (!supabaseClient || !session) return null;
    const { data, error } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!error) {
      if (data) {
        saveLocalProfile(session.user.id, data);
        setUserProfile(data);
        return data;
      }
      const local = loadLocalProfile(session.user.id);
      if (local) {
        setUserProfile(local);
        return local;
      }
      return null;
    }

    if (isMissingProfilesTable(error)) {
      const local = loadLocalProfile(session.user.id);
      if (local) {
        setUserProfile(local);
        return local;
      }
      return null;
    }

    console.error('Fetch profile error:', error);
    return null;
  };

  const ensureUserProfile = async () => {
    if (!supabaseClient || !session) return;
    setProfileLoading(true);
    try {
      const existing = await fetchUserProfile();
      if (existing) return existing;

      const defaultClassId = await getDefaultClassId();
      const { data: created, error } = await supabaseClient
        .from('user_profiles')
        .insert({
          user_id: session.user.id,
          email: session.user.email,
          active_class_id: defaultClassId,
        })
        .select()
        .single();

      if (!error) {
        setUserProfile(created);
        saveLocalProfile(session.user.id, created);
        return created;
      }

      if (isMissingProfilesTable(error)) {
        return applyLocalProfile({
          user_id: session.user.id,
          email: session.user.email,
          active_class_id: defaultClassId,
        });
      }
      throw error;
    } catch (err) {
      console.error('Ensure profile error:', err);
      if (isMissingProfilesTable(err)) {
        const defaultClassId = await getDefaultClassId();
        return applyLocalProfile({
          user_id: session.user.id,
          email: session.user.email,
          active_class_id: defaultClassId,
        });
      }
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  const joinClass = async (classId, showAlert) => {
    if (!supabaseClient || !session || !classId) return;
    setClassActionLoading(true);
    try {
      const payload = {
        active_class_id: classId,
        email: session.user.email,
        updated_at: new Date().toISOString(),
      };

      const { error } = userProfile
        ? await supabaseClient
            .from('user_profiles')
            .update(payload)
            .eq('user_id', session.user.id)
        : await supabaseClient.from('user_profiles').insert({
            user_id: session.user.id,
            ...payload,
          });

      if (!error) {
        await fetchUserProfile();
        return;
      }

      if (isMissingProfilesTable(error)) {
        applyLocalProfile({
          user_id: session.user.id,
          email: session.user.email,
          active_class_id: classId,
        });
        return;
      }
      throw error;
    } catch (err) {
      if (isMissingProfilesTable(err)) {
        applyLocalProfile({
          user_id: session.user.id,
          email: session.user.email,
          active_class_id: classId,
        });
        return;
      }
      if (showAlert) {
        await showAlert({
          title: 'Could not join class',
          message: err.message,
          variant: 'error',
        });
      }
    } finally {
      setClassActionLoading(false);
    }
  };

  const leaveClass = async (showAlert) => {
    if (!supabaseClient || !session) return;
    setClassActionLoading(true);
    try {
      const { error } = await supabaseClient
        .from('user_profiles')
        .update({
          active_class_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session.user.id);

      if (!error) {
        await fetchUserProfile();
        return;
      }

      if (isMissingProfilesTable(error)) {
        applyLocalProfile({
          user_id: session.user.id,
          email: session.user.email,
          active_class_id: null,
        });
        return;
      }
      throw error;
    } catch (err) {
      if (isMissingProfilesTable(err)) {
        applyLocalProfile({
          user_id: session.user.id,
          email: session.user.email,
          active_class_id: null,
        });
        return;
      }
      if (showAlert) {
        await showAlert({
          title: 'Could not leave class',
          message: err.message,
          variant: 'error',
        });
      }
    } finally {
      setClassActionLoading(false);
    }
  };

  const rejoinDefaultClass = async (showAlert) => {
    if (availableClasses.length === 0) {
      await fetchAvailableClasses();
    }
    const defaultId = await getDefaultClassId();
    if (!defaultId) {
      if (showAlert) {
        await showAlert({
          title: 'Class not found',
          message: 'Spanish 200 was not found in the database. In Supabase → SQL Editor, run supabase/setup_now.sql, then hard-refresh this page (Ctrl+Shift+R).',
          variant: 'error',
        });
      }
      return;
    }
    await joinClass(defaultId, showAlert);
  };

  useEffect(() => {
    if (!dbConnected || !session || !supabaseClient) {
      setUserProfile(null);
      return;
    }
    const initProfile = async () => {
      await fetchAvailableClasses();
      await ensureUserProfile();
    };
    initProfile();
  }, [dbConnected, session?.user?.id]);

  return {
    availableClasses, setAvailableClasses,
    userProfile, setUserProfile,
    profileLoading,
    classActionLoading,
    activeClassId,
    activeClass,
    isInClass,
    getDefaultClassId,
    resolvePublishClassId,
    fetchAvailableClasses,
    fetchUserProfile,
    ensureUserProfile,
    joinClass,
    leaveClass,
    rejoinDefaultClass,
  };
}
