// Learn mode state and reducer

export const initialLearnState = {
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

export function learnReducer(state, action) {
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
