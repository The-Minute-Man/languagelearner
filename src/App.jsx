import { useState, useReducer, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import AppDialog from './components/AppDialog.jsx';

// Imports from utilities
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  APP_VERSION,
  APP_BUILD_ID,
  APP_DISPLAY_VERSION,
  ADMIN_EMAIL,
  DEFAULT_CLASS_SLUG,
  DEFAULT_CLASS_NAME,
  profileStorageKey,
  studyProgressStorageKey,
  darkModeStorageKey,
  PRACTICE_SYNTAX_HELP,
} from './utils/constants';
import {
  isMissingProfilesTable,
  loadLocalProfile,
  saveLocalProfile,
  readStudyProgressRoot,
  persistStudyProgressRoot,
} from './utils/storage';
import {
  makePracticeId,
  emptyPracticeBank,
  emptyPracticeSetsRoot,
  normalizePracticeBank,
  normalizePracticeSet,
  normalizePracticeSetsRoot,
  parsePromptAnswerLine,
  parsePracticeSyntax,
  getPracticeContextBody,
  mergePracticeBanks,
} from './utils/practiceBank';
import {
  isSmartMatch,
  translateWithGoogle,
} from './utils/grading';
import {
  parseCSV,
} from './utils/csvParser';
import {
  FolderIcon,
  UploadIcon,
  SettingsIcon,
  StarIcon,
  CheckIcon,
  XIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CloudIcon,
  CopyIcon,
} from './components/Icons';
import {
  initialLearnState,
  learnReducer,
} from './hooks/useLearnState';
// Split tab components
import FlashcardsTab from './components/FlashcardsTab';
import LearnTab from './components/LearnTab';
import PracticeTab from './components/PracticeTab';
import StoryTab from './components/StoryTab';
import SettingsTab from './components/SettingsTab';

// Auto-initialize Supabase from Vite env vars (VITE_ prefix exposes them to the browser build)
const isValidSupabaseUrl = (url) => {
  try { return url && new URL(url).protocol.startsWith('http'); }
  catch { return false; }
};
const supabaseAutoClient = isValidSupabaseUrl(SUPABASE_URL) && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'undefined'
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const matchingCardKey = (card) => `${card.id}|${card.side}`;

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState("flashcards"); // flashcards, learn, practice, story, settings

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem(darkModeStorageKey) === 'true';
    } catch {
      return false;
    }
  });

  // Supabase — auto-connected from .env, no manual entry needed
  const [supabaseClient, setSupabaseClient] = useState(supabaseAutoClient);
  const [dbConnected, setDbConnected] = useState(false);
  const [dbError, setDbError] = useState("");
  
  // Decks state (Starts empty as requested)
  const [currentDeckName, setCurrentDeckName] = useState("custom");
  const [customDeck, setCustomDeck] = useState([]);
  const [csvPreviewCards, setCsvPreviewCards] = useState([]);
        {activeTab === 'flashcards' && (
          <FlashcardsTab
            session={session}
            activeDeck={activeDeck}
            activeDeckLength={activeDeck.length}
            currentFlashcard={currentFlashcard}
            flashcardIndex={flashcardIndex}
            {activeTab === 'story' && (
              <StoryTab
                storyStarted={storyStarted}
                storyActiveTab={storyActiveTab}
                isAdmin={isAdmin}
                cloudStories={cloudStories}
                selectedStoryIndex={selectedStoryIndex}
                customStoryText={customStoryText}
                activeStory={activeStory}
                storyFeed={storyFeed}
                currentSentenceIndex={currentSentenceIndex}
                showStoryEnd={showStoryEnd}
                getStoryProgress={getStoryProgress}
                handlers={{
                  setStoryActiveTab: setStoryActiveTab,
                  startPresetStory: startPresetStory,
                  setSelectedStoryIndex: setSelectedStoryIndex,
                  startCustomStory: startCustomStory,
                  publishStory: handlePublishGlobalStory,
                  setCustomStoryText: setCustomStoryText,
                  resetStoryMode: resetStoryMode,
                  isInClass: isInClass,
                }}
              />
            )}
        definition: c.definition
      }));

      const { error: cardsError } = await supabaseClient.from('cards').insert(cardsToInsert);
      if (cardsError) throw cardsError;

      showBanner(`Deck published for ${classLabel}.`, 'success');
      fetchCloudDecks();
    } catch (err) {
      console.error(err);
      await showAlert({
        title: 'Could not publish deck',
        message: err.message,
        variant: 'error',
      });
    }
  };

  // Active loaded deck resolver
  const getActiveDeck = () => {
    return customDeck;
  };

  // ==========================================
  // PART 1: FLASHCARDS STATE
  // ==========================================
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [knownCardIds, setKnownCardIds] = useState(new Set());
  const [learningCardIds, setLearningCardIds] = useState(new Set());
  const [activeCloudDeckId, setActiveCloudDeckId] = useState(null);
  const progressSaveTimerRef = useRef(null);
  const storyProgressSaveTimerRef = useRef(null);

  const getDeckProgressKey = () => {
    if (activeCloudDeckId) return activeCloudDeckId;
    if (customDeck.length > 0) return `local:${currentDeckName}`;
    return null;
  };

  const readProgressRoot = () => {
    const fromProfile = userProfile?.study_progress;
    if (fromProfile && typeof fromProfile === 'object') {
      return { decks: {}, stories: {}, ...fromProfile };
    }
    return readStudyProgressRoot(session);
  };

  const persistProgress = async (root) => {
    await persistStudyProgressRoot(root, session, userProfile, supabaseClient, setUserProfile);
  };

  const applyDeckProgress = (deckKey, deckLength) => {
    const entry = readProgressRoot().decks?.[deckKey];
    if (!entry) {
      setKnownCardIds(new Set());
      setLearningCardIds(new Set());
      setFlashcardIndex(0);
      return;
    }
    setKnownCardIds(new Set(entry.knownIds || []));
    setLearningCardIds(new Set(entry.learningIds || []));
    const idx = entry.flashcardIndex ?? 0;
    setFlashcardIndex(deckLength > 0 ? Math.min(idx, deckLength - 1) : 0);
  };

  const saveProgressForDeck = async (deckKey, deckLength) => {
    if (!session || !deckKey || deckLength === 0) return;
    const root = readProgressRoot();
    root.decks = root.decks || {};
    root.decks[deckKey] = {
      knownIds: [...knownCardIds],
      learningIds: [...learningCardIds],
      flashcardIndex: Math.min(flashcardIndex, Math.max(deckLength - 1, 0)),
      updatedAt: new Date().toISOString(),
    };
    root.lastDeckId = deckKey;
    await persistProgress(root);
  };

  const getStoryProgressKey = (storyObj = activeStory) => {
    if (!storyObj) return null;
    if (storyObj.id) return `story:${storyObj.id}`;
    const title = (storyObj.title || 'custom').toLowerCase().trim();
    const firstSentence = (storyObj.sentences?.[0]?.text || '').slice(0, 40).toLowerCase();
    return `story:local:${title}:${storyObj.sentences?.length || 0}:${firstSentence}`;
  };

  const applyStoryProgress = (storyKey, sentenceCount) => {
    const entry = readProgressRoot().stories?.[storyKey];
    if (!entry) {
      setCurrentSentenceIndex(0);
      setStoryFeed([]);
      setShowStoryEnd(false);
      return;
    }
    const savedFeed = Array.isArray(entry.storyFeed) ? entry.storyFeed : [];
    const maxIndex = Math.max(sentenceCount - 1, 0);
    const savedIndex = Math.min(entry.currentSentenceIndex ?? savedFeed.length ?? 0, maxIndex);
    setStoryFeed(savedFeed);
    setCurrentSentenceIndex(savedIndex);
    setShowStoryEnd(Boolean(entry.showStoryEnd) || (sentenceCount > 0 && savedFeed.length >= sentenceCount));
  };

  const saveProgressForStory = async (storyKey, sentenceCount) => {
    if (!session || !storyKey || sentenceCount === 0) return;
    const root = readProgressRoot();
    root.stories = root.stories || {};
    root.stories[storyKey] = {
      currentSentenceIndex: Math.min(currentSentenceIndex, Math.max(sentenceCount - 1, 0)),
      storyFeed,
      showStoryEnd,
      updatedAt: new Date().toISOString(),
    };
    root.lastStoryId = storyKey;
    await persistProgress(root);
  };

  const activeDeck = getActiveDeck();
  const currentFlashcard = activeDeck[flashcardIndex];

  const handleSelectCloudDeck = async (cloudDeckObj) => {
    const previousKey = getDeckProgressKey();
    if (previousKey && activeDeck.length > 0) {
      await saveProgressForDeck(previousKey, activeDeck.length);
    }

    setActiveCloudDeckId(cloudDeckObj.id);
    setCustomDeck(cloudDeckObj.cards);
    setCurrentDeckName(cloudDeckObj.name);
    applyDeckProgress(cloudDeckObj.id, cloudDeckObj.cards.length);
    setIsCardFlipped(false);
    showBanner(`Loaded deck: ${cloudDeckObj.name}`, 'success');
  };

  useEffect(() => {
    if (!session) return;
    const deckKey = getDeckProgressKey();
    if (!deckKey || activeDeck.length === 0) return;

    if (progressSaveTimerRef.current) {
      clearTimeout(progressSaveTimerRef.current);
    }
    progressSaveTimerRef.current = setTimeout(() => {
      saveProgressForDeck(deckKey, activeDeck.length);
    }, 900);

    return () => {
      if (progressSaveTimerRef.current) clearTimeout(progressSaveTimerRef.current);
    };
  }, [
    session?.user?.id,
    activeCloudDeckId,
    currentDeckName,
    flashcardIndex,
    knownCardIds,
    learningCardIds,
    activeDeck.length,
  ]);

  const fileInputRef = useRef(null);

  const applyCsvText = (text, sourceLabel = 'Pasted data') => {
    const trimmed = String(text || '').trim();
    if (!trimmed) {
      setCsvPreviewCards([]);
      setCsvFileName("");
      return;
    }
    const parsed = parseCSV(trimmed);
    setCsvPreviewCards(parsed);
    setCsvFileName(parsed.length > 0 ? sourceLabel : "");
    if (parsed.length === 0) {
      showAlert({
        title: 'No valid rows',
        message:
          'Use two columns: Spanish term and English definition. Separate with commas or tabs (paste from Excel works).',
        variant: 'error',
      });
    }
  };

  const handleCsvFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      applyCsvText(e.target.result, file.name);
      setCsvPasteText("");
    };
    reader.readAsText(file);
  };

  const handleCsvPasteArea = (e) => {
    const pasted = e.clipboardData?.getData('text');
    if (!pasted?.trim()) return;
    e.preventDefault();
    setCsvPasteText(pasted);
    applyCsvText(pasted, 'Pasted data');
  };

  const handleParseCsvPaste = () => {
    applyCsvText(csvPasteText, 'Pasted data');
  };

  const clearCsvImport = () => {
    setCsvFileName("");
    setCsvPreviewCards([]);
    setCsvPasteText("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingCsv(false);
    if (e.dataTransfer.files?.length > 0) {
      handleCsvFile(e.dataTransfer.files[0]);
      return;
    }
    const droppedText = e.dataTransfer.getData('text/plain');
    if (droppedText?.trim()) {
      setCsvPasteText(droppedText);
      applyCsvText(droppedText, 'Dropped data');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingCsv(true);
  };

  const handleDragLeave = () => {
    setIsDraggingCsv(false);
  };

  const confirmImportDeck = () => {
    if (!isAdmin) return;
    if (csvPreviewCards.length > 0) {
      setActiveCloudDeckId(null);
      setCustomDeck(csvPreviewCards);
      setCurrentDeckName("custom");
      applyDeckProgress('local:custom', csvPreviewCards.length);
      setIsCardFlipped(false);
      clearCsvImport();
    }
  };

  const handleTagKnown = () => {
    if (!currentFlashcard) return;
    const newKnown = new Set(knownCardIds);
    newKnown.add(currentFlashcard.id);
    setKnownCardIds(newKnown);
    
    if (learningCardIds.has(currentFlashcard.id)) {
      const newLearn = new Set(learningCardIds);
      newLearn.delete(currentFlashcard.id);
      setLearningCardIds(newLearn);
    }
    advanceCard();
  };

  const handleTagLearning = () => {
    if (!currentFlashcard) return;
    const newLearn = new Set(learningCardIds);
    newLearn.add(currentFlashcard.id);
    setLearningCardIds(newLearn);

    if (knownCardIds.has(currentFlashcard.id)) {
      const newKnown = new Set(knownCardIds);
      newKnown.delete(currentFlashcard.id);
      setKnownCardIds(newKnown);
    }
    advanceCard();
  };

  const advanceCard = () => {
    if (activeDeck.length === 0) return;
    setIsCardFlipped(false);
    setTimeout(() => {
      setFlashcardIndex((prev) => (prev + 1) % activeDeck.length);
    }, 120);
  };

  const prevCard = () => {
    if (activeDeck.length === 0) return;
    setIsCardFlipped(false);
    setTimeout(() => {
      setFlashcardIndex((prev) => (prev - 1 + activeDeck.length) % activeDeck.length);
    }, 120);
  };

  // ==========================================
  // PART 2: LEARN MODE STATE
  // ==========================================
  const [learnState, dispatchLearn] = useReducer(learnReducer, initialLearnState);
  const [mcOptions, setMcOptions] = useState([]);
  const [matchingBoard, setMatchingBoard] = useState([]);

  useEffect(() => {
    if (!learnState.currentQuestion) return;

    const currentCard = learnState.currentQuestion.card;
    
    if (learnState.currentQuestion.type === 'mc') {
      const distractors = activeDeck
        .filter(c => c.id !== currentCard.id)
        .map(c => c.definition);
      
      const shuffledDistractors = distractors.sort(() => 0.5 - Math.random()).slice(0, 3);
      const options = [currentCard.definition, ...shuffledDistractors].sort(() => 0.5 - Math.random());
      setMcOptions(options);
    } 
    
    else if (learnState.currentQuestion.type === 'tf') {
      const showCorrect = Math.random() > 0.5;
      if (showCorrect) {
        setMcOptions([currentCard.definition]);
      } else {
        const distractors = activeDeck.filter(c => c.id !== currentCard.id);
        const incorrectVal = distractors.length > 0 
          ? distractors[Math.floor(Math.random() * distractors.length)].definition
          : currentCard.definition + " (incorrect)";
        setMcOptions([incorrectVal]);
      }
    } 
    
    else if (learnState.currentQuestion.type === 'matching') {
      const distractors = activeDeck.filter(c => c.id !== currentCard.id);
      const chosenDistractors = distractors.sort(() => 0.5 - Math.random()).slice(0, 3);
      const selectedPairs = [currentCard, ...chosenDistractors];

      const leftCol = selectedPairs.map(p => ({ id: p.id, side: 'es', text: p.term }));
      const rightCol = selectedPairs.map(p => ({ id: p.id, side: 'en', text: p.definition }));

      const shuffledLeft = leftCol.sort(() => 0.5 - Math.random());
      const shuffledRight = rightCol.sort(() => 0.5 - Math.random());

      setMatchingBoard({
        es: shuffledLeft,
        en: shuffledRight,
        totalPairs: selectedPairs.length
      });
    }

  }, [learnState.currentQuestion]);

  const handleMcqSelect = (option) => {
    if (learnState.isAnswerSubmitted) return;
    dispatchLearn({ type: 'SET_SELECTED_OPTION', payload: option });
    
    const correct = option === learnState.currentQuestion.card.definition;
    dispatchLearn({ type: 'SUBMIT_ANSWER', payload: { isCorrect: correct } });
  };

  const handleTfSelect = (userClickedTrue) => {
    if (learnState.isAnswerSubmitted) return;
    dispatchLearn({ type: 'SET_SELECTED_OPTION', payload: userClickedTrue });

    const displayedTranslation = mcOptions[0];
    const isActuallyCorrect = displayedTranslation === learnState.currentQuestion.card.definition;
    const isCorrectGrade = (userClickedTrue && isActuallyCorrect) || (!userClickedTrue && !isActuallyCorrect);

    dispatchLearn({ type: 'SUBMIT_ANSWER', payload: { isCorrect: isCorrectGrade } });
  };

  const handleTypeSubmit = () => {
    if (learnState.isAnswerSubmitted) return;
    
    const isCorrect = isSmartMatch(
      learnState.userAnswer,
      learnState.currentQuestion.card.definition
    );
    dispatchLearn({ type: 'SUBMIT_ANSWER', payload: { isCorrect } });
  };

  const handleMatchingCardClick = (card) => {
    if (learnState.matchingMatchedIds.includes(card.id)) return;
    if (learnState.matchingMismatchedIds.includes(matchingCardKey(card))) return;

    const selected = learnState.matchingSelectedCard;

    if (!selected) {
      dispatchLearn({ type: 'SELECT_MATCHING_CARD', payload: card });
    } else {
      if (selected.id === card.id && selected.side === card.side) {
        dispatchLearn({ type: 'CLEAR_MATCHING_SELECTION' });
        return;
      }

      if (selected.side === card.side) {
        dispatchLearn({ type: 'SELECT_MATCHING_CARD', payload: card });
        return;
      }

      if (selected.id === card.id) {
        dispatchLearn({ type: 'ADD_MATCHED_PAIR', payload: [card.id] });

        const currentlyMatched = [...learnState.matchingMatchedIds, card.id];
        if (currentlyMatched.length >= matchingBoard.totalPairs) {
          const hadMismatches = learnState.matchingMismatchesCount > 0;
          dispatchLearn({ type: 'SUBMIT_ANSWER', payload: { isCorrect: !hadMismatches } });
        }
      } else {
        dispatchLearn({ type: 'INCREMENT_MISMATCHES' });
        dispatchLearn({
          type: 'SET_MISMATCHED_FLASH',
          payload: [matchingCardKey(selected), matchingCardKey(card)],
        });

        setTimeout(() => {
          dispatchLearn({ type: 'SET_MISMATCHED_FLASH', payload: [] });
        }, 700);
      }
    }
  };

  const formatTime = (ms) => {
    if (!ms || ms < 0) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ==========================================
  // PART 3: STORY MODE STATE
  // ==========================================
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [customStoryText, setCustomStoryText] = useState("");
  const [storyActiveTab, setStoryActiveTab] = useState("preset");
  
  const [storyStarted, setStoryStarted] = useState(false);
  const [activeStory, setActiveStory] = useState(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [storyTranslationInput, setStoryTranslationInput] = useState("");
  const [storyFeed, setStoryFeed] = useState([]);
  
  const [gradingLoading, setGradingLoading] = useState(false);
  const [showStoryEnd, setShowStoryEnd] = useState(false);

  // ==========================================
  // PART 4: PRACTICE MODE (past test questions)
  // ==========================================
  const [practiceSets, setPracticeSets] = useState([]);
  const [activePracticeSetId, setActivePracticeSetId] = useState(null);
  const [selectedPracticeSetIndex, setSelectedPracticeSetIndex] = useState(0);
  const [sessionPracticeBank, setSessionPracticeBank] = useState(emptyPracticeBank);
  const [practiceDraftType, setPracticeDraftType] = useState('normal');
  const [practiceDraftPrompt, setPracticeDraftPrompt] = useState('');
  const [practiceDraftAnswer, setPracticeDraftAnswer] = useState('');
  const [practiceDraftContextRef, setPracticeDraftContextRef] = useState('');
  const [practiceContextRef, setPracticeContextRef] = useState('');
  const [practiceContextBody, setPracticeContextBody] = useState('');
  const [practiceBulkText, setPracticeBulkText] = useState('');
  const [practiceSessionActive, setPracticeSessionActive] = useState(false);
  const [practiceSessionEnded, setPracticeSessionEnded] = useState(false);
  const [practiceQueue, setPracticeQueue] = useState([]);
  const [practiceCursor, setPracticeCursor] = useState(0);
  const [practiceInput, setPracticeInput] = useState('');
  const [practiceSubmitted, setPracticeSubmitted] = useState(false);
  const [practiceWasCorrect, setPracticeWasCorrect] = useState(false);
  const [practiceSessionCorrect, setPracticeSessionCorrect] = useState(0);

  const activePracticeSet = practiceSets.find((s) => s.id === activePracticeSetId) || null;
  const practiceBank = activePracticeSet
    ? { contexts: activePracticeSet.contexts, questions: activePracticeSet.questions }
    : emptyPracticeBank();

  const fetchClassPracticeSets = async () => {
    if (!supabaseClient || !activeClassId) {
      setPracticeSets([]);
      setActivePracticeSetId(null);
      return;
    }
    try {
      const { data, error } = await supabaseClient
        .from('classes')
        .select('practice_bank')
        .eq('id', activeClassId)
        .single();
      if (error) throw error;
      const root = normalizePracticeSetsRoot(data?.practice_bank);
      setPracticeSets(root.sets);
      if (activePracticeSetId && !root.sets.some((s) => s.id === activePracticeSetId)) {
        setActivePracticeSetId(null);
      }
    } catch (err) {
      console.error('Fetch class practice sets:', err);
      setPracticeSets([]);
      setActivePracticeSetId(null);
    }
    setPracticeSessionActive(false);
    setPracticeSessionEnded(false);
    setPracticeQueue([]);
    setPracticeCursor(0);
    setSessionPracticeBank(emptyPracticeBank());
  };

  useEffect(() => {
    if (!session || !dbConnected) {
      setPracticeSets([]);
      setActivePracticeSetId(null);
      return;
    }
    fetchClassPracticeSets();
  }, [session?.user?.id, activeClassId, dbConnected]);

  const persistPracticeSets = async (nextSets) => {
    if (!isAdmin) return;
    const sets = nextSets.map((set) => normalizePracticeSet(set));
    setPracticeSets(sets);
    if (!supabaseClient || !activeClassId) return;
    const payload = { sets };
    const { error } = await supabaseClient
      .from('classes')
      .update({ practice_bank: payload })
      .eq('id', activeClassId);
    if (error) {
      console.error('Save class practice sets:', error);
      showBanner('Could not save practice sets to class.', 'error');
      return;
    }
    return sets;
  };

  const persistActivePracticeSetBank = async (nextBank) => {
    if (!isAdmin || !activePracticeSetId) return;
    const normalized = normalizePracticeBank(nextBank);
    const nextSets = practiceSets.map((set) =>
      set.id === activePracticeSetId
        ? { ...set, contexts: normalized.contexts, questions: normalized.questions, updatedAt: new Date().toISOString() }
        : set
    );
    await persistPracticeSets(nextSets);
  };

  const handleCreatePracticeSet = async () => {
    if (!isAdmin) return;
    const values = await showForm({
      title: 'New practice set',
      message: 'Create a separate bank for a test, unit, or topic—like a deck or story.',
      fields: [
        { id: 'title', label: 'Title', required: true, autoFocus: true, placeholder: 'e.g. Unit 3 Exam Review' },
        { id: 'description', label: 'Description', multiline: true, rows: 2, placeholder: 'Optional note for students' },
      ],
      submitLabel: 'Create set',
    });
    if (!values) return;
    const newSet = normalizePracticeSet({
      id: makePracticeId(),
      title: values.title,
      description: values.description || '',
      contexts: [],
      questions: [],
    });
    const saved = await persistPracticeSets([...practiceSets, newSet]);
    const created = saved?.find((s) => s.id === newSet.id) || newSet;
    setActivePracticeSetId(created.id);
    showBanner(`Created practice set: ${created.title}`, 'success');
  };

  const handleDeletePracticeSet = async (setId) => {
    if (!isAdmin) return;
    const nextSets = practiceSets.filter((s) => s.id !== setId);
    await persistPracticeSets(nextSets);
    if (activePracticeSetId === setId) {
      setActivePracticeSetId(null);
    }
    resetPracticeSession();
    showBanner('Practice set removed.', 'success');
  };

  const openPracticeSet = (setId, index) => {
    setSelectedPracticeSetIndex(index);
    setActivePracticeSetId(setId);
    resetPracticeSession();
  };

  const backToPracticeLibrary = () => {
    setActivePracticeSetId(null);
    resetPracticeSession();
  };

  const handleAddPracticeContext = () => {
    if (!isAdmin || !activePracticeSetId) return;
    const ref = practiceContextRef.trim().replace(/\s+/g, '-');
    const body = practiceContextBody.trim();
    if (!ref || !body) return;
    const existing = practiceBank.contexts.find((c) => c.ref === ref);
    const nextContexts = existing
      ? practiceBank.contexts.map((c) => (c.ref === ref ? { ...c, body } : c))
      : [...practiceBank.contexts, { id: makePracticeId(), ref, body }];
    persistActivePracticeSetBank({ ...practiceBank, contexts: nextContexts });
    setPracticeContextRef('');
    setPracticeContextBody('');
    if (!practiceDraftContextRef) setPracticeDraftContextRef(ref);
    showBanner(existing ? `Updated context @${ref}.` : `Added context @${ref}.`, 'success');
  };

  const handleAddPracticeQuestion = () => {
    if (!isAdmin || !activePracticeSetId) return;
    const prompt = practiceDraftPrompt.trim();
    const answer = practiceDraftAnswer.trim();
    if (!prompt || !answer) return;

    if (practiceDraftType === 'context') {
      const contextRef = practiceDraftContextRef.trim();
      if (!contextRef) {
        showAlert({
          title: 'Context required',
          message: 'Pick or create a context id (e.g. exam1) for context questions.',
          variant: 'error',
        });
        return;
      }
      if (!getPracticeContextBody(practiceBank, contextRef)) {
        showAlert({
          title: 'Unknown context',
          message: `No context block named @${contextRef}. Add it under Shared Contexts first.`,
          variant: 'error',
        });
        return;
      }
    }

    persistActivePracticeSetBank({
      ...practiceBank,
      questions: [
        ...practiceBank.questions,
        {
          id: makePracticeId(),
          type: practiceDraftType,
          prompt,
          answer,
          ...(practiceDraftType === 'context' ? { contextRef: practiceDraftContextRef.trim() } : {}),
        },
      ],
    });
    setPracticeDraftPrompt('');
    setPracticeDraftAnswer('');
  };

  const handleImportPracticeBulk = () => {
    if (!isAdmin || !activePracticeSetId) return;
    const imported = parsePracticeSyntax(practiceBulkText);
    if (imported.contexts.length === 0 && imported.questions.length === 0) {
      showAlert({
        title: 'Nothing to import',
        message: 'Use the Practice syntax guide below (context blocks + Q: lines).',
        variant: 'error',
      });
      return;
    }
    persistActivePracticeSetBank(mergePracticeBanks(practiceBank, imported));
    setPracticeBulkText('');
    showBanner(
      `Imported ${imported.questions.length} question(s) and ${imported.contexts.length} context block(s).`,
      'success',
    );
  };

  const handleDeletePracticeQuestion = (id) => {
    if (!isAdmin) return;
    persistActivePracticeSetBank({
      ...practiceBank,
      questions: practiceBank.questions.filter((q) => q.id !== id),
    });
  };

  const handleDeletePracticeContext = (ref) => {
    if (!isAdmin) return;
    persistActivePracticeSetBank({
      contexts: practiceBank.contexts.filter((c) => c.ref !== ref),
      questions: practiceBank.questions.filter((q) => q.contextRef !== ref),
    });
    if (practiceDraftContextRef === ref) setPracticeDraftContextRef('');
  };

  const handleClearPracticeSet = () => {
    if (!isAdmin || !activePracticeSetId) return;
    persistActivePracticeSetBank(emptyPracticeBank());
    resetPracticeSession();
    showBanner('This practice set was cleared.', 'success');
  };

  const startPracticeSession = () => {
    if (!activePracticeSet) return;
    const bank = { contexts: activePracticeSet.contexts, questions: activePracticeSet.questions };
    const runnable = bank.questions.filter((q) => {
      if (q.type !== 'context') return true;
      return Boolean(getPracticeContextBody(bank, q.contextRef));
    });
    if (runnable.length === 0) return;
    setSessionPracticeBank(bank);
    const shuffled = [...runnable].sort(() => Math.random() - 0.5);
    setPracticeQueue(shuffled);
    setPracticeCursor(0);
    setPracticeInput('');
    setPracticeSubmitted(false);
    setPracticeWasCorrect(false);
    setPracticeSessionCorrect(0);
    setPracticeSessionEnded(false);
    setPracticeSessionActive(true);
  };

  const resetPracticeSession = () => {
    setPracticeSessionActive(false);
    setPracticeSessionEnded(false);
    setPracticeQueue([]);
    setPracticeCursor(0);
    setPracticeInput('');
    setPracticeSubmitted(false);
    setPracticeWasCorrect(false);
    setPracticeSessionCorrect(0);
  };

  const handlePracticeSubmit = () => {
    if (practiceSubmitted || !practiceInput.trim()) return;
    const current = practiceQueue[practiceCursor];
    if (!current) return;
    const correct = isSmartMatch(practiceInput, current.answer);
    setPracticeWasCorrect(correct);
    setPracticeSubmitted(true);
    if (correct) {
      setPracticeSessionCorrect((prev) => prev + 1);
    }
  };

  const handlePracticeNext = () => {
    if (!practiceSubmitted) return;
    const nextIndex = practiceCursor + 1;
    if (nextIndex >= practiceQueue.length) {
      setPracticeSessionEnded(true);
      setPracticeSessionActive(false);
      return;
    }
    setPracticeCursor(nextIndex);
    setPracticeInput('');
    setPracticeSubmitted(false);
    setPracticeWasCorrect(false);
  };

  const currentPracticeQuestion = practiceQueue[practiceCursor];
  const currentPracticeContextBody =
    currentPracticeQuestion?.type === 'context'
      ? getPracticeContextBody(sessionPracticeBank, currentPracticeQuestion.contextRef)
      : '';
  const practiceProgressPct = practiceQueue.length > 0
    ? Math.round(((practiceCursor + (practiceSubmitted ? 1 : 0)) / practiceQueue.length) * 100)
    : 0;
  const practiceQuestionCount = activePracticeSet?.questions?.length || 0;
  const practiceContextCount = activePracticeSet?.contexts?.length || 0;

  const feedContainerRef = useRef(null);

  useEffect(() => {
    if (feedContainerRef.current) {
      feedContainerRef.current.scrollTop = feedContainerRef.current.scrollHeight;
    }
  }, [storyFeed]);

  const startCustomStory = () => {
    if (!isAdmin) return;
    if (!customStoryText.trim()) return;
    
    const rawSentences = customStoryText
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 3);

    if (rawSentences.length === 0) return;

    const formattedSentences = rawSentences.map((sentence) => {
      return {
        text: sentence.trim(),
        translation: "" // References will be retrieved from Google Translate dynamically
      };
    });

    const mockStory = {
      title: "Historia Personalizada",
      description: "Practice translation using custom texts.",
      sentences: formattedSentences
    };

    const storyKey = getStoryProgressKey(mockStory);
    setActiveStory(mockStory);
    setStoryStarted(true);
    applyStoryProgress(storyKey, mockStory.sentences.length);
    setStoryTranslationInput("");
  };

  const startPresetStory = (idx) => {
    const nextStory = cloudStories[idx];
    const storyKey = getStoryProgressKey(nextStory);
    setActiveStory(nextStory);
    setStoryStarted(true);
    applyStoryProgress(storyKey, nextStory?.sentences?.length || 0);
    setStoryTranslationInput("");
  };

  const handlePublishGlobalStory = async () => {
    if (!supabaseClient || !isAdmin) return;

    const publishClassId = await resolvePublishClassId();
    if (!publishClassId) {
      await showAlert({
        title: 'No class selected',
        message: 'Join a class in Settings before publishing a story.',
        variant: 'error',
      });
      return;
    }

    const values = await showForm({
      title: 'Publish class story',
      message: `This story will be shared with students in ${activeClass?.name || 'your class'}.`,
      fields: [
        {
          id: 'title',
          label: 'Story title',
          required: true,
          autoFocus: true,
          placeholder: 'e.g. A day at the market',
        },
        {
          id: 'description',
          label: 'Description',
          required: true,
          multiline: true,
          rows: 3,
          placeholder: 'Short summary for students choosing a story',
        },
      ],
      submitLabel: 'Publish story',
    });
    if (!values) return;

    const { title, description } = values;
    
    // Parse the current custom text into sentences
    const sentences = customStoryText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 3)
      .map(s => ({ text: s + ".", translation: "(Pending Translation)" }));
      
    if (sentences.length === 0) {
      await showAlert({
        title: 'No sentences found',
        message: 'Paste Spanish text with proper punctuation so sentences can be split.',
        variant: 'error',
      });
      return;
    }

    try {
      const { error } = await supabaseClient.from('stories').insert({
        title,
        description,
        sentences_jsonb: sentences,
        user_id: session.user.id,
        is_global: true,
        class_id: publishClassId,
      });
      if (error) throw error;
      showBanner(`Story published for ${activeClass?.name || 'your class'}.`, 'success');
      setCustomStoryText("");
      fetchCloudStories();
    } catch (err) {
      console.error(err);
      await showAlert({
        title: 'Could not publish story',
        message: err.message,
        variant: 'error',
      });
    }
  };

  const handleStorySentenceSubmit = async () => {
    if (!storyTranslationInput.trim() || gradingLoading) return;

    const sentenceObj = activeStory.sentences[currentSentenceIndex];
    setGradingLoading(true);

    const googleTranslation = await translateWithGoogle(sentenceObj.text);
    const trimmedUser = storyTranslationInput.trim();

    setGradingLoading(false);

    const feedItem = {
      index: currentSentenceIndex,
      spanish: sentenceObj.text,
      userTrans: trimmedUser,
      googleTrans: googleTranslation || "",
    };

    setStoryFeed((prev) => [...prev, feedItem]);
    setStoryTranslationInput("");

    // Log to Supabase Cloud (no grading/feedback — just comparison)
    if (supabaseClient) {
      try {
        await supabaseClient.from('translation_history').insert({
          story_title: activeStory.title,
          sentence_index: currentSentenceIndex,
          spanish_text: sentenceObj.text,
          user_translation: trimmedUser,
          score: null,
          feedback: { google_translate: googleTranslation || null },
        });
      } catch (err) {
        console.error("Error saving history to Supabase:", err);
      }
    }

    if (currentSentenceIndex + 1 >= activeStory.sentences.length) {
      setShowStoryEnd(true);
    } else {
      setCurrentSentenceIndex((prev) => prev + 1);
    }
  };

  const handleStoryKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleStorySentenceSubmit();
    }
  };

  const resetStoryMode = () => {
    setStoryStarted(false);
    setActiveStory(null);
    setCurrentSentenceIndex(0);
    setStoryFeed([]);
    setStoryTranslationInput("");
    setShowStoryEnd(false);
  };

  const getStoryProgress = () => {
    const total = activeStory?.sentences?.length || 0;
    const completed = storyFeed.length;
    const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
    return { total, completed, pct };
  };

  useEffect(() => {
    if (!session || !storyStarted || !activeStory) return;
    const storyKey = getStoryProgressKey(activeStory);
    if (!storyKey || !activeStory.sentences?.length) return;

    if (storyProgressSaveTimerRef.current) {
      clearTimeout(storyProgressSaveTimerRef.current);
    }
    storyProgressSaveTimerRef.current = setTimeout(() => {
      saveProgressForStory(storyKey, activeStory.sentences.length);
    }, 900);

    return () => {
      if (storyProgressSaveTimerRef.current) clearTimeout(storyProgressSaveTimerRef.current);
    };
  }, [
    session?.user?.id,
    storyStarted,
    activeStory,
    currentSentenceIndex,
    storyFeed,
    showStoryEnd,
  ]);

  // SQL scaffolding script text
  const SQL_SCRIPTS = `-- See supabase/migrations/001_classes_and_profiles.sql for the full schema,
-- including classes, user_profiles, class-scoped decks/stories, and RLS policies.`;

  // Render Auth View if not logged in
  if (!session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
          <div className="text-center" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'inline-flex', width: '3.5rem', height: '3.5rem', backgroundColor: 'var(--primary-blue)', color: 'white', borderRadius: 'var(--radius-md)', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>LL</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
              {authView === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {authView === 'login' ? 'Sign in to access your custom decks and study history.' : 'Sign up to sync your progress across devices.'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '0.375rem', textTransform: 'uppercase' }}>Email</label>
              <input 
                type="email" 
                className="settings-input" 
                placeholder="you@example.com"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '0.375rem', textTransform: 'uppercase' }}>Password</label>
              <input 
                type="password" 
                className="settings-input" 
                placeholder="••••••••"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                required
              />
            </div>

            {authError && (
              <div style={{ fontSize: '0.75rem', color: 'var(--error-red)', backgroundColor: 'var(--error-light)', padding: '0.5rem', borderRadius: '4px' }}>
                {authError}
              </div>
            )}
            {dbError && (
              <div style={{ fontSize: '0.75rem', color: 'var(--error-red)', backgroundColor: 'var(--error-light)', padding: '0.5rem', borderRadius: '4px' }}>
                {dbError}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={authLoading}>
              {authLoading ? 'Loading...' : (authView === 'login' ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
            {authView === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              onClick={() => { setAuthView(authView === 'login' ? 'signup' : 'login'); setAuthError(''); }}
            >
              {authView === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* ==========================================
          HEADER & NAVIGATION
          ========================================== */}
      <header className="app-header">
        <div className="header-container">
          <div className="brand">
            <span className="brand-indicator" aria-hidden="true" />
            <div className="brand-text-wrap">
              <span className="brand-title">Language Learner</span>
              <span className="brand-version" title={`Build ${APP_BUILD_ID}`}>v{APP_DISPLAY_VERSION}</span>
            </div>
          </div>

          <div className="navigation-tabs">
            <button 
              className={`nav-tab ${activeTab === 'flashcards' ? 'active' : ''}`}
              onClick={() => setActiveTab("flashcards")}
            >
              Flashcards
            </button>
            <button 
              className={`nav-tab ${activeTab === 'learn' ? 'active' : ''}`}
              onClick={() => setActiveTab("learn")}
            >
              Learn
            </button>
            <button 
              className={`nav-tab ${activeTab === 'practice' ? 'active' : ''}`}
              onClick={() => setActiveTab("practice")}
            >
              Practice
            </button>
            <button 
              className={`nav-tab ${activeTab === 'story' ? 'active' : ''}`}
              onClick={() => setActiveTab("story")}
            >
              Story
            </button>
            <button 
              className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </button>
          </div>

          {session && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isInClass && activeClass && (
                <span className="custom-badge" style={{ fontSize: '0.7rem' }}>
                  {activeClass.name}
                </span>
              )}
              {!isInClass && !profileLoading && (
                <span className="custom-badge custom-badge-yellow" style={{ fontSize: '0.7rem' }}>
                  No class
                </span>
              )}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                {session.user.email}
              </span>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ==========================================
          MAIN AREA
          ========================================== */}
      <main className="main-content">

        {appBanner && (
          <div className={`app-banner app-banner--${appBanner.variant}`} role="status">
            <span>{appBanner.message}</span>
            <button
              type="button"
              className="app-banner-dismiss"
              aria-label="Dismiss"
              onClick={() => setAppBanner(null)}
            >
              ×
            </button>
          </div>
        )}
        
        {/* Connection indicator banner */}
        {activeTab !== 'settings' && dbConnected && (
          <div className="sync-bar">
            <span className="sync-text">
              <CloudIcon className="icon-svg-sm" /> Connected to {activeClass?.name || DEFAULT_CLASS_NAME}
            </span>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                onClick={() => { fetchCloudDecks(); fetchCloudStories(); }}
                disabled={!isInClass && !isAdmin}
              >
                Sync Content
              </button>
              {activeDeck.length > 0 && isAdmin && (
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#eab308', borderColor: '#ca8a04', color: 'black' }}
                  onClick={handleSaveGlobalDeck}
                >
                  Publish Class Deck
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab !== 'settings' && dbConnected && !profileLoading && !isInClass && (
          <div style={{ maxWidth: '720px', margin: '0 auto 1rem', padding: '0.75rem 1rem', backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--dark-navy)' }}>
            You are not enrolled in a class. Open <strong>Settings</strong> to rejoin {availableClasses.find((c) => c.slug === DEFAULT_CLASS_SLUG)?.name || 'Spanish 200'} and access study decks and stories.
          </div>
        )}

        {/* ==========================================
            TAB 1: FLASHCARDS MODE
            ========================================== */}
        {activeTab === 'flashcards' && (
          <div className="flashcards-tab-container">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: dbConnected && (isInClass || isAdmin) ? '1fr 340px' : '1fr',
                gap: '1.75rem',
              }}
            >
              
              {/* Left Side: Active Flashcard Viewer */}
              {activeDeck.length > 0 ? (
                <div className="card text-center" style={{ minHeight: '480px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="custom-badge">
                        Card {flashcardIndex + 1} of {activeDeck.length}
                      </span>
                      <span className="custom-badge" style={{ fontSize: '0.65rem', fontWeight: 600 }}>
                        {session ? 'Progress auto-saves' : 'Sign in to save progress'}
                      </span>
                      <div className="d-flex gap-2">
                        {knownCardIds.has(currentFlashcard.id) && (
                          <span className="custom-badge custom-badge-green">Mastered</span>
                        )}
                        {learningCardIds.has(currentFlashcard.id) && (
                          <span className="custom-badge custom-badge-yellow">Learning</span>
                        )}
                      </div>
                    </div>

                    <div className="progress-container">
                      <div className="progress-bar-bg">
                        <div 
                          className="progress-bar-fill"
                          style={{ width: `${activeDeck.length > 0 ? (knownCardIds.size / activeDeck.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, marginTop: '0.35rem' }}>
                      Deck completion: {activeDeck.length > 0 ? Math.round((knownCardIds.size / activeDeck.length) * 100) : 0}% ({knownCardIds.size}/{activeDeck.length} mastered)
                    </div>
                  </div>

                  {/* 3D Flip Card Element */}
                  <div 
                    className={`flashcard-viewport ${isCardFlipped ? 'flipped' : ''}`}
                    onClick={() => setIsCardFlipped(!isCardFlipped)}
                  >
                    <div className="flashcard-inner">
                      {/* Front: Spanish */}
                      <div className="flashcard-face flashcard-front">
                        <span className="flashcard-label">Spanish</span>
                        <h2 className="flashcard-word">{currentFlashcard.term}</h2>
                        <span className="flashcard-hint">
                          Click card to flip
                        </span>
                      </div>
                      
                      {/* Back: English */}
                      <div className="flashcard-face flashcard-back">
                        <span className="flashcard-label">English Translation</span>
                        <h2 className="flashcard-word">{currentFlashcard.definition}</h2>
                        <span className="flashcard-hint">
                          Click to show Spanish
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tagging Operations */}
                  <div>
                    <div className="button-group mb-4">
                      <button 
                        className="btn btn-secondary"
                        style={{ borderColor: 'var(--error-border)', color: 'var(--error-red)' }}
                        onClick={handleTagLearning}
                      >
                        Still Learning
                      </button>
                      <button 
                        className="btn btn-success"
                        onClick={handleTagKnown}
                      >
                        Known
                      </button>
                    </div>

                    <div className="button-group" style={{ borderTop: '1px solid var(--border-gray)', paddingTop: '1.15rem' }}>
                      <button className="btn btn-secondary" onClick={prevCard}>
                        <ArrowLeftIcon className="icon-svg-sm" /> Previous
                      </button>
                      <button className="btn btn-secondary" onClick={advanceCard}>
                        Next <ArrowRightIcon className="icon-svg-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                
                /* Empty deck state - CSV Upload Prompt */
                <div className="card text-center" style={{ padding: '3.5rem' }}>
                  <div style={{ display: 'inline-flex', width: '3.5rem', height: '3.5rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary-blue)', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                    <FolderIcon className="icon-svg" />
                  </div>
                  <h2 className="card-title">Load Study Cards</h2>
                  <p className="card-subtitle" style={{ maxWidth: '440px', margin: '0 auto 1.5rem' }}>
                    {isAdmin
                      ? 'There are no cards in the study queue. Import a CSV deck or publish class content for students.'
                      : isInClass
                        ? 'Load a vocabulary deck shared for your class from the cloud library below.'
                        : 'Join your class in Settings to access shared study decks.'}
                  </p>

                  {isAdmin && (
                    <div className="d-flex justify-between" style={{ maxWidth: '280px', margin: '0 auto' }}>
                      <button className="btn btn-primary" onClick={() => fileInputRef.current.click()}>
                        Browse CSV File
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Right panel: Deck Library (always accessible) + Admin importer */}
              {dbConnected && (isInClass || isAdmin) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="card" style={{ height: 'fit-content' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                      <div>
                        <h3 className="card-title" style={{ marginBottom: 0 }}>Deck Library</h3>
                        <p className="card-subtitle" style={{ fontSize: '0.75rem', marginTop: '0.35rem' }}>
                          Select any published deck to study. You can switch back anytime.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                        onClick={fetchCloudDecks}
                        disabled={!isInClass && !isAdmin}
                      >
                        Refresh
                      </button>
                    </div>

                    {cloudLoading ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>Loading decks…</p>
                    ) : cloudDecks.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                        No decks published for this class yet.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                        {cloudDecks.map((deck) => (
                          <div
                            key={deck.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              backgroundColor: 'var(--white)',
                              padding: '0.5rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-gray)',
                              fontSize: '0.85rem',
                              gap: '0.5rem',
                            }}
                          >
                            <div style={{ minWidth: 0, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {deck.name}
                            </div>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem', flexShrink: 0 }}
                              onClick={() => handleSelectCloudDeck(deck)}
                            >
                              Use
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="card" style={{ height: 'fit-content' }}>
                      <h3 className="card-title">Import Vocabulary (Admin)</h3>
                      <p className="card-subtitle" style={{ fontSize: '0.75rem' }}>
                        Upload a file, or paste rows from Excel/Sheets (Spanish and English columns). Then publish for your class.
                      </p>

                {/* Dropzone Card */}
                <div 
                  className={`dropzone ${isDraggingCsv ? 'active' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                >
                  <div className="dropzone-icon-container">
                    <UploadIcon className="icon-svg" />
                  </div>
                  <span className="dropzone-text">Drop CSV file here</span>
                  <span className="dropzone-subtext">Click to browse</span>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="file-input-hidden"
                    accept=".csv,.txt,text/csv"
                    onChange={(e) => handleCsvFile(e.target.files[0])}
                  />
                </div>

                <div
                  style={{ marginTop: '1rem' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="settings-label" style={{ display: 'block', marginBottom: '0.375rem' }}>Or paste CSV / spreadsheet data</span>
                  <textarea
                    className="text-answer-input csv-paste-input"
                    style={{ height: '110px', resize: 'vertical', fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}
                    placeholder={'hola,hello\ngracias,thank you\n\nOr paste from Excel (tab-separated):\nhola\thello'}
                    value={csvPasteText}
                    onChange={(e) => setCsvPasteText(e.target.value)}
                    onPaste={handleCsvPasteArea}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ flex: 1, fontSize: '0.8rem' }}
                      disabled={!csvPasteText.trim()}
                      onClick={handleParseCsvPaste}
                    >
                      Preview pasted rows
                    </button>
                  </div>
                </div>

                {csvFileName && (
                  <div style={{ marginTop: '0.875rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📄 {csvFileName}</span>
                    <button 
                      type="button"
                      className="btn" 
                      style={{ padding: '0.15rem 0.4rem', background: 'none', border: 'none', color: 'var(--error-red)', fontSize: '0.75rem' }}
                      onClick={clearCsvImport}
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* Import Preview Cards Table */}
                {csvPreviewCards.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--dark-navy)', marginTop: '1.25rem' }}>
                      Detected Cards ({csvPreviewCards.length})
                    </h4>
                    <div className="table-container">
                      <table className="preview-table">
                        <thead>
                          <tr>
                            <th>Spanish</th>
                            <th>English</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreviewCards.slice(0, 5).map((card, i) => (
                            <tr key={i}>
                              <td>{card.term}</td>
                              <td>{card.definition}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {csvPreviewCards.length > 5 && (
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontStyle: 'italic', marginBottom: '0.875rem' }}>
                        Showing first 5 rows...
                      </p>
                    )}
                    <button 
                      className="btn btn-primary w-full"
                      onClick={confirmImportDeck}
                    >
                      Import Selected Cards
                    </button>
                  </div>
                )}

                {/* Deck statistics widgets */}
                {activeDeck.length > 0 && (
                  <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-gray)', paddingTop: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '0.625rem' }}>Active Deck Stats</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', textAlign: 'center' }}>
                      <div style={{ backgroundColor: 'var(--success-light)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--success-text)' }}>{knownCardIds.size}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>KNOWN</div>
                      </div>
                      <div style={{ backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--warning-text)' }}>{learningCardIds.size}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>LEARNING</div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* ==========================================
            TAB 2: LEARN MODE
            ========================================== */}
        {activeTab === 'learn' && (
          <LearnTab
            activeDeckLength={activeDeck.length}
            learnState={learnState}
            mcOptions={mcOptions}
            matchingBoard={matchingBoard}
            handlers={{
              toggleType: (t) => dispatchLearn({ type: 'TOGGLE_TYPE', payload: { type: t } }),
              startSession: () => dispatchLearn({ type: 'START_SESSION', payload: { deck: activeDeck, types: learnState.questionTypes } }),
              mcSelect: handleMcqSelect,
              setAnswer: (v) => dispatchLearn({ type: 'SET_ANSWER', payload: v }),
              typeSubmit: handleTypeSubmit,
            }}
          />
        )}

        {/* ==========================================
            TAB 3: PRACTICE MODE (past test questions)
            ========================================== */}
        {activeTab === 'practice' && (
          <PracticeTab
            practiceSessionActive={practiceSessionActive}
            practiceSessionEnded={practiceSessionEnded}
            practiceQueue={practiceQueue}
            practiceCursor={practiceCursor}
            practiceInput={practiceInput}
            practiceSubmitted={practiceSubmitted}
            practiceWasCorrect={practiceWasCorrect}
            practiceProgressPct={practiceProgressPct}
            currentPracticeQuestion={currentPracticeQuestion}
            currentPracticeContextBody={currentPracticeContextBody}
            activePracticeSet={activePracticeSet}
            practiceSets={practiceSets}
            isAdmin={isAdmin}
            handlers={{
              setPracticeInput: setPracticeInput,
              submit: handlePracticeSubmit,
              next: handlePracticeNext,
              exit: resetPracticeSession,
              createSet: handleCreatePracticeSet,
              selectedPracticeSetIndex: selectedPracticeSetIndex,
              selectSet: (id, i) => openPracticeSet(id, i),
              back: backToPracticeLibrary,
            }}
          />
        )}

                  {practiceQuestionCount === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      {isAdmin
                        ? 'No questions in this set yet. Add contexts first, then normal or context-linked questions.'
                        : 'No questions in this practice set yet.'}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: '320px', overflowY: 'auto' }}>
                      {practiceBank.questions.map((q) => (
                        <div
                          key={q.id}
                          style={{
                            border: '1px solid var(--border-gray)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.75rem',
                            backgroundColor: 'var(--light-gray)',
                          }}
                        >
                          <span className={`custom-badge ${q.type === 'context' ? 'custom-badge-yellow' : ''}`} style={{ fontSize: '0.6rem', marginBottom: '0.35rem', display: 'inline-block' }}>
                            {q.type === 'context' ? `@${q.contextRef}` : 'normal'}
                          </span>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '0.25rem' }}>
                            {q.prompt}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Answer: {isAdmin ? q.answer : '— hidden until you answer'}
                          </div>
                          {isAdmin && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                              onClick={() => handleDeletePracticeQuestion(q.id)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 4: STORY MODE
            ========================================== */}
        {activeTab === 'story' && (
          <div className="story-tab-container">
            {!storyStarted ? (
              
              /* 1. Setup / Loading Story Selector */
              <div className="card" style={{ maxWidth: '750px', margin: '0 auto' }}>
                <h2 className="card-title">Story Mode</h2>
                <p className="card-subtitle">Translate curated or pasted Spanish texts sentence-by-sentence, then compare your translation to Google Translate.</p>
                
                <div className="story-tabs">
                  <button 
                    className={`story-tab-btn ${storyActiveTab === 'preset' ? 'active' : ''}`}
                    onClick={() => setStoryActiveTab("preset")}
                  >
                    Library Stories
                  </button>
                  {isAdmin && (
                  <button 
                    className={`story-tab-btn ${storyActiveTab === 'custom' ? 'active' : ''}`}
                    onClick={() => setStoryActiveTab("custom")}
                  >
                    Publish Story
                  </button>
                  )}
                </div>

                {storyActiveTab === 'preset' && (
                  <div>
                    {!isInClass && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Join a class in Settings to access library stories.
                      </p>
                    )}
                    <div className="story-list">
                      {cloudStories.map((story, i) => (
                        <div 
                          key={story.id}
                          className={`story-select-card ${selectedStoryIndex === i ? 'active' : ''}`}
                          onClick={() => setSelectedStoryIndex(i)}
                        >
                          <h4 className="story-select-title">{story.title}</h4>
                          <p className="story-select-desc">{story.description}</p>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-blue)', display: 'block', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                            {story.sentences.length} Sentences
                          </span>
                        </div>
                      ))}
                    </div>

                    <button 
                      className="btn btn-primary w-full"
                      disabled={!isInClass || cloudStories.length === 0}
                      onClick={() => startPresetStory(selectedStoryIndex)}
                    >
                      Start Story Practice
                    </button>
                  </div>
                )}

                {storyActiveTab === 'custom' && isAdmin && (
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1.25rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--dark-navy)', textTransform: 'uppercase' }}>Enter Spanish Content (Admin)</span>
                      <textarea 
                        className="text-answer-input"
                        style={{ height: '120px', resize: 'vertical' }}
                        placeholder="Paste Spanish text to practice locally or publish for the class..."
                        value={customStoryText}
                        onChange={(e) => setCustomStoryText(e.target.value)}
                      />
                    </div>

                    <button 
                      className="btn btn-primary w-full"
                      disabled={!customStoryText.trim()}
                      onClick={startCustomStory}
                    >
                      Process & Start (Preview)
                    </button>

                    <button 
                      className="btn btn-primary w-full"
                      style={{ marginTop: '0.75rem', backgroundColor: '#eab308', borderColor: '#ca8a04', color: 'black' }}
                      disabled={!customStoryText.trim()}
                      onClick={handlePublishGlobalStory}
                    >
                      Publish Class Story
                    </button>
                  </div>
                )}

                {storyActiveTab === 'custom' && !isAdmin && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Custom stories are created by your instructor. Use <strong>Library Stories</strong> to practice class content.
                  </p>
                )}

              </div>
            ) : !showStoryEnd ? (
              
              /* 2. Side-by-Side Panel Workspace */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                  <button 
                    className="btn btn-secondary"
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={resetStoryMode}
                  >
                    Exit Story
                  </button>
                  <span className="custom-badge" style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span>{session ? 'Progress auto-saves' : 'Sign in to save progress'}</span>
                    <span>·</span>
                    <span>
                      {getStoryProgress().pct}% ({getStoryProgress().completed}/{getStoryProgress().total})
                    </span>
                  </span>
                </div>

                <div className="progress-container" style={{ marginBottom: '0.875rem' }}>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${getStoryProgress().pct}%` }}
                    ></div>
                  </div>
                </div>

                <div className="story-split-container">
                  
                  {/* Left panel story display */}
                  <div className="story-left-panel">
                    <h3 className="story-title-display">{activeStory.title}</h3>
                    <div className="story-paragraph">
                      {activeStory.sentences.map((sentence, idx) => {
                        let className = "story-sentence";
                        
                        const feedItem = storyFeed.find(f => f.index === idx);
                        const completedStyle = feedItem
                          ? { color: '#1D4ED8', backgroundColor: '#DBEAFE', borderRadius: '0.4rem', padding: '0.05rem 0.2rem' }
                          : undefined;
                        
                        if (idx === currentSentenceIndex) {
                          className += " active";
                        }
                        
                        return (
                          <span 
                            key={idx} 
                            className={className}
                            style={completedStyle}
                          >
                            {sentence.text}{" "}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right panel translation workspace */}
                  <div className="story-right-panel">
                    
                    {/* Translate logs feed */}
                    {storyFeed.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)' }}>Translation History</span>
                        <div className="completed-feed" ref={feedContainerRef}>
                          {storyFeed.map((item, idx) => {
                            return (
                              <div key={idx} className="feed-item" style={{ borderLeft: '3px solid #2563EB', backgroundColor: '#EFF6FF' }}>
                                <div className="feed-heading">
                                  <span>Sentence {item.index + 1}</span>
                                </div>
                                <div className="feed-spanish">"{item.spanish}"</div>
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '0.75rem',
                                    marginTop: '0.5rem',
                                  }}
                                >
                                  <div style={{ backgroundColor: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#854D0E', marginBottom: '0.2rem' }}>YOU WROTE</div>
                                    <div className="feed-user-trans">"{item.userTrans}"</div>
                                  </div>
                                  <div style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#1E40AF', marginBottom: '0.2rem' }}>GOOGLE WROTE</div>
                                    <div className="feed-user-trans" style={{ color: '#1E40AF' }}>"{item.googleTrans}"</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Active Input Panel */}
                    <div className="card" style={{ padding: '1.15rem' }}>
                      <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.375rem', letterSpacing: '0.02em' }}>
                        Translate Active Sentence
                      </h4>
                      <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--primary-blue)', fontWeight: 600, marginBottom: '0.875rem', lineHeight: 1.4 }}>
                        "{activeStory.sentences[currentSentenceIndex].text}"
                      </p>

                      <div className="input-container" style={{ marginBottom: 0 }}>
                        <textarea 
                          className="text-answer-input"
                          style={{ height: '70px', fontSize: '0.85rem' }}
                          placeholder="Type translation in English..."
                          disabled={gradingLoading}
                          value={storyTranslationInput}
                          onChange={(e) => setStoryTranslationInput(e.target.value)}
                          onKeyDown={handleStoryKeyPress}
                        />
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 500 }}>
                            Press Enter or click Submit to compare
                          </span>
                          <button 
                            className="btn btn-primary"
                            style={{ padding: '0.5rem 1rem' }}
                            disabled={!storyTranslationInput.trim() || gradingLoading}
                            onClick={handleStorySentenceSubmit}
                          >
                            {gradingLoading ? "Saving..." : "Submit"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Loading skeleton */}
                    {gradingLoading && (
                      <div className="card ai-loading-container">
                        <div className="ai-loading-spinner"></div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Saving and fetching Google Translate...
                        </span>
                      </div>
                    )}

                  </div>

                </div>
              </div>
            ) : (
              
              /* 3. Story Final Review Results */
              <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="text-center" style={{ padding: '1rem 0' }}>
                  <div style={{ display: 'inline-flex', width: '3rem', height: '3rem', backgroundColor: 'var(--success-light)', color: 'var(--success-green)', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                    <CheckIcon className="icon-svg" />
                  </div>
                  <h2 className="card-title">Story Completed!</h2>
                  <p className="card-subtitle">Compare your sentences to Google Translate.</p>
                </div>

                <div style={{ borderTop: '1px solid var(--border-gray)', paddingTop: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--dark-navy)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.02em' }}>Full Comparison</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {storyFeed.map((item, idx) => {
                      return (
                        <div 
                          key={idx}
                          style={{ border: '1px solid var(--border-gray)', borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: 'var(--white)' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.625rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--dark-navy)' }}>Sentence {idx + 1}</span>
                          </div>

                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: '0.375rem' }}>SPANISH TEXT:</div>
                          <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--dark-navy)', marginBottom: '0.75rem' }}>"{item.spanish}"</div>

                          <div className="review-row" style={{ gridTemplateColumns: '1fr 1fr', padding: 0 }}>
                            <div style={{ backgroundColor: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
                              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#854D0E' }}>YOU WROTE</div>
                              <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.25rem', lineHeight: 1.5 }}>"{item.userTrans}"</div>
                            </div>

                            <div style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
                              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1E40AF' }}>GOOGLE WROTE</div>
                              <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#1E40AF', marginTop: '0.25rem', lineHeight: 1.5 }}>"{item.googleTrans}"</div>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="text-center mt-4" style={{ borderTop: '1px solid var(--border-gray)', paddingTop: '1.25rem' }}>
                  <button 
                    className="btn btn-primary"
                    style={{ margin: '0 auto' }}
                    onClick={resetStoryMode}
                  >
                    Select Another Story
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 5: SETTINGS PANEL
            ========================================== */}
        {activeTab === 'settings' && (
          <div className="settings-tab-container" style={{ maxWidth: '640px', margin: '0 auto' }}>
            <SettingsTab
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              availableClasses={availableClasses}
              userProfile={userProfile}
              profileLoading={profileLoading}
              joinClass={joinClass}
              leaveClass={leaveClass}
              rejoinDefaultClass={rejoinDefaultClass}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: 'var(--white)', borderTop: '1px solid var(--border-gray)', padding: '2rem 1.5rem', textAlign: 'center', marginTop: '4rem' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 500 }}>
          Language Learner - Cloud Spanish Tutor. Built with Vite, React, and Supabase.
        </p>
      </footer>

      <AppDialog dialog={dialog} onClose={closeDialog} />
    </div>
  );
}
