import { useState, useReducer, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import AppDialog from './components/AppDialog.jsx';

// Auto-initialize Supabase from Vite env vars (VITE_ prefix exposes them to the browser build)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseAutoClient = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '0.0.0';
const APP_BUILD_ID = import.meta.env.VITE_BUILD_ID ?? 'dev';
const APP_DISPLAY_VERSION = `${APP_VERSION}.${APP_BUILD_ID}`;

const ADMIN_EMAIL = 'samuel.joseph@live.com';
const DEFAULT_CLASS_SLUG = 'spanish-200';
const DEFAULT_CLASS_NAME = 'Spanish 200';

const profileStorageKey = (userId) => `languagelearner_profile_${userId}`;

const isMissingProfilesTable = (error) =>
  error?.code === 'PGRST205' ||
  (typeof error?.message === 'string' && error.message.includes('user_profiles'));

const loadLocalProfile = (userId) => {
  try {
    const raw = localStorage.getItem(profileStorageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveLocalProfile = (userId, profile) => {
  localStorage.setItem(profileStorageKey(userId), JSON.stringify(profile));
};



// ==========================================
// VECTOR SVG ICONS (Completely replaces Emojis)
// ==========================================
function FolderIcon({ className = "icon-svg" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function UploadIcon({ className = "icon-svg" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function SettingsIcon({ className = "icon-svg" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function StarIcon({ className = "star-vector filled" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function CheckIcon({ className = "icon-svg" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ className = "icon-svg" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ArrowRightIcon({ className = "icon-svg" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function ArrowLeftIcon({ className = "icon-svg" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CloudIcon({ className = "icon-svg" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  );
}

function CopyIcon({ className = "icon-svg" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

// Detect comma vs tab (Excel/Sheets paste)
const detectDelimiter = (text) => {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) || '';
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return tabs > commas ? '\t' : ',';
};

// Safe plain JS delimited parser (CSV or TSV) with quoted fields
const parseCSV = (text) => {
  const delimiter = detectDelimiter(text);
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentValue = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      row.push(currentValue.trim());
      currentValue = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      row.push(currentValue.trim());
      if (row.length > 0 && row.some(cell => cell !== "")) {
        lines.push(row);
      }
      row = [];
      currentValue = "";
    } else {
      currentValue += char;
    }
  }

  if (currentValue !== "" || row.length > 0) {
    row.push(currentValue.trim());
    if (row.length > 0 && row.some(cell => cell !== "")) {
      lines.push(row);
    }
  }

  if (lines.length === 0) return [];
  
  let headerOffset = 0;
  const firstRow = lines[0];
  
  if (
    firstRow[0]?.toLowerCase() === 'term' || 
    firstRow[0]?.toLowerCase() === 'spanish' ||
    firstRow[1]?.toLowerCase() === 'definition' ||
    firstRow[1]?.toLowerCase() === 'english'
  ) {
    headerOffset = 1;
  }

  const cards = [];
  for (let i = headerOffset; i < lines.length; i++) {
    const r = lines[i];
    if (r.length >= 2 && r[0] && r[1]) {
      cards.push({
        id: `csv_${Date.now()}_${i}`,
        term: r[0],
        definition: r[1]
      });
    }
  }
  return cards;
};

// Clean string for grading
const cleanText = (str) => {
  return str
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿¡]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// Direct Web API fetch to Google Translate (Free Public API fallback)
const translateWithGoogle = async (text) => {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Google Translate request failed");
    
    const data = await res.json();
    if (data && data[0]) {
      // Maps and joins all sentences parsed from Google Cloud
      const fullTranslation = data[0].map(item => item[0]).join("").trim();
      return fullTranslation;
    }
    throw new Error("Unable to parse translation response");
  } catch (err) {
    console.error("Google Translate Error:", err);
    return null;
  }
};

// Semantic similarities grader
const gradeTranslationSemantic = (userText, targetText) => {
  const cleanUser = cleanText(userText);
  const cleanTarget = cleanText(targetText);

  if (!cleanUser) {
    return {
      score: 1,
      what_was_right: "No input provided.",
      what_was_off: "The translation was blank. Please type in a translation.",
      suggested_translation: targetText
    };
  }

  const userWords = cleanUser.split(" ");
  const targetWords = cleanTarget.split(" ");
  
  const matched = userWords.filter(word => targetWords.includes(word));
  const uniqueMatches = [...new Set(matched)];
  const overlapRatio = uniqueMatches.length / [...new Set(targetWords)].length;

  let score = 1;
  let what_was_right = "You completed the submission.";
  let what_was_off = "The words and translation structure did not match the reference translation.";

  if (cleanUser === cleanTarget) {
    score = 5;
    what_was_right = "Excellent! Your translation is identical to the target translation.";
    what_was_off = "No errors detected.";
  } else if (overlapRatio >= 0.8) {
    score = 5;
    what_was_right = "Superb! Excellent vocabulary selection, and the phrasing is highly natural.";
    what_was_off = "Minor stylistic differences, but the meaning is fully correct.";
  } else if (overlapRatio >= 0.55) {
    score = 4;
    what_was_right = "Great translation! You translated key concepts correctly: " + uniqueMatches.join(", ");
    what_was_off = "A few prepositions or words could be adjusted to sound more natural.";
  } else if (overlapRatio >= 0.3) {
    score = 3;
    what_was_right = "Decent attempt. You captured some correct words: " + uniqueMatches.join(", ");
    what_was_off = "Several crucial parts of the sentence meaning were omitted.";
  } else if (overlapRatio > 0.05) {
    score = 2;
    what_was_right = "You matched some words: " + uniqueMatches.join(", ");
    what_was_off = "The translation meaning deviates significantly from the original.";
  } else {
    score = 1;
    what_was_right = "You started translating, which is a great exercise.";
    what_was_off = "None of the words match the target translation. Try adjusting vocabulary choices.";
  }

  return {
    score,
    what_was_right,
    what_was_off,
    suggested_translation: targetText
  };
};

// ==========================================
// LEARN MODE REDUCER (State Management)
// ==========================================
const initialLearnState = {
  settingsScreen: true,
  questionTypes: {
    mc: true,
    type: true,
    tf: true,
    matching: true
  },
  questionQueue: [],
  currentQuestion: null,
  history: [],
  totalQuestionsCount: 0,
  totalAttempts: 0,
  firstTimeCorrect: 0,
  startTime: null,
  endTime: null,
  userAnswer: "",
  selectedOption: null,
  isAnswerSubmitted: false,
  isCorrect: null,
  // Matching sub-game state
  matchingSelectedCard: null,
  matchingMatchedIds: [],
  matchingMismatchedIds: [],
  matchingMismatchesCount: 0
};

function learnReducer(state, action) {
  switch (action.type) {
    case 'START_SESSION': {
      const { deck, types } = action.payload;
      if (!deck || deck.length === 0) return state;

      const activeTypes = Object.keys(types).filter(k => types[k]);
      
      const queue = deck.map(card => {
        const type = activeTypes[Math.floor(Math.random() * activeTypes.length)];
        return {
          card,
          type,
          attempts: 0
        };
      });

      return {
        ...state,
        settingsScreen: false,
        questionTypes: types,
        questionQueue: queue,
        currentQuestion: queue[0],
        totalQuestionsCount: deck.length,
        totalAttempts: 0,
        firstTimeCorrect: 0,
        history: [],
        startTime: Date.now(),
        endTime: null,
        userAnswer: "",
        selectedOption: null,
        isAnswerSubmitted: false,
        isCorrect: null,
        matchingSelectedCard: null,
        matchingMatchedIds: [],
        matchingMismatchedIds: [],
        matchingMismatchesCount: 0
      };
    }

    case 'TOGGLE_TYPE': {
      const { type } = action.payload;
      const count = Object.values(state.questionTypes).filter(Boolean).length;
      if (state.questionTypes[type] && count <= 1) {
        return state;
      }
      return {
        ...state,
        questionTypes: {
          ...state.questionTypes,
          [type]: !state.questionTypes[type]
        }
      };
    }

    case 'SET_ANSWER':
      return { ...state, userAnswer: action.payload };

    case 'SET_SELECTED_OPTION':
      return { ...state, selectedOption: action.payload };

    case 'SUBMIT_ANSWER': {
      const { isCorrect } = action.payload;
      const current = state.currentQuestion;
      
      const totalAttempts = state.totalAttempts + 1;
      let firstTimeCorrect = state.firstTimeCorrect;
      
      if (isCorrect && current.attempts === 0) {
        firstTimeCorrect += 1;
      }

      return {
        ...state,
        isAnswerSubmitted: true,
        isCorrect,
        totalAttempts,
        firstTimeCorrect
      };
    }

    case 'NEXT_QUESTION': {
      const { isCorrect } = state;
      const current = state.currentQuestion;
      const remainingQueue = [...state.questionQueue];

      remainingQueue.shift();

      if (!isCorrect) {
        remainingQueue.push({
          ...current,
          attempts: current.attempts + 1
        });
      } else {
        state.history.push(current);
      }

      if (remainingQueue.length === 0) {
        return {
          ...state,
          questionQueue: [],
          currentQuestion: null,
          isAnswerSubmitted: false,
          endTime: Date.now()
        };
      }

      const nextQuestion = remainingQueue[0];
      return {
        ...state,
        questionQueue: remainingQueue,
        currentQuestion: nextQuestion,
        userAnswer: "",
        selectedOption: null,
        isAnswerSubmitted: false,
        isCorrect: null,
        matchingSelectedCard: null,
        matchingMatchedIds: [],
        matchingMismatchedIds: [],
        matchingMismatchesCount: 0
      };
    }

    case 'SELECT_MATCHING_CARD':
      return { ...state, matchingSelectedCard: action.payload };

    case 'CLEAR_MATCHING_SELECTION':
      return { ...state, matchingSelectedCard: null };

    case 'ADD_MATCHED_PAIR':
      return {
        ...state,
        matchingMatchedIds: [...state.matchingMatchedIds, ...action.payload],
        matchingSelectedCard: null
      };

    case 'SET_MISMATCHED_FLASH':
      return {
        ...state,
        matchingMismatchedIds: action.payload
      };

    case 'INCREMENT_MISMATCHES':
      return {
        ...state,
        matchingMismatchesCount: state.matchingMismatchesCount + 1,
        matchingSelectedCard: null
      };

    case 'RESET_LEARN_SESSION':
      return {
        ...initialLearnState,
        questionTypes: state.questionTypes
      };

    default:
      return state;
  }
}

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState("flashcards"); // flashcards, learn, story, settings
  
  // API Keys / Configurations (In-Memory Only)
  const [apiKey, setApiKey] = useState("");
  // Supabase — auto-connected from .env, no manual entry needed
  const [supabaseClient, setSupabaseClient] = useState(supabaseAutoClient);
  const [dbConnected, setDbConnected] = useState(false);
  const [dbError, setDbError] = useState("");
  
  // Decks state (Starts empty as requested)
  const [currentDeckName, setCurrentDeckName] = useState("custom");
  const [customDeck, setCustomDeck] = useState([]);
  const [csvPreviewCards, setCsvPreviewCards] = useState([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvPasteText, setCsvPasteText] = useState("");
  const [isDraggingCsv, setIsDraggingCsv] = useState(false);
  
  // Loaded cloud decks from Supabase
  const [cloudDecks, setCloudDecks] = useState([]);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudStories, setCloudStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(false);

  // Auth & Admin State
  const [session, setSession] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  // Class membership (default: Spanish 200)
  const [availableClasses, setAvailableClasses] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [classActionLoading, setClassActionLoading] = useState(false);

  const activeClassId = userProfile?.active_class_id ?? null;
  const activeClass = availableClasses.find((c) => c.id === activeClassId) ?? null;
  const isInClass = Boolean(activeClassId);

  // In-app dialogs & banners (replaces window.alert / prompt)
  const dialogResolveRef = useRef(null);
  const [dialog, setDialog] = useState(null);
  const [appBanner, setAppBanner] = useState(null);

  const closeDialog = (result) => {
    const resolve = dialogResolveRef.current;
    dialogResolveRef.current = null;
    setDialog(null);
    resolve?.(result);
  };

  const showAlert = ({ title, message, variant = 'info' }) =>
    new Promise((resolve) => {
      dialogResolveRef.current = () => resolve(true);
      setDialog({ type: 'alert', title, message, variant });
    });

  const showPrompt = ({
    title,
    message,
    defaultValue = '',
    placeholder = '',
    submitLabel = 'Save',
  }) =>
    new Promise((resolve) => {
      dialogResolveRef.current = (value) => resolve(value);
      setDialog({
        type: 'prompt',
        title,
        message,
        defaultValue,
        placeholder,
        submitLabel,
      });
    });

  const showForm = ({ title, message, fields, submitLabel = 'Submit' }) =>
    new Promise((resolve) => {
      dialogResolveRef.current = (value) => resolve(value);
      const values = {};
      fields.forEach((f) => {
        values[f.id] = f.defaultValue ?? '';
      });
      setDialog({ type: 'form', title, message, fields, values, submitLabel });
    });

  const showBanner = (message, variant = 'success') => {
    setAppBanner({ message, variant });
    window.setTimeout(() => {
      setAppBanner((current) => (current?.message === message ? null : current));
    }, 4500);
  };

  // Auto-verify Supabase connection and handle Auth Session
  useEffect(() => {
    if (!supabaseAutoClient) {
      setDbError("No Supabase env vars found. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.");
      return;
    }

    let mounted = true;
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabaseAutoClient.auth.getSession();
        if (error) {
          console.warn("Supabase auth session error:", error);
        }
        if (mounted) {
          setSession(data?.session ?? null);
        }
      } catch (err) {
        console.error("Failed to load auth session:", err);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabaseAutoClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const checkConnection = async () => {
      try {
        const { error } = await supabaseAutoClient.from('decks').select('id').limit(1);
        if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
          // PGRST116 = no rows; 42P01 = table doesn't exist yet — both mean connection is alive
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
        if (data?.session) {
          setSession(data.session);
        }
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
    setUserProfile(null);
  };

  const getDefaultClassId = async () => {
    const fromList =
      availableClasses.find((c) => c.slug === DEFAULT_CLASS_SLUG || c.name === DEFAULT_CLASS_NAME) ??
      availableClasses[0];
    if (fromList?.id) return fromList.id;

    if (!supabaseClient) return null;

    // Name first — many DBs have classes without a slug column yet
    const { data: byName, error: nameError } = await supabaseClient
      .from('classes')
      .select('id')
      .eq('name', DEFAULT_CLASS_NAME)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!nameError && byName?.id) return byName.id;

    const { data: bySlug, error: slugError } = await supabaseClient
      .from('classes')
      .select('id')
      .eq('slug', DEFAULT_CLASS_SLUG)
      .maybeSingle();

    if (!slugError && bySlug?.id) return bySlug.id;

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
    // Dedupe legacy rows (multiple "Spanish 200" before slug migration)
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

  const joinClass = async (classId) => {
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
      await showAlert({
        title: 'Could not join class',
        message: err.message,
        variant: 'error',
      });
    } finally {
      setClassActionLoading(false);
    }
  };

  const leaveClass = async () => {
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
        setCloudDecks([]);
        setCloudStories([]);
        return;
      }

      if (isMissingProfilesTable(error)) {
        applyLocalProfile({
          user_id: session.user.id,
          email: session.user.email,
          active_class_id: null,
        });
        setCloudDecks([]);
        setCloudStories([]);
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
        setCloudDecks([]);
        setCloudStories([]);
        return;
      }
      await showAlert({
        title: 'Could not leave class',
        message: err.message,
        variant: 'error',
      });
    } finally {
      setClassActionLoading(false);
    }
  };

  const rejoinDefaultClass = async () => {
    if (availableClasses.length === 0) {
      await fetchAvailableClasses();
    }
    const defaultId = await getDefaultClassId();
    if (!defaultId) {
      await showAlert({
        title: 'Class not found',
        message:
          'Spanish 200 was not found in the database. In Supabase → SQL Editor, run supabase/setup_now.sql, then hard-refresh this page (Ctrl+Shift+R).',
        variant: 'error',
      });
      return;
    }
    await joinClass(defaultId);
  };

  // Fetch available decks from Supabase Cloud
  const fetchCloudDecks = async () => {
    if (!supabaseClient) return;
    if (!isAdmin && !activeClassId) {
      setCloudDecks([]);
      return;
    }
    setCloudLoading(true);
    try {
      let query = supabaseClient.from('decks').select('*');
      if (activeClassId) {
        query = query.eq('class_id', activeClassId);
      }

      const { data: decksData, error: decksError } = await query;

      if (decksError) throw decksError;

      const decksWithCards = [];
      for (const d of decksData) {
        const { data: cardsData, error: cardsError } = await supabaseClient
          .from('cards')
          .select('*')
          .eq('deck_id', d.id);
        
        if (!cardsError) {
          decksWithCards.push({
            id: d.id,
            name: d.name,
            description: d.description,
            cards: cardsData.map(c => ({ id: c.id, term: c.term, definition: c.definition }))
          });
        }
      }
      setCloudDecks(decksWithCards);
    } catch (err) {
      console.error("Fetch Cloud Decks Error:", err);
    } finally {
      setCloudLoading(false);
    }
  };

  // Fetch available stories from Supabase Cloud
  const fetchCloudStories = async () => {
    if (!supabaseClient) return;
    if (!isAdmin && !activeClassId) {
      setCloudStories([]);
      return;
    }
    setStoriesLoading(true);
    try {
      let query = supabaseClient.from('stories').select('*');
      if (activeClassId) {
        query = query.eq('class_id', activeClassId);
      }
      const { data, error } = await query;
      if (error) throw error;
      setCloudStories(
        (data || []).map((s) => ({
          ...s,
          sentences: s.sentences_jsonb || s.sentences || [],
        }))
      );
    } catch (err) {
      console.error("Fetch Cloud Stories Error:", err);
    } finally {
      setStoriesLoading(false);
    }
  };

  // Load classes + profile when user signs in
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

  // Trigger deck and story fetch when DB state changes or class membership changes
  useEffect(() => {
    if (dbConnected && session && !profileLoading) {
      fetchCloudDecks();
      fetchCloudStories();
    } else if (!session) {
      setCloudDecks([]);
      setCloudStories([]);
    }
  }, [dbConnected, session?.user?.id, activeClassId, profileLoading, isAdmin]);

  // Save current active deck to Supabase (admin only — class-scoped)
  const handleSaveGlobalDeck = async () => {
    if (!isAdmin) return;
    const activeDeck = getActiveDeck();
    if (!supabaseClient || activeDeck.length === 0) return;

    const publishClassId = await resolvePublishClassId();
    if (!publishClassId) {
      await showAlert({
        title: 'No class selected',
        message: 'Join a class in Settings before publishing a deck.',
        variant: 'error',
      });
      return;
    }

    const classLabel = activeClass?.name || 'Spanish 200';
    const deckNameInput = await showPrompt({
      title: 'Name this study deck',
      message: `Students in ${classLabel} will see this deck in the library.`,
      defaultValue: 'Class Vocabulary',
      placeholder: 'Deck name',
      submitLabel: 'Publish deck',
    });
    if (!deckNameInput) return;

    try {
      const { data: deckData, error: deckError } = await supabaseClient
        .from('decks')
        .insert({ 
          name: deckNameInput, 
          description: `Official deck for ${classLabel}`,
          user_id: session.user.id,
          is_global: true,
          class_id: publishClassId,
        })
        .select()
        .single();

      if (deckError) throw deckError;

      const cardsToInsert = activeDeck.map(c => ({
        deck_id: deckData.id,
        term: c.term,
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

  // Choose a deck loaded from cloud
  const handleSelectCloudDeck = (cloudDeckObj) => {
    setCustomDeck(cloudDeckObj.cards);
    setCurrentDeckName("custom");
    showBanner(`Loaded deck: ${cloudDeckObj.name}`, 'success');
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

  useEffect(() => {
    setFlashcardIndex(0);
    setIsCardFlipped(false);
  }, [customDeck]);

  const activeDeck = getActiveDeck();
  const currentFlashcard = activeDeck[flashcardIndex];

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
    if (csvPreviewCards.length > 0) {
      setCustomDeck(csvPreviewCards);
      setCurrentDeckName("custom");
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
    
    const cleanedUser = cleanText(learnState.userAnswer);
    const cleanedTarget = cleanText(learnState.currentQuestion.card.definition);
    
    const isCorrect = cleanedUser === cleanedTarget;
    dispatchLearn({ type: 'SUBMIT_ANSWER', payload: { isCorrect } });
  };

  const handleMatchingCardClick = (card) => {
    if (learnState.matchingMatchedIds.includes(card.id)) return;
    if (learnState.matchingMismatchedIds.includes(card.id)) return;

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
        dispatchLearn({ type: 'SET_MISMATCHED_FLASH', payload: [selected.id, card.id] });
        
        setTimeout(() => {
          dispatchLearn({ type: 'SET_MISMATCHED_FLASH', payload: [] });
        }, 500);
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
  const [apiWarningTranslate, setApiWarningTranslate] = useState(false);
  const [showStoryEnd, setShowStoryEnd] = useState(false);

  const feedContainerRef = useRef(null);

  useEffect(() => {
    if (feedContainerRef.current) {
      feedContainerRef.current.scrollTop = feedContainerRef.current.scrollHeight;
    }
  }, [storyFeed]);

  const startCustomStory = () => {
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

    setActiveStory(mockStory);
    setStoryStarted(true);
    setCurrentSentenceIndex(0);
    setStoryFeed([]);
    setStoryTranslationInput("");
    setShowStoryEnd(false);
    setApiWarningTranslate(false);
  };

  const startPresetStory = (idx) => {
    setActiveStory(cloudStories[idx]);
    setCurrentSentenceIndex(0);
    setCurrentSentenceIndex(0);
    setStoryFeed([]);
    setStoryTranslationInput("");
    setShowStoryEnd(false);
    setApiWarningTranslate(false);
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
    setApiWarningTranslate(false);

    let parsedGrade = null;

    if (apiKey.trim()) {
      // 1. GEMINI GRADE METHOD
      try {
        const promptText = `You are a Spanish language teacher grading a student's translation. The original Spanish sentence is: '${sentenceObj.text}'. The student translated it as: '${storyTranslationInput.trim()}'. Grade the translation on a scale of 1-5 where 5 is perfect. Respond ONLY in this exact JSON format with no markdown:\n{\n  "score": number,\n  "what_was_right": "string",\n  "what_was_off": "string",\n  "suggested_translation": "string"\n}`;
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: promptText,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (!response.ok) throw new Error("Gemini API request failed.");

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        const cleanJSON = rawText
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();

        parsedGrade = JSON.parse(cleanJSON);
      } catch (err) {
        console.error("Gemini API failed, falling back to Google Translate:", err);
        setApiWarningTranslate(true);
        
        // Dynamic Google Translate Fallback
        const googleTranslation = await translateWithGoogle(sentenceObj.text);
        parsedGrade = gradeTranslationSemantic(
          storyTranslationInput,
          googleTranslation || sentenceObj.translation
        );
      }
    } else {
      // 2. KEYLESS GOOGLE TRANSLATE FALLBACK
      setApiWarningTranslate(true);
      const googleTranslation = await translateWithGoogle(sentenceObj.text);
      parsedGrade = gradeTranslationSemantic(
        storyTranslationInput,
        googleTranslation || sentenceObj.translation
      );
    }

    setGradingLoading(false);

    if (parsedGrade) {
      const feedItem = {
        index: currentSentenceIndex,
        spanish: sentenceObj.text,
        userTrans: storyTranslationInput,
        aiGrade: parsedGrade
      };

      setStoryFeed(prev => [...prev, feedItem]);
      setStoryTranslationInput("");

      // Log to Supabase Cloud
      if (supabaseClient) {
        try {
          await supabaseClient.from('translation_history').insert({
            story_title: activeStory.title,
            sentence_index: currentSentenceIndex,
            spanish_text: sentenceObj.text,
            user_translation: storyTranslationInput.trim(),
            score: parsedGrade.score,
            feedback: parsedGrade
          });
        } catch (err) {
          console.error("Error saving history to Supabase:", err);
        }
      }

      if (currentSentenceIndex + 1 >= activeStory.sentences.length) {
        setShowStoryEnd(true);
      } else {
        setCurrentSentenceIndex(prev => prev + 1);
      }
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
    setApiWarningTranslate(false);
  };

  const getAverageStoryScore = () => {
    if (storyFeed.length === 0) return 0;
    const total = storyFeed.reduce((sum, item) => sum + item.aiGrade.score, 0);
    return (total / storyFeed.length).toFixed(1);
  };

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
        
        {/* Supabase connection indicator banner (For Flashcards / Learn) */}
        {activeTab !== 'settings' && dbConnected && (
          <div className="sync-bar">
            <span className="sync-text">
              <CloudIcon className="icon-svg-sm" /> Connected to Supabase Cloud
              {isInClass && activeClass ? ` · ${activeClass.name}` : ''}
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
            <div style={{ display: 'grid', gridTemplateColumns: activeDeck.length > 0 ? '1fr 340px' : '1fr', gap: '1.75rem' }}>
              
              {/* Left Side: Active Flashcard Viewer */}
              {activeDeck.length > 0 ? (
                <div className="card text-center" style={{ minHeight: '480px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="custom-badge">
                        Card {flashcardIndex + 1} of {activeDeck.length}
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
                          style={{ width: `${((flashcardIndex + 1) / activeDeck.length) * 100}%` }}
                        ></div>
                      </div>
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

                  {/* Cloud Decks Loader Area */}
                  {dbConnected && isInClass && cloudDecks.length > 0 && (
                    <div style={{ maxWidth: '440px', margin: '0 auto 2rem', border: '1px solid var(--border-gray)', borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: '#F8FAFC' }}>
                      <h4 style={{ fontSize: '0.8rem', color: 'var(--dark-navy)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 700, marginBottom: '0.75rem' }}>
                        Load Deck from Supabase
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {cloudDecks.map((deck) => (
                          <div 
                            key={deck.id}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--white)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-gray)', fontSize: '0.85rem' }}
                          >
                            <span style={{ fontWeight: 600 }}>{deck.name} ({deck.cards.length} cards)</span>
                            <button 
                              className="btn btn-primary"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => handleSelectCloudDeck(deck)}
                            >
                              Load
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="d-flex justify-between" style={{ maxWidth: '280px', margin: '0 auto' }}>
                      <button 
                        className="btn btn-primary"
                        onClick={() => fileInputRef.current.click()}
                      >
                        Browse CSV File
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Right Side CSV Uploader — admin only */}
              {isAdmin && (
              <div className="card" style={{ height: 'fit-content' }}>
                <h3 className="card-title">Import Vocabulary (Admin)</h3>
                <p className="card-subtitle" style={{ fontSize: '0.75rem' }}>Upload a file, or paste rows from Excel/Sheets (Spanish and English columns). Then publish for your class.</p>

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
          </div>
        )}

        {/* ==========================================
            TAB 2: LEARN MODE
            ========================================== */}
        {activeTab === 'learn' && (
          <div className="learn-tab-container">
            {activeDeck.length === 0 ? (
              <div className="card text-center" style={{ padding: '3.5rem' }}>
                <div style={{ display: 'inline-flex', width: '3.5rem', height: '3.5rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary-blue)', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <FolderIcon className="icon-svg" />
                </div>
                <h2 className="card-title">Load Study Cards</h2>
                <p className="card-subtitle">
                  {isInClass
                    ? 'Load a class deck from the Flashcards tab to run Learn sessions.'
                    : 'Join your class in Settings, then load a shared deck from Flashcards.'}
                </p>
              </div>
            ) : learnState.settingsScreen ? (
              
              /* 1. Learn settings selector */
              <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2 className="card-title">Setup Learn Session</h2>
                <p className="card-subtitle">Toggle the following check cards to customize the session question mix.</p>
                
                <div className="selection-grid">
                  <div 
                    className={`selection-card ${learnState.questionTypes.mc ? 'selected' : ''}`}
                    onClick={() => dispatchLearn({ type: 'TOGGLE_TYPE', payload: { type: 'mc' } })}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="selection-title">Multiple Choice</span>
                      <div className="selection-checkbox">
                        <CheckIcon className="selection-checkbox-svg" />
                      </div>
                    </div>
                    <span className="selection-description">Pick correct definitions from 4 translations.</span>
                  </div>

                  <div 
                    className={`selection-card ${learnState.questionTypes.type ? 'selected' : ''}`}
                    onClick={() => dispatchLearn({ type: 'TOGGLE_TYPE', payload: { type: 'type' } })}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="selection-title">Type the Answer</span>
                      <div className="selection-checkbox">
                        <CheckIcon className="selection-checkbox-svg" />
                      </div>
                    </div>
                    <span className="selection-description">Write the exact translation in free-form English.</span>
                  </div>

                  <div 
                    className={`selection-card ${learnState.questionTypes.tf ? 'selected' : ''}`}
                    onClick={() => dispatchLearn({ type: 'TOGGLE_TYPE', payload: { type: 'tf' } })}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="selection-title">True / False</span>
                      <div className="selection-checkbox">
                        <CheckIcon className="selection-checkbox-svg" />
                      </div>
                    </div>
                    <span className="selection-description">Verify if suggested translation is correct or incorrect.</span>
                  </div>

                  <div 
                    className={`selection-card ${learnState.questionTypes.matching ? 'selected' : ''}`}
                    onClick={() => dispatchLearn({ type: 'TOGGLE_TYPE', payload: { type: 'matching' } })}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="selection-title">Matching Pairs</span>
                      <div className="selection-checkbox">
                        <CheckIcon className="selection-checkbox-svg" />
                      </div>
                    </div>
                    <span className="selection-description">Match Spanish terms to their English definitions in a grid.</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-gray)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Study deck contains <strong>{activeDeck.length}</strong> cards.
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={() => dispatchLearn({ 
                      type: 'START_SESSION', 
                      payload: { deck: activeDeck, types: learnState.questionTypes } 
                    })}
                  >
                    Start Session
                  </button>
                </div>
              </div>
            ) : learnState.currentQuestion ? (
              
              /* 2. Active Learn interactive panel */
              <div className="card" style={{ maxWidth: '580px', margin: '0 auto', minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="custom-badge">
                      Progress: {learnState.totalQuestionsCount - learnState.questionQueue.length} / {learnState.totalQuestionsCount}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>
                      Remaining: {learnState.questionQueue.length}
                    </span>
                  </div>

                  <div className="progress-container">
                    <div className="progress-bar-bg">
                      <div 
                        className="progress-bar-fill"
                        style={{ width: `${((learnState.totalQuestionsCount - learnState.questionQueue.length) / learnState.totalQuestionsCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div style={{ margin: '1.25rem 0' }}>
                  
                  {/* MC Question Template */}
                  {learnState.currentQuestion.type === 'mc' && (
                    <div>
                      <h3 className="question-prompt">How do you translate: "{learnState.currentQuestion.card.term}"?</h3>
                      <div className="options-grid">
                        {mcOptions.map((opt, i) => {
                          let className = "option-button";
                          const isTarget = opt === learnState.currentQuestion.card.definition;
                          
                          if (learnState.isAnswerSubmitted) {
                            if (isTarget) className += " correct";
                            else if (learnState.selectedOption === opt) className += " incorrect";
                          }
                          
                          return (
                            <button 
                              key={i}
                              className={className}
                              disabled={learnState.isAnswerSubmitted}
                              onClick={() => handleMcqSelect(opt)}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Free text grade template */}
                  {learnState.currentQuestion.type === 'type' && (
                    <div>
                      <h3 className="question-prompt">Translate this word to English:</h3>
                      <div className="text-center" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark-navy)', marginBottom: '1.25rem' }}>
                        "{learnState.currentQuestion.card.term}"
                      </div>
                      
                      <div className="input-container">
                        <input 
                          type="text"
                          className="text-answer-input"
                          placeholder="Type translation here..."
                          disabled={learnState.isAnswerSubmitted}
                          value={learnState.userAnswer}
                          onChange={(e) => dispatchLearn({ type: 'SET_ANSWER', payload: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleTypeSubmit();
                          }}
                        />
                        {!learnState.isAnswerSubmitted && (
                          <button 
                            className="btn btn-primary" 
                            style={{ alignSelf: 'center' }}
                            onClick={handleTypeSubmit}
                          >
                            Check Answer
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* True / False template */}
                  {learnState.currentQuestion.type === 'tf' && (
                    <div>
                      <h3 className="question-prompt">Is this translation correct?</h3>
                      
                      <div className="tf-container">
                        <div className="tf-card">
                          <div className="tf-spanish">"{learnState.currentQuestion.card.term}"</div>
                          <div className="tf-separator">means</div>
                          <div className="tf-english">"{mcOptions[0]}"</div>
                        </div>

                        <div className="tf-buttons">
                          <button 
                            className={`btn tf-btn ${learnState.isAnswerSubmitted ? (mcOptions[0] === learnState.currentQuestion.card.definition ? 'btn-success' : 'btn-secondary') : 'btn-success'}`}
                            disabled={learnState.isAnswerSubmitted}
                            onClick={() => handleTfSelect(true)}
                          >
                            True
                          </button>
                          <button 
                            className={`btn tf-btn ${learnState.isAnswerSubmitted ? (mcOptions[0] !== learnState.currentQuestion.card.definition ? 'btn-error' : 'btn-secondary') : 'btn-error'}`}
                            disabled={learnState.isAnswerSubmitted}
                            onClick={() => handleTfSelect(false)}
                          >
                            False
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Grid pair matching template */}
                  {learnState.currentQuestion.type === 'matching' && (
                    <div className="matching-container">
                      <h3 className="question-prompt" style={{ marginBottom: '0.25rem' }}>Match the Vocab Pairs</h3>
                      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
                        Mismatches: <strong style={{ color: 'var(--error-red)' }}>{learnState.matchingMismatchesCount}</strong>
                      </p>

                      <div className="matching-grid">
                        
                        <div className="matching-column">
                          <h4 style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', marginBottom: '0.25rem' }}>Spanish</h4>
                          {matchingBoard.es?.map((card) => {
                            let className = "matching-card";
                            const isSelected = learnState.matchingSelectedCard?.id === card.id && learnState.matchingSelectedCard?.side === 'es';
                            const isMatched = learnState.matchingMatchedIds.includes(card.id);
                            const isMismatched = learnState.matchingMismatchedIds.includes(card.id);

                            if (isSelected) className += " selected";
                            if (isMatched) className += " matched";
                            if (isMismatched) className += " mismatched";

                            return (
                              <div 
                                key={card.id} 
                                className={className}
                                onClick={() => handleMatchingCardClick(card)}
                              >
                                {card.text}
                              </div>
                            );
                          })}
                        </div>

                        <div className="matching-column">
                          <h4 style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', marginBottom: '0.25rem' }}>English</h4>
                          {matchingBoard.en?.map((card) => {
                            let className = "matching-card";
                            const isSelected = learnState.matchingSelectedCard?.id === card.id && learnState.matchingSelectedCard?.side === 'en';
                            const isMatched = learnState.matchingMatchedIds.includes(card.id);
                            const isMismatched = learnState.matchingMismatchedIds.includes(card.id);

                            if (isSelected) className += " selected";
                            if (isMatched) className += " matched";
                            if (isMismatched) className += " mismatched";

                            return (
                              <div 
                                key={card.id} 
                                className={className}
                                onClick={() => handleMatchingCardClick(card)}
                              >
                                {card.text}
                              </div>
                            );
                          })}
                        </div>

                      </div>
                    </div>
                  )}

                </div>

                {/* Question results notifications */}
                <div>
                  {learnState.isAnswerSubmitted && (
                    <div className={`feedback-overlay ${learnState.isCorrect ? 'correct' : 'incorrect'}`}>
                      <div>
                        <div className="feedback-text-title">
                          {learnState.isCorrect ? "Correct" : "Needs Review"}
                        </div>
                        <div className="feedback-text-desc">
                          Spanish: <strong>{learnState.currentQuestion.card.term}</strong> = English: <strong>{learnState.currentQuestion.card.definition}</strong>
                        </div>
                      </div>
                      <button 
                        className="btn btn-primary"
                        onClick={() => dispatchLearn({ type: 'NEXT_QUESTION' })}
                      >
                        Continue
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              
              /* 3. Learn session scoreboard results */
              <div className="card end-screen" style={{ maxWidth: '540px', margin: '0 auto' }}>
                <div style={{ display: 'inline-flex', width: '3rem', height: '3rem', backgroundColor: 'var(--success-light)', color: 'var(--success-green)', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <CheckIcon className="icon-svg" />
                </div>
                <h2 className="card-title">Session Accomplished!</h2>
                <p className="card-subtitle">Excellent focus! You successfully completed all terms in the active deck.</p>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{learnState.totalQuestionsCount}</div>
                    <div className="stat-label">Total Cards</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {((learnState.firstTimeCorrect / learnState.totalQuestionsCount) * 100).toFixed(0)}%
                    </div>
                    <div className="stat-label">Accuracy</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {formatTime(learnState.endTime - learnState.startTime)}
                    </div>
                    <div className="stat-label">Time Taken</div>
                  </div>
                </div>

                <div className="button-group mt-4" style={{ borderTop: '1px solid var(--border-gray)', paddingTop: '1.25rem' }}>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => dispatchLearn({ type: 'RESET_LEARN_SESSION' })}
                  >
                    Adjust Settings
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => dispatchLearn({ 
                      type: 'START_SESSION', 
                      payload: { deck: activeDeck, types: learnState.questionTypes } 
                    })}
                  >
                    Study Again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 3: STORY MODE
            ========================================== */}
        {activeTab === 'story' && (
          <div className="story-tab-container">
            {!storyStarted ? (
              
              /* 1. Setup / Loading Story Selector */
              <div className="card" style={{ maxWidth: '750px', margin: '0 auto' }}>
                <h2 className="card-title">Story Mode</h2>
                <p className="card-subtitle">Translate curated or pasted Spanish texts. Graded sentence-by-sentence using Gemini API, with automatic fallback to Google Translate.</p>
                
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
                  <span className="custom-badge">
                    Sentence {currentSentenceIndex + 1} of {activeStory.sentences.length}
                  </span>
                </div>

                {apiWarningTranslate && (
                  <div style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-border)', borderRadius: 'var(--radius-md)', padding: '0.625rem 0.875rem', color: '#1E40AF', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.875rem' }}>
                    <span>Notice:</span>
                    <span>No Gemini API key supplied. Translating instantly using <strong>Google Translate</strong> and grading semantic similarity.</span>
                  </div>
                )}

                <div className="story-split-container">
                  
                  {/* Left panel story display */}
                  <div className="story-left-panel">
                    <h3 className="story-title-display">{activeStory.title}</h3>
                    <div className="story-paragraph">
                      {activeStory.sentences.map((sentence, idx) => {
                        let className = "story-sentence";
                        
                        const feedItem = storyFeed.find(f => f.index === idx);
                        if (feedItem) {
                          const score = feedItem.aiGrade.score;
                          if (score >= 4) className += " completed-green";
                          else if (score === 3) className += " completed-yellow";
                          else className += " completed-red";
                        }
                        
                        if (idx === currentSentenceIndex) {
                          className += " active";
                        }
                        
                        return (
                          <span 
                            key={idx} 
                            className={className}
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
                            const score = item.aiGrade.score;
                            let scoreClass = "score-red";
                            if (score >= 4) scoreClass = "score-green";
                            else if (score === 3) scoreClass = "score-yellow";
                            
                            return (
                              <div key={idx} className={`feed-item ${scoreClass}`}>
                                <div className="feed-heading">
                                  <span>Sentence {item.index + 1}</span>
                                  <div className="star-rating-container">
                                    {[1, 2, 3, 4, 5].map((starVal) => (
                                      <StarIcon 
                                        key={starVal} 
                                        className={`star-vector ${starVal <= score ? 'filled' : ''}`} 
                                      />
                                    ))}
                                  </div>
                                </div>
                                <div className="feed-spanish">"{item.spanish}"</div>
                                <div className="feed-user-trans">"{item.userTrans}"</div>
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
                            Press Enter or click Submit to grade
                          </span>
                          <button 
                            className="btn btn-primary"
                            style={{ padding: '0.5rem 1rem' }}
                            disabled={!storyTranslationInput.trim() || gradingLoading}
                            onClick={handleStorySentenceSubmit}
                          >
                            {gradingLoading ? "Grading..." : "Submit"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Loading skeleton */}
                    {gradingLoading && (
                      <div className="card ai-loading-container">
                        <div className="ai-loading-spinner"></div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Processing translation grading review...
                        </span>
                      </div>
                    )}

                    {/* Feedback Card of the LAST evaluated item */}
                    {storyFeed.length > 0 && !gradingLoading && (
                      <div className="ai-feedback-card">
                        <div className="ai-feedback-header">
                          <span className="feedback-section-title">Teacher Feedback (Sentence {storyFeed[storyFeed.length - 1].index + 1})</span>
                          <div className="star-rating-container">
                            {[1, 2, 3, 4, 5].map((starVal) => (
                              <StarIcon 
                                key={starVal} 
                                className={`star-vector ${starVal <= storyFeed[storyFeed.length - 1].aiGrade.score ? 'filled' : ''}`} 
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--success-text)', textTransform: 'uppercase' }}>What was right:</div>
                          <div className="feedback-text-content">{storyFeed[storyFeed.length - 1].aiGrade.what_was_right}</div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--error-text)', textTransform: 'uppercase' }}>What was off:</div>
                          <div className="feedback-text-content">{storyFeed[storyFeed.length - 1].aiGrade.what_was_off}</div>
                        </div>

                        <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary-blue)' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase' }}>Suggested Translation:</div>
                          <div className="feedback-text-content" style={{ fontStyle: 'italic', color: '#1E40AF', marginTop: '0.125rem' }}>
                            "{storyFeed[storyFeed.length - 1].aiGrade.suggested_translation}"
                          </div>
                        </div>
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
                  <p className="card-subtitle">Review your translated sentence scores and detailed review feedback.</p>
                  
                  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', padding: '1rem 2rem', border: '1px solid var(--border-gray)', margin: '1.25rem 0' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Average Score</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.125rem' }}>
                      <span style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--dark-navy)', letterSpacing: '-0.02em' }}>{getAverageStoryScore()}</span>
                      <span style={{ display: 'inline-block', color: 'var(--warning-yellow)', fontSize: '1.25rem' }}>★</span>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-gray)', paddingTop: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--dark-navy)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.02em' }}>Full Review</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {storyFeed.map((item, idx) => {
                      const score = item.aiGrade.score;
                      let scoreTextClass = "custom-badge-red";
                      if (score >= 4) scoreTextClass = "custom-badge-green";
                      else if (score === 3) scoreTextClass = "custom-badge-yellow";

                      return (
                        <div 
                          key={idx}
                          style={{ border: '1px solid var(--border-gray)', borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: 'var(--white)' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.625rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--dark-navy)' }}>Sentence {idx + 1}</span>
                            <div className="d-flex gap-2 align-center">
                              <span className={`custom-badge ${scoreTextClass}`}>Score: {score}/5</span>
                              <div className="star-rating-container">
                                {[1, 2, 3, 4, 5].map((starVal) => (
                                  <StarIcon 
                                    key={starVal} 
                                    className={`star-vector ${starVal <= score ? 'filled' : ''}`} 
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="review-row" style={{ gridTemplateColumns: '1fr 1fr', padding: 0 }}>
                            <div>
                              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)' }}>SPANISH TEXT:</div>
                              <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--dark-navy)', marginTop: '0.125rem' }}>"{item.spanish}"</div>
                              
                              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)', marginTop: '0.625rem' }}>YOUR TRANSLATION:</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.125rem' }}>"{item.userTrans}"</div>
                            </div>
                            
                            <div style={{ borderLeft: '1px solid var(--border-gray)', paddingLeft: '1.25rem' }}>
                              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--success-text)' }}>What went right:</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.125rem', lineAngle: 1.4 }}>{item.aiGrade.what_was_right}</div>

                              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--error-text)', marginTop: '0.375rem' }}>What was off:</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.125rem', lineAngle: 1.4 }}>{item.aiGrade.what_was_off}</div>

                              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1E40AF', marginTop: '0.375rem' }}>Suggested:</div>
                              <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#1E40AF', marginTop: '0.125rem' }}>"{item.aiGrade.suggested_translation}"</div>
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
            TAB 4: SETTINGS PANEL
            ========================================== */}
        {activeTab === 'settings' && (
          <div className="settings-tab-container" style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div className="card">
              <h2 className="card-title">Settings</h2>
              <p className="card-subtitle">Configure your preferences and AI integration for Story Mode.</p>
              
              {/* Part 1: Gemini Config */}
              <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-gray)', paddingBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '0.875rem' }}>Gemini API Integration</h3>
                
                <div className="settings-group">
                  <span className="settings-label">Gemini API Key</span>
                  <input 
                    type="password"
                    className="settings-input"
                    placeholder="Enter your Gemini API key (e.g. AIzaSy...)"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', lineHeight: 1.4 }}>
                    Stays strictly in your local session React memory. If omitted, Story Mode automatically fallback translates Spanish sentences on the fly using Google Translate.
                  </span>
                </div>
              </div>

              {/* Class enrollment */}
              <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-gray)', paddingBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '0.875rem' }}>Class Enrollment</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  New accounts are enrolled in <strong>Spanish 200</strong> by default. You can leave the class or switch to another course below. Study decks and stories are shared only with your current class.
                </p>

                {profileLoading ? (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Loading profile…</span>
                ) : isInClass && activeClass ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-border)' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Current class</span>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark-navy)' }}>{activeClass.name}</div>
                      {activeClass.description && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: 0 }}>{activeClass.description}</p>
                      )}
                    </div>

                    {availableClasses.length > 1 && (
                      <div className="settings-group">
                        <span className="settings-label">Switch class</span>
                        <select
                          className="settings-input"
                          value={activeClassId}
                          disabled={classActionLoading}
                          onChange={(e) => joinClass(e.target.value)}
                        >
                          {availableClasses.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={classActionLoading}
                      onClick={leaveClass}
                    >
                      {classActionLoading ? 'Updating…' : 'Leave class'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      You are not enrolled in a class. Rejoin to access shared decks and stories.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={classActionLoading}
                      onClick={rejoinDefaultClass}
                    >
                      {classActionLoading ? 'Joining…' : `Rejoin ${availableClasses.find((c) => c.slug === DEFAULT_CLASS_SLUG)?.name || 'Spanish 200'}`}
                    </button>
                    {availableClasses.length > 1 && (
                      <div className="settings-group">
                        <span className="settings-label">Or join another class</span>
                        <select
                          className="settings-input"
                          defaultValue=""
                          disabled={classActionLoading}
                          onChange={(e) => {
                            if (e.target.value) joinClass(e.target.value);
                          }}
                        >
                          <option value="" disabled>Select a class…</option>
                          {availableClasses.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {isAdmin && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '1rem', marginBottom: 0 }}>
                    You are signed in as the content admin. Only this account can publish class decks and stories.
                  </p>
                )}
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: 'var(--white)', borderTop: '1px solid var(--border-gray)', padding: '2rem 1.5rem', textAlign: 'center', marginTop: '4rem' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 500 }}>
          Language Learner - Cloud Spanish Tutor. Built with Vite, React, Google APIs, and Supabase.
        </p>
      </footer>

      <AppDialog dialog={dialog} onClose={closeDialog} />
    </div>
  );
}
