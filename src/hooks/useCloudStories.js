import { useState } from 'react';

export function useCloudStories(supabaseClient, session, activeClassId, isAdmin, showAlert) {
  const [cloudStories, setCloudStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(false);

  const fetchCloudStories = async () => {
    if (!supabaseClient) return;
    if (!isAdmin && !activeClassId) {
      setCloudStories([]);
      return;
    }
    setStoriesLoading(true);
    try {
      let query = supabaseClient.from('stories').select('*');
      if (activeClassId) query = query.eq('class_id', activeClassId);
      const { data, error } = await query;
      if (error) throw error;
      setCloudStories((data || []).map((s) => ({ ...s, sentences: s.sentences_jsonb || s.sentences || [] })));
    } catch (err) {
      console.error("Fetch Cloud Stories Error:", err);
      if (showAlert) showAlert({ title: 'Error', message: err.message, variant: 'error' });
    } finally {
      setStoriesLoading(false);
    }
  };

  return { cloudStories, storiesLoading, fetchCloudStories };
}
