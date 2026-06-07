import { useState, useReducer, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import AppDialog from './components/AppDialog.jsx';

// Auto-initialize Supabase from Vite env vars (VITE_ prefix exposes them to the browser build)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isValidSupabaseUrl = (url) => {
  try { return url && new URL(url).protocol.startsWith('http'); }
  catch { return false; }
};
const supabaseAutoClient = isValidSupabaseUrl(SUPABASE_URL) && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'undefined'
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

const studyProgressStorageKey = (userId) => `languagelearner_study_progress_${userId}`;

const darkModeStorageKey = 'languagelearner_dark_mode';

const makePracticeId = () => `pq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const emptyPracticeBank = () => ({ contexts: [], questions: [] });

const emptyPracticeSetsRoot = () => ({ sets: [] });

const PRACTICE_SYNTAX_HELP = `# Comments start with #
# Shared context (multi-line until blank line or next directive)
@context exam1
Read the passage once. Maria va al mercado cada sábado.

# Normal question (standalone)
Q: Translate "hola" | hello

# Context question (reuses @exam1 — passage shown automatically)
@exam1 Q: Where does Maria go? | al mercado

# Legacy one-liners still work:
¿Cómo se dice "book"? | el libro`;

const normalizePracticeBank = (raw) => {
  if (!raw) return emptyPracticeBank();
  if (Array.isArray(raw)) {
    return {
      contexts: [],
      questions: raw.map((q) => ({
        id: q.id || makePracticeId(),
        type: q.type === 'context' ? 'context' : 'normal',
        prompt: q.prompt || '',
        answer: q.answer || '',
        contextRef: q.contextRef || undefined,
      })),
    };
  }
  return {
    contexts: Array.isArray(raw.contexts) ? raw.contexts : [],
    questions: Array.isArray(raw.questions) ? raw.questions : [],
  };
};

const normalizePracticeSet = (set) => {
  const bank = normalizePracticeBank(set);
  return {
    id: set?.id || makePracticeId(),
    title: set?.title?.trim() || 'Untitled Practice',
    description: set?.description?.trim() || '',
    contexts: bank.contexts,
    questions: bank.questions,
    updatedAt: set?.updatedAt || new Date().toISOString(),
  };
};

const normalizePracticeSetsRoot = (raw) => {
  if (!raw) return emptyPracticeSetsRoot();
  if (Array.isArray(raw)) {
    return { sets: raw.map((item) => normalizePracticeSet(item)) };
  }
  if (Array.isArray(raw.sets)) {
    return { sets: raw.sets.map((item) => normalizePracticeSet(item)) };
  }
  if (raw.contexts || raw.questions) {
    const legacy = normalizePracticeBank(raw);
    if (legacy.contexts.length === 0 && legacy.questions.length === 0) {
      return emptyPracticeSetsRoot();
    }
    return {
      sets: [
        normalizePracticeSet({
          id: makePracticeId(),
          title: 'Practice Set 1',
          description: '',
          ...legacy,
        }),
      ],
    };
  }
  return emptyPracticeSetsRoot();
};

const parsePromptAnswerLine = (line) => {
  let prompt = '';
  let answer = '';
  if (line.includes('|')) {
    const idx = line.indexOf('|');
    prompt = line.slice(0, idx).trim();
    answer = line.slice(idx + 1).trim();
  } else if (line.includes('\t')) {
    const idx = line.indexOf('\t');
    prompt = line.slice(0, idx).trim();
    answer = line.slice(idx + 1).trim();
  } else {
    return null;
  }
  if (!prompt || !answer) return null;
  return { prompt, answer };
};

const parsePracticeSyntax = (text) => {
  const result = emptyPracticeBank();
  const contextByRef = new Map();
  const lines = String(text || '').split('\n');
  let i = 0;

  const upsertContext = (ref, body) => {
    const trimmedBody = body.trim();
    if (!ref || !trimmedBody) return;
    const existing = contextByRef.get(ref);
    if (existing) {
      existing.body = trimmedBody;
      return;
    }
    const ctx = { id: makePracticeId(), ref, body: trimmedBody };
    contextByRef.set(ref, ctx);
    result.contexts.push(ctx);
  };

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    i += 1;
    if (!line || line.startsWith('#')) continue;

    const contextMatch = line.match(/^@context\s+([a-zA-Z0-9_-]+)\s*$/i);
    if (contextMatch) {
      const ref = contextMatch[1];
      const bodyLines = [];
      while (i < lines.length) {
        const nextRaw = lines[i];
        const next = nextRaw.trim();
        if (!next) {
          i += 1;
          break;
        }
        if (/^@context\s+/i.test(next) || /^@?[a-zA-Z0-9_-]+\s+Q:/i.test(next) || /^Q:/i.test(next)) {
          break;
        }
        bodyLines.push(nextRaw);
        i += 1;
      }
      upsertContext(ref, bodyLines.join('\n'));
      continue;
    }

    let contextRef = null;
    let questionLine = line;
    const contextQuestionMatch = line.match(/^@([a-zA-Z0-9_-]+)\s+(.+)$/i);
    if (contextQuestionMatch) {
      contextRef = contextQuestionMatch[1];
      questionLine = contextQuestionMatch[2].trim();
    }

    if (/^Q:/i.test(questionLine)) {
      questionLine = questionLine.replace(/^Q:\s*/i, '').trim();
    }

    const parsed = parsePromptAnswerLine(questionLine);
    if (!parsed) continue;

    result.questions.push({
      id: makePracticeId(),
      type: contextRef ? 'context' : 'normal',
      prompt: parsed.prompt,
      answer: parsed.answer,
      ...(contextRef ? { contextRef } : {}),
    });
  }

  return result;
};

const getPracticeContextBody = (bank, contextRef) => {
  if (!contextRef) return '';
  return bank.contexts.find((c) => c.ref === contextRef)?.body || '';
};

const mergePracticeBanks = (base, incoming) => {
  const merged = {
    contexts: [...base.contexts],
    questions: [...base.questions],
  };
  const refIndex = new Map(merged.contexts.map((c) => [c.ref, c]));
  for (const ctx of incoming.contexts) {
    const existing = refIndex.get(ctx.ref);
    if (existing) {
      existing.body = ctx.body;
    } else {
      merged.contexts.push(ctx);
      refIndex.set(ctx.ref, ctx);
    }
  }
  merged.questions.push(...incoming.questions);
  return merged;
};

const matchingCardKey = (card) => `${card.id}|${card.side}`;



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

const levenshteinDistance = (a, b) => {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
};

const getAnswerVariants = (definition) => {
  const raw = String(definition || "");
  // Allow simple multi-answer definitions like: "to look / watch; see"
  return raw
    .split(/[\/;|]| or /i)
    .map((s) => cleanText(s))
    .filter(Boolean);
};

const isSmartMatch = (userAnswerRaw, targetDefinitionRaw) => {
  const user = cleanText(userAnswerRaw);
  if (!user) return false;

  const variants = getAnswerVariants(targetDefinitionRaw);
  if (variants.length === 0) return false;

  return variants.some((target) => {
    if (!target) return false;
    if (user === target) return true;

    // Similarity by edit distance
    const dist = levenshteinDistance(user, target);
    const maxLen = Math.max(user.length, target.length);
    const similarity = maxLen === 0 ? 1 : 1 - dist / maxLen;

    // Tight threshold for short answers; slightly looser for longer
    const allowedDist =
      maxLen <= 4 ? 0 :
      maxLen <= 7 ? 1 :
      maxLen <= 11 ? 2 : 3;

    return dist <= allowedDist || similarity >= 0.86;
  });
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
      const { deck, types, knownIds = [], learningIds = [], familiarIds = [] } = action.payload;
      if (!deck || deck.length === 0) return state;

      const activeTypes = Object.keys(types).filter(k => types[k]);
      const statusPriority = (cardId) => {
        if (learningIds.includes(cardId)) return 0;
        if (familiarIds.includes(cardId)) return 1;
        if (knownIds.includes(cardId)) return 3;
        return 2;
      };

      const queue = deck
        .map(card => ({
          card,
          type: activeTypes[Math.floor(Math.random() * activeTypes.length)],
          attempts: 0
        }))
        .sort((a, b) => {
          const priority = statusPriority(a.card.id) - statusPriority(b.card.id);
          return priority !== 0 ? priority : Math.random() - 0.5;
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
import FlashcardsTab from './components/FlashcardsTab';
import LearnTab from './components/LearnTab';
import PracticeTab from './components/PracticeTab';
import StoryTab from './components/StoryTab';
import SettingsTab from './components/SettingsTab';

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
  const [authInitialized, setAuthInitialized] = useState(false);
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    try {
      localStorage.setItem(darkModeStorageKey, darkMode ? 'true' : 'false');
    } catch {
      // ignore storage errors
    }
  }, [darkMode]);

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
          setAuthInitialized(true);
        }
      } catch (err) {
        console.error("Failed to load auth session:", err);
        if (mounted) setAuthInitialized(true);
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
  const [familiarCardIds, setFamiliarCardIds] = useState(new Set());
  const [activeCloudDeckId, setActiveCloudDeckId] = useState(null);
  const progressSaveTimerRef = useRef(null);
  const storyProgressSaveTimerRef = useRef(null);

  const getDeckProgressKey = () => {
    if (activeCloudDeckId) return activeCloudDeckId;
    if (customDeck.length > 0) return `local:${currentDeckName}`;
    return null;
  };

  const readStudyProgressRoot = () => {
    const fromProfile = userProfile?.study_progress;
    if (fromProfile && typeof fromProfile === 'object') {
      return { decks: {}, stories: {}, ...fromProfile };
    }
    if (!session) return { decks: {}, stories: {} };
    try {
      const raw = localStorage.getItem(studyProgressStorageKey(session.user.id));
      return raw ? { decks: {}, stories: {}, ...JSON.parse(raw) } : { decks: {}, stories: {} };
    } catch {
      return { decks: {}, stories: {} };
    }
  };

  const persistStudyProgressRoot = async (root) => {
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

  const applyDeckProgress = (deckKey, deckLength) => {
    const entry = readStudyProgressRoot().decks?.[deckKey];
    if (!entry) {
      setKnownCardIds(new Set());
      setLearningCardIds(new Set());
      setFamiliarCardIds(new Set());
      setFlashcardIndex(0);
      return;
    }
    setKnownCardIds(new Set(entry.knownIds || []));
    setLearningCardIds(new Set(entry.learningIds || []));
    setFamiliarCardIds(new Set(entry.familiarIds || []));
    const idx = entry.flashcardIndex ?? 0;
    setFlashcardIndex(deckLength > 0 ? Math.min(idx, deckLength - 1) : 0);
  };

  const saveProgressForDeck = async (deckKey, deckLength) => {
    if (!session || !deckKey || deckLength === 0) return;
    const root = readStudyProgressRoot();
    root.decks = root.decks || {};
    root.decks[deckKey] = {
      knownIds: [...knownCardIds],
      learningIds: [...learningCardIds],
      familiarIds: [...familiarCardIds],
      flashcardIndex: Math.min(flashcardIndex, Math.max(deckLength - 1, 0)),
      updatedAt: new Date().toISOString(),
    };
    root.lastDeckId = deckKey;
    await persistStudyProgressRoot(root);
  };

  const getStoryProgressKey = (storyObj = activeStory) => {
    if (!storyObj) return null;
    if (storyObj.id) return `story:${storyObj.id}`;
    const title = (storyObj.title || 'custom').toLowerCase().trim();
    const firstSentence = (storyObj.sentences?.[0]?.text || '').slice(0, 40).toLowerCase();
    return `story:local:${title}:${storyObj.sentences?.length || 0}:${firstSentence}`;
  };

  const applyStoryProgress = (storyKey, sentenceCount) => {
    const entry = readStudyProgressRoot().stories?.[storyKey];
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
    const root = readStudyProgressRoot();
    root.stories = root.stories || {};
    root.stories[storyKey] = {
      currentSentenceIndex: Math.min(currentSentenceIndex, Math.max(sentenceCount - 1, 0)),
      storyFeed,
      showStoryEnd,
      updatedAt: new Date().toISOString(),
    };
    root.lastStoryId = storyKey;
    await persistStudyProgressRoot(root);
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
    familiarCardIds,
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

  const getLearnStatusForCard = (cardId) => {
    if (knownCardIds.has(cardId)) return 'mastered';
    if (learningCardIds.has(cardId)) return 'learning';
    if (familiarCardIds.has(cardId)) return 'familiar';
    return 'new';
  };

  const updateLearnCardStatus = (cardId, isCorrect) => {
    if (!cardId) return;
    const newKnown = new Set(knownCardIds);
    const newLearning = new Set(learningCardIds);
    const newFamiliar = new Set(familiarCardIds);

    if (isCorrect) {
      if (newLearning.has(cardId) || newFamiliar.has(cardId)) {
        newLearning.delete(cardId);
        newFamiliar.delete(cardId);
        newKnown.add(cardId);
      } else if (!newKnown.has(cardId)) {
        newFamiliar.add(cardId);
      }
    } else {
      if (newKnown.has(cardId)) {
        newKnown.delete(cardId);
        newLearning.add(cardId);
      } else if (newFamiliar.has(cardId)) {
        newFamiliar.delete(cardId);
        newLearning.add(cardId);
      } else {
        newLearning.add(cardId);
      }
    }

    setKnownCardIds(newKnown);
    setLearningCardIds(newLearning);
    setFamiliarCardIds(newFamiliar);
  };

  const clearDeckProgress = async () => {
    setKnownCardIds(new Set());
    setLearningCardIds(new Set());
    setFamiliarCardIds(new Set());
    setFlashcardIndex(0);

    const deckKey = getDeckProgressKey();
    if (!deckKey) return;
    const root = readStudyProgressRoot();
    if (root.decks) {
      delete root.decks[deckKey];
    }
    await persistStudyProgressRoot(root);
    showBanner('Deck progress reset.', 'success');
  };

  const handleTagKnown = () => {
    if (!currentFlashcard) return;
    const newKnown = new Set(knownCardIds);
    newKnown.add(currentFlashcard.id);
    setKnownCardIds(newKnown);

    const newLearn = new Set(learningCardIds);
    newLearn.delete(currentFlashcard.id);
    setLearningCardIds(newLearn);

    const newFamiliar = new Set(familiarCardIds);
    newFamiliar.delete(currentFlashcard.id);
    setFamiliarCardIds(newFamiliar);
    advanceCard();
  };

  const handleTagLearning = () => {
    if (!currentFlashcard) return;
    const newLearn = new Set(learningCardIds);
    newLearn.add(currentFlashcard.id);
    setLearningCardIds(newLearn);

    const newKnown = new Set(knownCardIds);
    newKnown.delete(currentFlashcard.id);
    setKnownCardIds(newKnown);

    const newFamiliar = new Set(familiarCardIds);
    newFamiliar.delete(currentFlashcard.id);
    setFamiliarCardIds(newFamiliar);
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

  }, [learnState.currentQuestion, activeDeck]);

  const handleMcqSelect = (option) => {
    if (learnState.isAnswerSubmitted) return;
    const currentCardId = learnState.currentQuestion?.card?.id;
    dispatchLearn({ type: 'SET_SELECTED_OPTION', payload: option });
    
    const correct = option === learnState.currentQuestion.card.definition;
    dispatchLearn({ type: 'SUBMIT_ANSWER', payload: { isCorrect: correct } });
    updateLearnCardStatus(currentCardId, correct);
  };

  const handleTfSelect = (userClickedTrue) => {
    if (learnState.isAnswerSubmitted) return;
    const currentCardId = learnState.currentQuestion?.card?.id;
    dispatchLearn({ type: 'SET_SELECTED_OPTION', payload: userClickedTrue });

    const displayedTranslation = mcOptions[0];
    const isActuallyCorrect = displayedTranslation === learnState.currentQuestion.card.definition;
    const isCorrectGrade = (userClickedTrue && isActuallyCorrect) || (!userClickedTrue && !isActuallyCorrect);

    dispatchLearn({ type: 'SUBMIT_ANSWER', payload: { isCorrect: isCorrectGrade } });
    updateLearnCardStatus(currentCardId, isCorrectGrade);
  };

  const handleTypeSubmit = () => {
    if (learnState.isAnswerSubmitted) return;
    const currentCardId = learnState.currentQuestion?.card?.id;
    const isCorrect = isSmartMatch(
      learnState.userAnswer,
      learnState.currentQuestion.card.definition
    );
    dispatchLearn({ type: 'SUBMIT_ANSWER', payload: { isCorrect } });
    updateLearnCardStatus(currentCardId, isCorrect);
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
          const isCorrectAnswer = !hadMismatches;
          dispatchLearn({ type: 'SUBMIT_ANSWER', payload: { isCorrect: isCorrectAnswer } });
          updateLearnCardStatus(learnState.currentQuestion?.card?.id, isCorrectAnswer);
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

  useEffect(() => {
    const handleGlobalKeys = (e) => {
      const activeElement = document.activeElement?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement)) return;

      if (activeTab === 'flashcards') {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          advanceCard();
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          prevCard();
        }
        if (e.key === 'k' || e.key === 'K') {
          e.preventDefault();
          handleTagKnown();
        }
        if (e.key === 'l' || e.key === 'L') {
          e.preventDefault();
          handleTagLearning();
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          setIsCardFlipped((prev) => !prev);
        }
      }

      if (activeTab === 'learn' && learnState.isAnswerSubmitted && e.key === 'Enter') {
        e.preventDefault();
        dispatchLearn({ type: 'NEXT_QUESTION' });
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [activeTab, learnState.isAnswerSubmitted, advanceCard, prevCard]);

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

    const resetPracticeState = () => {
      setPracticeSessionActive(false);
      setPracticeSessionEnded(false);
      setPracticeQueue([]);
      setPracticeCursor(0);
      setSessionPracticeBank(emptyPracticeBank());
    };

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
      const isMissingPracticeBankError = err?.code === '42703' || err?.code === 42703 || err?.message?.includes('practice_bank') || err?.status === 400;
      if (!isMissingPracticeBankError) {
        console.error('Fetch class practice sets:', err);
      }
      if (isMissingPracticeBankError) {
        try {
          const { data, error: fallbackError } = await supabaseClient
            .from('classes')
            .select('*')
            .eq('id', activeClassId)
            .single();
          if (!fallbackError && data) {
            const root = normalizePracticeSetsRoot(data.practice_bank ?? data.practiceBank);
            setPracticeSets(root.sets);
            if (activePracticeSetId && !root.sets.some((s) => s.id === activePracticeSetId)) {
              setActivePracticeSetId(null);
            }
            return;
          }
          if (fallbackError && !isMissingPracticeBankError) {
            console.error('Fallback fetch class practice sets:', fallbackError);
          }
        } catch (fallbackErr) {
          if (!isMissingPracticeBankError) {
            console.error('Fallback fetch class practice sets:', fallbackErr);
          }
        }
      }
      setPracticeSets([]);
      setActivePracticeSetId(null);
    } finally {
      resetPracticeState();
    }
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

  const startPracticeFromDeck = () => {
    if (!activeDeck || activeDeck.length === 0) return;
    const bank = {
      contexts: [],
      questions: activeDeck.map((card) => ({
        id: makePracticeId(),
        type: 'normal',
        prompt: `Translate "${card.term}"`,
        answer: card.definition,
      })),
    };
    setSessionPracticeBank(bank);
    setPracticeQueue(bank.questions);
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
      e.preventDefault();
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

  const clearStoryProgress = async () => {
    const storyKey = getStoryProgressKey();
    if (!storyKey) return;
    const root = readStudyProgressRoot();
    if (root.stories?.[storyKey]) {
      delete root.stories[storyKey];
      if (root.lastStoryId === storyKey) delete root.lastStoryId;
      await persistStudyProgressRoot(root);
    }
    setCurrentSentenceIndex(0);
    setStoryFeed([]);
    setStoryTranslationInput("");
    setShowStoryEnd(false);
    showBanner('Story progress reset.', 'success');
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

  // Show loading spinner while auth is initializing
  if (!authInitialized) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--light-gray)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid var(--border-gray)', borderTopColor: 'var(--primary-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Loading...</span>
        </div>
      </div>
    );
  }

  // Render Auth View if not logged in
  if (!session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--light-gray)' }}>
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

  // Define missing variables that are passed to tabs
  const answer = "";
  const body = "";
  const cards = [];
  const correct = false;
  const ctx = null;
  const current = null;
  const data = null;
  const feedItem = null;
  const idx = 0;
  const isCorrect = false;
  const isMatched = false;
  const isMismatched = false;
  const isSelected = false;
  const isTarget = false;
  const matched = [];
  const options = [];
  const payload = null;
  const prompt = "";
  const queue = [];
  const ref = null;
  const selected = null;
  const sentences = [];
  const tabs = [];
  const n = 0;
  const pasted = false;
  const title = "";
  const type = "";
  const contextRef = "";
  const user = session?.user || null;

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
          <FlashcardsTab
            activeDeck={activeDeck} advanceCard={advanceCard} answer={answer} cards={cards} clearCsvImport={clearCsvImport} cloudDecks={cloudDecks} cloudLoading={cloudLoading} confirmImportDeck={confirmImportDeck} csvFileName={csvFileName} csvPasteText={csvPasteText} csvPreviewCards={csvPreviewCards} current={current} currentFlashcard={currentFlashcard} data={data} dbConnected={dbConnected} fetchCloudDecks={fetchCloudDecks} fileInputRef={fileInputRef} flashcardIndex={flashcardIndex} handleCsvFile={handleCsvFile} handleCsvPasteArea={handleCsvPasteArea} handleDragLeave={handleDragLeave} handleDragOver={handleDragOver} handleDrop={handleDrop} handleParseCsvPaste={handleParseCsvPaste} handleSelectCloudDeck={handleSelectCloudDeck} handleTagKnown={handleTagKnown} handleTagLearning={handleTagLearning} isAdmin={isAdmin} isCardFlipped={isCardFlipped} isDraggingCsv={isDraggingCsv} isInClass={isInClass} knownCardIds={knownCardIds} learningCardIds={learningCardIds} n={n} pasted={pasted} prevCard={prevCard} queue={queue} ref={ref} session={session} setCsvPasteText={setCsvPasteText} setIsCardFlipped={setIsCardFlipped} title={title} type={type}
            clearDeckProgress={clearDeckProgress}
          />
        )}

        {/* ==========================================
            TAB 2: LEARN MODE
            ========================================== */}
        {activeTab === 'learn' && (
          <LearnTab
            activeDeck={activeDeck} answer={answer} cards={cards} correct={correct} dispatchLearn={dispatchLearn} formatTime={formatTime} handleMatchingCardClick={handleMatchingCardClick} handleMcqSelect={handleMcqSelect} handleTfSelect={handleTfSelect} handleTypeSubmit={handleTypeSubmit} isCorrect={isCorrect} isInClass={isInClass} isMatched={isMatched} isMismatched={isMismatched} isSelected={isSelected} isTarget={isTarget} learnState={learnState} matched={matched} matchingBoard={matchingBoard} matchingCardKey={matchingCardKey} mcOptions={mcOptions} options={options} payload={payload} prompt={prompt} selected={selected} session={session} title={title} type={type} knownCardIds={knownCardIds} learningCardIds={learningCardIds} familiarCardIds={familiarCardIds}
          />
        )}

        {/* ==========================================
            TAB 3: PRACTICE MODE (past test questions)
            ========================================== */}
        {activeTab === 'practice' && (
          <PracticeTab
            PRACTICE_SYNTAX_HELP={PRACTICE_SYNTAX_HELP} activeDeck={activeDeck} activePracticeSet={activePracticeSet} activePracticeSetId={activePracticeSetId} answer={answer} backToPracticeLibrary={backToPracticeLibrary} body={body} contextRef={contextRef} correct={correct} ctx={ctx} currentPracticeContextBody={currentPracticeContextBody} currentPracticeQuestion={currentPracticeQuestion} handleAddPracticeContext={handleAddPracticeContext} handleAddPracticeQuestion={handleAddPracticeQuestion} handleClearPracticeSet={handleClearPracticeSet} handleCreatePracticeSet={handleCreatePracticeSet} handleDeletePracticeContext={handleDeletePracticeContext} handleDeletePracticeQuestion={handleDeletePracticeQuestion} handleDeletePracticeSet={handleDeletePracticeSet} handleImportPracticeBulk={handleImportPracticeBulk} handlePracticeNext={handlePracticeNext} handlePracticeSubmit={handlePracticeSubmit} isAdmin={isAdmin} isInClass={isInClass} openPracticeSet={openPracticeSet} practiceBank={practiceBank} practiceBulkText={practiceBulkText} practiceContextBody={practiceContextBody} practiceContextCount={practiceContextCount} practiceContextRef={practiceContextRef} practiceCursor={practiceCursor} practiceDraftAnswer={practiceDraftAnswer} practiceDraftContextRef={practiceDraftContextRef} practiceDraftPrompt={practiceDraftPrompt} practiceDraftType={practiceDraftType} practiceInput={practiceInput} practiceProgressPct={practiceProgressPct} practiceQuestionCount={practiceQuestionCount} practiceQueue={practiceQueue} practiceSessionActive={practiceSessionActive} practiceSessionCorrect={practiceSessionCorrect} practiceSessionEnded={practiceSessionEnded} practiceSets={practiceSets} practiceSubmitted={practiceSubmitted} practiceWasCorrect={practiceWasCorrect} prompt={prompt} ref={ref} resetPracticeSession={resetPracticeSession} selectedPracticeSetIndex={selectedPracticeSetIndex} setPracticeBulkText={setPracticeBulkText} setPracticeContextBody={setPracticeContextBody} setPracticeContextRef={setPracticeContextRef} setPracticeDraftAnswer={setPracticeDraftAnswer} setPracticeDraftContextRef={setPracticeDraftContextRef} setPracticeDraftPrompt={setPracticeDraftPrompt} setPracticeDraftType={setPracticeDraftType} setPracticeInput={setPracticeInput} setSelectedPracticeSetIndex={setSelectedPracticeSetIndex} startPracticeFromDeck={startPracticeFromDeck} startPracticeSession={startPracticeSession} title={title} type={type}
          />
        )}

        {/* ==========================================
            TAB 4: STORY MODE
            ========================================== */}
        {activeTab === 'story' && (
          <StoryTab
            activeStory={activeStory} answer={answer} cloudStories={cloudStories} currentSentenceIndex={currentSentenceIndex} customStoryText={customStoryText} feedContainerRef={feedContainerRef} feedItem={feedItem} getStoryProgress={getStoryProgress} gradingLoading={gradingLoading} handlePublishGlobalStory={handlePublishGlobalStory} handleStoryKeyPress={handleStoryKeyPress} handleStorySentenceSubmit={handleStorySentenceSubmit} idx={idx} isAdmin={isAdmin} isInClass={isInClass} pasted={pasted} ref={ref} resetStoryMode={resetStoryMode} selectedStoryIndex={selectedStoryIndex} sentences={sentences} session={session} setCustomStoryText={setCustomStoryText} setSelectedStoryIndex={setSelectedStoryIndex} setStoryActiveTab={setStoryActiveTab} setStoryTranslationInput={setStoryTranslationInput} showStoryEnd={showStoryEnd} startCustomStory={startCustomStory} startPresetStory={startPresetStory} storyActiveTab={storyActiveTab} storyFeed={storyFeed} storyStarted={storyStarted} storyTranslationInput={storyTranslationInput} tabs={tabs} title={title} user={user}
            clearStoryProgress={clearStoryProgress}
          />
        )}

        {/* ==========================================
            TAB 5: SETTINGS PANEL
            ========================================== */}
        {activeTab === 'settings' && (
          <SettingsTab
            DEFAULT_CLASS_SLUG={DEFAULT_CLASS_SLUG} activeClass={activeClass} activeClassId={activeClassId} availableClasses={availableClasses} classActionLoading={classActionLoading} current={current} darkMode={darkMode} isAdmin={isAdmin} isInClass={isInClass} joinClass={joinClass} leaveClass={leaveClass} profileLoading={profileLoading} rejoinDefaultClass={rejoinDefaultClass} setDarkMode={setDarkMode} title={title} type={type}
          />
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
