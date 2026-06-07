import React from 'react';
import { FolderIcon, UploadIcon, SettingsIcon, StarIcon, CheckIcon, XIcon, ArrowRightIcon, ArrowLeftIcon, CloudIcon, CopyIcon } from './Icons';

export default function PracticeTab(props) {
  const {
    PRACTICE_SYNTAX_HELP, activeDeck, activePracticeSet, activePracticeSetId, answer, backToPracticeLibrary, body, contextRef, correct, ctx, currentPracticeContextBody, currentPracticeQuestion, handleAddPracticeContext, handleAddPracticeQuestion, handleClearPracticeSet, handleCreatePracticeSet, handleDeletePracticeContext, handleDeletePracticeQuestion, handleDeletePracticeSet, handleImportPracticeBulk, handlePracticeNext, handlePracticeSubmit, isAdmin, isInClass, key, openPracticeSet, practiceBank, practiceBulkText, practiceContextBody, practiceContextCount, practiceContextRef, practiceCursor, practiceDraftAnswer, practiceDraftContextRef, practiceDraftPrompt, practiceDraftType, practiceInput, practiceProgressPct, practiceQuestionCount, practiceQueue, practiceSessionActive, practiceSessionCorrect, practiceSessionEnded, practiceSets, practiceSubmitted, practiceWasCorrect, prompt, ref, resetPracticeSession, selectedPracticeSetIndex, setPracticeBulkText, setPracticeContextBody, setPracticeContextRef, setPracticeDraftAnswer, setPracticeDraftContextRef, setPracticeDraftPrompt, setPracticeDraftType, setPracticeInput, setSelectedPracticeSetIndex, sets, startPracticeFromDeck, startPracticeSession, title, type
  } = props;

  return (
    <div className="practice-tab-container">
            {practiceSessionEnded ? (
              <div className="card end-screen" style={{ maxWidth: '560px', margin: '0 auto' }}>
                <div style={{ display: 'inline-flex', width: '3rem', height: '3rem', backgroundColor: 'var(--success-light)', color: 'var(--success-green)', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <CheckIcon className="icon-svg" />
                </div>
                <h2 className="card-title">Practice Complete</h2>
                <p className="card-subtitle">
                  You answered {practiceSessionCorrect} of {practiceQueue.length} correctly.
                </p>
                <div className="button-group mt-4">
                  <button className="btn btn-secondary" onClick={backToPracticeLibrary}>
                    Back to Library
                  </button>
                  <button className="btn btn-primary" onClick={startPracticeSession}>
                    Practice Again
                  </button>
                </div>
              </div>
            ) : practiceSessionActive && currentPracticeQuestion ? (
              <div className="card" style={{ maxWidth: '620px', margin: '0 auto', minHeight: '360px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="custom-badge">
                      Question {practiceCursor + 1} of {practiceQueue.length}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>
                      Saved locally
                    </span>
                  </div>
                  <div className="progress-container">
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${practiceProgressPct}%` }}></div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, marginTop: '0.35rem' }}>
                    Session progress: {practiceProgressPct}%
                  </div>
                </div>

                <div style={{ margin: '1.25rem 0' }}>
                  {currentPracticeQuestion.type === 'context' && currentPracticeContextBody && (
                    <div
                      style={{
                        marginBottom: '1rem',
                        padding: '0.875rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--primary-border)',
                        backgroundColor: 'var(--primary-light)',
                        maxHeight: '180px',
                        overflowY: 'auto',
                      }}
                    >
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                        Shared context @{currentPracticeQuestion.contextRef}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                        {currentPracticeContextBody}
                      </div>
                    </div>
                  )}
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span className={`custom-badge ${currentPracticeQuestion.type === 'context' ? 'custom-badge-yellow' : ''}`} style={{ fontSize: '0.65rem' }}>
                      {currentPracticeQuestion.type === 'context' ? 'Context question' : 'Normal question'}
                    </span>
                  </div>
                  <h3 className="question-prompt" style={{ marginBottom: '1rem' }}>{currentPracticeQuestion.prompt}</h3>
                  <div className="input-container">
                    <input
                      type="text"
                      className="text-answer-input"
                      placeholder="Type your answer..."
                      disabled={practiceSubmitted}
                      value={practiceInput}
                      onChange={(e) => setPracticeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (!practiceSubmitted) handlePracticeSubmit();
                          else handlePracticeNext();
                        }
                      }}
                    />
                  </div>
                  {practiceSubmitted && (
                    <div className={`feedback-overlay ${practiceWasCorrect ? 'correct' : 'incorrect'}`} style={{ marginTop: '1rem' }}>
                      <div>
                        <div className="feedback-text-title">
                          {practiceWasCorrect ? 'Correct' : 'Not quite'}
                        </div>
                        <div className="feedback-text-desc">
                          Correct answer: <strong>{currentPracticeQuestion.answer}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="button-group" style={{ borderTop: '1px solid var(--border-gray)', paddingTop: '1.15rem' }}>
                  <button className="btn btn-secondary" onClick={() => { resetPracticeSession(); }}>
                    Exit
                  </button>
                  {!practiceSubmitted ? (
                    <button
                      className="btn btn-primary"
                      disabled={!practiceInput.trim()}
                      onClick={handlePracticeSubmit}
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={handlePracticeNext}>
                      {practiceCursor + 1 >= practiceQueue.length ? 'Finish' : 'Next Question'}
                    </button>
                  )}
                </div>
              </div>
            ) : !activePracticeSetId ? (
              <div className="card" style={{ maxWidth: '750px', margin: '0 auto' }}>
                <h2 className="card-title">Practice</h2>
                <p className="card-subtitle">
                  {isAdmin
                    ? 'Create separate practice sets for each test or unit—like decks and stories.'
                    : practiceSets.length > 0
                      ? 'Choose a practice set to begin.'
                      : null}
                </p>

                {!isInClass && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Join a class in Settings to access practice sets.
                  </p>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    className="btn btn-primary w-full"
                    style={{ marginBottom: '1.25rem' }}
                    disabled={!isInClass}
                    onClick={handleCreatePracticeSet}
                  >
                    New Practice Set
                  </button>
                )}

                {practiceSets.length === 0 ? (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      {isAdmin
                        ? 'No practice sets yet. Create one for each test or topic.'
                        : 'No practice questions available yet.'}
                    </p>
                    {activeDeck?.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-primary w-full"
                        style={{ marginTop: '0.5rem' }}
                        onClick={startPracticeFromDeck}
                      >
                        Practice Loaded Deck
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="story-list">
                    {practiceSets.map((set, i) => (
                      <div
                        key={set.id}
                        className={`story-select-card ${selectedPracticeSetIndex === i ? 'active' : ''}`}
                        onClick={() => setSelectedPracticeSetIndex(i)}
                      >
                        <h4 className="story-select-title">{set.title}</h4>
                        {set.description && (
                          <p className="story-select-desc">{set.description}</p>
                        )}
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-blue)', display: 'block', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                          {set.questions.length} Questions · {set.contexts.length} Contexts
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {practiceSets.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary w-full"
                    style={{ marginTop: '1rem' }}
                    disabled={!isInClass || practiceSets.length === 0}
                    onClick={() => openPracticeSet(practiceSets[selectedPracticeSetIndex].id, selectedPracticeSetIndex)}
                  >
                    Open Practice Set
                  </button>
                )}
              </div>
            ) : (
              <div className="card" style={{ maxWidth: '760px', margin: '0 auto' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', marginBottom: '1rem' }}
                  onClick={backToPracticeLibrary}
                >
                  ← Back to Library
                </button>

                <h2 className="card-title">{activePracticeSet?.title}</h2>
                {activePracticeSet?.description && (
                  <p className="card-subtitle">{activePracticeSet.description}</p>
                )}

                {isAdmin && (
                <>
                <details style={{ marginBottom: '1.25rem', border: '1px solid var(--border-gray)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', backgroundColor: 'var(--light-gray)' }}>
                  <summary style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--dark-navy)', cursor: 'pointer' }}>
                    Syntax guide (click to expand)
                  </summary>
                  <pre style={{ marginTop: '0.75rem', fontSize: '0.72rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace' }}>
                    {PRACTICE_SYNTAX_HELP}
                  </pre>
                </details>

                <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-gray)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '0.75rem' }}>Shared contexts</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div className="settings-group" style={{ marginBottom: 0 }}>
                      <span className="settings-label">Context id</span>
                      <input
                        type="text"
                        className="settings-input"
                        placeholder="exam1"
                        value={practiceContextRef}
                        onChange={(e) => setPracticeContextRef(e.target.value)}
                      />
                    </div>
                    <div className="settings-group" style={{ marginBottom: 0 }}>
                      <span className="settings-label">Passage / scenario text</span>
                      <textarea
                        className="settings-input"
                        rows={3}
                        placeholder="Paste the reading, dialogue, or test scenario once..."
                        value={practiceContextBody}
                        onChange={(e) => setPracticeContextBody(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={!practiceContextRef.trim() || !practiceContextBody.trim()}
                    onClick={handleAddPracticeContext}
                  >
                    Save context block
                  </button>
                  {practiceBank.contexts.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.875rem' }}>
                      {practiceBank.contexts.map((ctx) => (
                        <div key={ctx.id} style={{ border: '1px solid var(--primary-border)', borderRadius: 'var(--radius-sm)', padding: '0.625rem', backgroundColor: 'var(--primary-light)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1E40AF' }}>@{ctx.ref}</span>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.45rem', fontSize: '0.65rem' }} onClick={() => handleDeletePracticeContext(ctx.ref)}>
                              Delete
                            </button>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', whiteSpace: 'pre-wrap', maxHeight: '4rem', overflow: 'hidden' }}>
                            {ctx.body}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '0.75rem' }}>Add question</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <button
                      type="button"
                      className={`btn ${practiceDraftType === 'normal' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      onClick={() => setPracticeDraftType('normal')}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      className={`btn ${practiceDraftType === 'context' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      onClick={() => setPracticeDraftType('context')}
                    >
                      Context
                    </button>
                  </div>

                  {practiceDraftType === 'context' && (
                    <div className="settings-group">
                      <span className="settings-label">Use context</span>
                      <select
                        className="settings-input"
                        value={practiceDraftContextRef}
                        onChange={(e) => setPracticeDraftContextRef(e.target.value)}
                      >
                        <option value="">Select context…</option>
                        {practiceBank.contexts.map((ctx) => (
                          <option key={ctx.id} value={ctx.ref}>@{ctx.ref}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <div className="settings-group" style={{ marginBottom: 0 }}>
                      <span className="settings-label">{practiceDraftType === 'context' ? 'Sub-question only' : 'Question'}</span>
                      <input
                        type="text"
                        className="settings-input"
                        placeholder={practiceDraftType === 'context' ? 'e.g. Where does Maria go?' : 'e.g. Conjugate estar (yo)'}
                        value={practiceDraftPrompt}
                        onChange={(e) => setPracticeDraftPrompt(e.target.value)}
                      />
                    </div>
                    <div className="settings-group" style={{ marginBottom: 0 }}>
                      <span className="settings-label">Answer</span>
                      <input
                        type="text"
                        className="settings-input"
                        placeholder="e.g. al mercado"
                        value={practiceDraftAnswer}
                        onChange={(e) => setPracticeDraftAnswer(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddPracticeQuestion();
                        }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: '0.75rem' }}
                    disabled={!practiceDraftPrompt.trim() || !practiceDraftAnswer.trim()}
                    onClick={handleAddPracticeQuestion}
                  >
                    Add {practiceDraftType === 'context' ? 'context' : 'normal'} question
                  </button>
                </div>

                <div className="settings-group">
                  <span className="settings-label">Bulk import (syntax)</span>
                  <textarea
                    className="settings-input"
                    rows={6}
                    placeholder={PRACTICE_SYNTAX_HELP}
                    value={practiceBulkText}
                    onChange={(e) => setPracticeBulkText(e.target.value)}
                    style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginBottom: '1.5rem' }}
                  disabled={!practiceBulkText.trim()}
                  onClick={handleImportPracticeBulk}
                >
                  Import with syntax
                </button>
                </>
                )}

                <div style={{ borderTop: isAdmin ? undefined : 'none', paddingTop: '1.25rem', ...(isAdmin ? {} : { marginTop: 0 }) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--dark-navy)', margin: 0 }}>
                      Questions ({practiceQuestionCount}) · Contexts ({practiceContextCount})
                    </h3>
                    <div className="d-flex gap-2">
                      {isAdmin && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => handleDeletePracticeSet(activePracticeSetId)}
                        >
                          Delete Set
                        </button>
                      )}
                      {isAdmin && practiceQuestionCount > 0 && (
                        <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={handleClearPracticeSet}>
                          Clear Set
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        disabled={practiceQuestionCount === 0}
                        onClick={startPracticeSession}
                      >
                        Start Practice
                      </button>
                    </div>
                  </div>

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
  );
}
