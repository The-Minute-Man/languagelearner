import { useState, useEffect } from 'react';
import { emptyPracticeBank, normalizePracticeBank, normalizePracticeSet, normalizePracticeSetsRoot } from '../utils/practiceBank';

export function usePracticeSets(supabaseClient, session, activeClassId) {
  const [practiceSets, setPracticeSets] = useState([]);
  const [activePracticeSetId, setActivePracticeSetId] = useState(null);
  const [selectedPracticeSetIndex, setSelectedPracticeSetIndex] = useState(0);
  const [sessionPracticeBank, setSessionPracticeBank] = useState(emptyPracticeBank());

  useEffect(() => {
    if (!session || !supabaseClient) { setPracticeSets([]); setActivePracticeSetId(null); return; }
    const fetchClassPracticeSets = async () => {
      if (!supabaseClient || !activeClassId) {
        setPracticeSets([]);
        setActivePracticeSetId(null);
        return;
      }
      try {
        const { data, error } = await supabaseClient.from('classes').select('practice_bank').eq('id', activeClassId).single();
        if (error) throw error;
        const root = normalizePracticeSetsRoot(data?.practice_bank);
        setPracticeSets(root.sets);
        if (activePracticeSetId && !root.sets.some((s) => s.id === activePracticeSetId)) setActivePracticeSetId(null);
      } catch (err) {
        console.error('Fetch class practice sets:', err);
        setPracticeSets([]);
        setActivePracticeSetId(null);
      }
    };
    fetchClassPracticeSets();
  }, [session?.user?.id, activeClassId, supabaseClient]);

  const persistPracticeSets = async (nextSets) => {
    const sets = nextSets.map((set) => normalizePracticeSet(set));
    setPracticeSets(sets);
    if (!supabaseClient || !activeClassId) return sets;
    const payload = { sets };
    const { error } = await supabaseClient.from('classes').update({ practice_bank: payload }).eq('id', activeClassId);
    if (error) {
      console.error('Save class practice sets:', error);
      return null;
    }
    return sets;
  };

  const persistActivePracticeSetBank = async (nextBank) => {
    if (!activePracticeSetId) return;
    const normalized = normalizePracticeBank(nextBank);
    const nextSets = practiceSets.map((set) =>
      set.id === activePracticeSetId
        ? { ...set, contexts: normalized.contexts, questions: normalized.questions, updatedAt: new Date().toISOString() }
        : set
    );
    await persistPracticeSets(nextSets);
  };

  return {
    practiceSets, setPracticeSets,
    activePracticeSetId, setActivePracticeSetId,
    selectedPracticeSetIndex, setSelectedPracticeSetIndex,
    sessionPracticeBank, setSessionPracticeBank,
    persistPracticeSets, persistActivePracticeSetBank
  };
}
