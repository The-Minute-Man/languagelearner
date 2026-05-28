import { profileStorageKey, studyProgressStorageKey } from './constants';

// Supabase error detection
export const isMissingProfilesTable = (error) =>
  error?.code === 'PGRST205' ||
  (typeof error?.message === 'string' && error.message.includes('user_profiles'));

// Local profile storage
export const loadLocalProfile = (userId) => {
  try {
    const raw = localStorage.getItem(profileStorageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveLocalProfile = (userId, profile) => {
  localStorage.setItem(profileStorageKey(userId), JSON.stringify(profile));
};

// Study progress storage
export const readStudyProgressRoot = (session) => {
  if (!session) return { decks: {}, stories: {} };
  try {
    const raw = localStorage.getItem(studyProgressStorageKey(session.user.id));
    return raw ? { decks: {}, stories: {}, ...JSON.parse(raw) } : { decks: {}, stories: {} };
  } catch {
    return { decks: {}, stories: {} };
  }
};

export const persistStudyProgressRoot = async (root, session, userProfile, supabaseClient, setUserProfile) => {
  if (!session) return;
  localStorage.setItem(studyProgressStorageKey(session.user.id), JSON.stringify(root));

  if (!supabaseClient) return;

  const { error } = await supabaseClient
    .from('user_profiles')
    .update({
      study_progress: root,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', session.user.id);

  if (!error) {
    setUserProfile((prev) => (prev ? { ...prev, study_progress: root } : prev));
    return;
  }

  if (!isMissingProfilesTable(error)) {
    console.error('Save study progress error:', error);
  }
};
