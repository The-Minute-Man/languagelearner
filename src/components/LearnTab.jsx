import React from 'react';
import { FolderIcon, UploadIcon, SettingsIcon, StarIcon, CheckIcon, XIcon, ArrowRightIcon, ArrowLeftIcon, CloudIcon, CopyIcon } from './Icons';

export default function LearnTab(props) {
  const {
    activeDeck, answer, cards, correct, dispatchLearn, formatTime, handleMatchingCardClick, handleMcqSelect, handleTfSelect, handleTypeSubmit, isCorrect, isInClass, isMatched, isMismatched, isSelected, isTarget, key, learnState, matched, matchingBoard, matchingCardKey, mcOptions, options, payload, prompt, selected, session, title, type,
    knownCardIds, learningCardIds, familiarCardIds,
  } = props;

  const masteredCount = knownCardIds?.size || 0;
  const learningCount = learningCardIds?.size || 0;
  const familiarCount = familiarCardIds?.size || 0;
  const newCount = Math.max(0, activeDeck.length - masteredCount - learningCount - familiarCount);
  const currentCardStatus = learnState.currentQuestion
    ? knownCardIds.has(learnState.currentQuestion.card.id)
      ? 'Mastered'
      : learningCardIds.has(learnState.currentQuestion.card.id)
        ? 'Learning'
        : familiarCardIds.has(learnState.currentQuestion.card.id)
          ? 'Familiar'
          : 'New'
    : null;

  return (
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.75rem', padding: '0.85rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#475569' }}>New</div>
                    <strong style={{ fontSize: '1.2rem', display: 'block', marginTop: '0.35rem' }}>{newCount}</strong>
                  </div>
                  <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '0.75rem', padding: '0.85rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#92400E' }}>Familiar</div>
                    <strong style={{ fontSize: '1.2rem', display: 'block', marginTop: '0.35rem' }}>{familiarCount}</strong>
                  </div>
                  <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '0.75rem', padding: '0.85rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#9A3412' }}>Learning</div>
                    <strong style={{ fontSize: '1.2rem', display: 'block', marginTop: '0.35rem' }}>{learningCount}</strong>
                  </div>
                  <div style={{ backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: '0.75rem', padding: '0.85rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#14532D' }}>Mastered</div>
                    <strong style={{ fontSize: '1.2rem', display: 'block', marginTop: '0.35rem' }}>{masteredCount}</strong>
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
                      payload: { 
                        deck: activeDeck, 
                        types: learnState.questionTypes,
                        knownIds: [...knownCardIds],
                        learningIds: [...learningCardIds],
                        familiarIds: [...familiarCardIds]
                      } 
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span className="custom-badge">
                      Progress: {learnState.totalQuestionsCount - learnState.questionQueue.length} / {learnState.totalQuestionsCount}
                    </span>
                    <span className="custom-badge learn-status-badge">
                      Current: {currentCardStatus}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>
                      {session ? 'Progress auto-saves' : `Remaining: ${learnState.questionQueue.length}`}
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
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, marginTop: '0.35rem' }}>
                    Session completion: {learnState.totalQuestionsCount > 0 ? Math.round(((learnState.totalQuestionsCount - learnState.questionQueue.length) / learnState.totalQuestionsCount) * 100) : 0}%
                  </div>
                </div>

                <div style={{ margin: '1.25rem 0' }}>
                  
                  {/* MC Question Template */}
                  {learnState.currentQuestion.type === 'mc' && (
                    <div>
                      <h3 className="question-prompt">How do you translate: {learnState.currentQuestion.card.term}?</h3>
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
                      <div className="text-center" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark-navy)', marginBottom: '1.25rem' }}>
                        {learnState.currentQuestion.card.term}
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
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleTypeSubmit();
                            }
                          }}
                          autoFocus={learnState.currentQuestion.type === 'type'}
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
                            <div className="tf-spanish">{learnState.currentQuestion.card.term}</div>
                          <div className="tf-separator">means</div>
                            <div className="tf-english">{mcOptions[0]}</div>
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
                            const isMismatched = learnState.matchingMismatchedIds.includes(matchingCardKey(card));

                            if (isSelected && !isMismatched) className += " selected";
                            if (isMatched) className += " matched";
                            if (isMismatched) className += " mismatched";

                            return (
                              <div 
                                key={matchingCardKey(card)} 
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
                            const isMismatched = learnState.matchingMismatchedIds.includes(matchingCardKey(card));

                            if (isSelected && !isMismatched) className += " selected";
                            if (isMatched) className += " matched";
                            if (isMismatched) className += " mismatched";

                            return (
                              <div 
                                key={matchingCardKey(card)} 
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
  );
}
