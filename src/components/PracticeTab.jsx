import React from 'react';
import { CheckIcon } from './Icons';

export default function PracticeTab(props) {
  const { practiceSessionActive, practiceSessionEnded, practiceQueue, practiceCursor, practiceInput, practiceSubmitted, practiceWasCorrect, practiceProgressPct, currentPracticeQuestion, currentPracticeContextBody, handlers, activePracticeSet, practiceSets, isAdmin } = props;

  if (practiceSessionEnded) {
    return (
      <div className="card end-screen" style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', width: '3rem', height: '3rem', marginBottom: '1.25rem' }}><CheckIcon className="icon-svg" /></div>
        <h2 className="card-title">Practice Complete</h2>
        <p className="card-subtitle">You finished the practice session.</p>
      </div>
    );
  }

  if (practiceSessionActive && currentPracticeQuestion) {
    return (
      <div className="card" style={{ maxWidth: '620px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="custom-badge">Question {practiceCursor + 1} of {practiceQueue.length}</span>
        </div>
        <div className="progress-container"><div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${practiceProgressPct}%` }} /></div></div>
        {currentPracticeQuestion.type === 'context' && currentPracticeContextBody && (
          <div style={{ marginBottom: '1rem', padding: '0.875rem 1rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700 }}>Shared context @{currentPracticeQuestion.contextRef}</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{currentPracticeContextBody}</div>
          </div>
        )}
        <h3 className="question-prompt">{currentPracticeQuestion.prompt}</h3>
        <div className="input-container"><input type="text" className="text-answer-input" value={practiceInput} onChange={(e) => handlers.setPracticeInput(e.target.value)} disabled={practiceSubmitted} onKeyDown={(e) => { if (e.key === 'Enter') { if (!practiceSubmitted) handlers.submit(); else handlers.next(); } }} /></div>
        {practiceSubmitted && <div className={`feedback-overlay ${practiceWasCorrect ? 'correct' : 'incorrect'}`}><div className="feedback-text-title">{practiceWasCorrect ? 'Correct' : 'Not quite'}</div><div className="feedback-text-desc">Correct answer: <strong>{currentPracticeQuestion.answer}</strong></div></div>}
        <div className="button-group" style={{ borderTop: '1px solid var(--border-gray)' }}>
          <button className="btn btn-secondary" onClick={handlers.exit}>Exit</button>
          {!practiceSubmitted ? <button className="btn btn-primary" onClick={handlers.submit} disabled={!practiceInput.trim()}>Check Answer</button> : <button className="btn btn-primary" onClick={handlers.next}>{practiceCursor + 1 >= practiceQueue.length ? 'Finish' : 'Next Question'}</button>}
        </div>
      </div>
    );
  }

  if (!activePracticeSet) {
    return (
      <div className="card" style={{ maxWidth: '750px', margin: '0 auto' }}>
        <h2 className="card-title">Practice</h2>
        <p className="card-subtitle">Choose a practice set to begin.</p>
        {isAdmin && <button className="btn btn-primary w-full" onClick={handlers.createSet}>New Practice Set</button>}
        {practiceSets.length === 0 ? <p>No practice sets yet.</p> : (<div className="story-list">{practiceSets.map((s, i) => (<div key={s.id} className={`story-select-card ${handlers.selectedPracticeSetIndex === i ? 'active' : ''}`} onClick={() => handlers.selectSet(s.id, i)}><h4>{s.title}</h4><span>{s.questions.length} Questions</span></div>))}</div>)}
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: '760px', margin: '0 auto' }}>
      <button className="btn btn-secondary" onClick={handlers.back}>← Back to Library</button>
      <h2 className="card-title">{activePracticeSet.title}</h2>
    </div>
  );
}
