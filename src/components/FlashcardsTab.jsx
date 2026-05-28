import React, { useRef } from 'react';
import { FolderIcon, UploadIcon, ArrowLeftIcon, ArrowRightIcon } from './Icons';

export default function FlashcardsTab(props) {
  const fileInputRef = useRef(null);
  const {
    activeDeck, activeDeckLength, currentFlashcard, flashcardIndex, isCardFlipped,
    knownCardIds, learningCardIds, isAdmin, isInClass, dbConnected, cloudLoading, cloudDecks,
    csvPreviewCards, csvFileName, csvPasteText, isDraggingCsv,
    handlers,
  } = props;

  return (
    <div className="flashcards-tab-container">
      {/* Simplified view: keep main structure but rely on handlers passed in */}
      {activeDeckLength > 0 ? (
        <div className="card text-center" style={{ minHeight: '480px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="custom-badge">Card {flashcardIndex + 1} of {activeDeckLength}</span>
              <span className="custom-badge">{props.session ? 'Progress auto-saves' : 'Sign in to save progress'}</span>
              <div className="d-flex gap-2">
                {knownCardIds.has(currentFlashcard.id) && <span className="custom-badge custom-badge-green">Mastered</span>}
                {learningCardIds.has(currentFlashcard.id) && <span className="custom-badge custom-badge-yellow">Learning</span>}
              </div>
            </div>
            <div className="flashcard-viewport" onClick={() => handlers.toggleFlip()}>
              <div className="flashcard-inner">
                <div className="flashcard-face flashcard-front">
                  <span className="flashcard-label">Spanish</span>
                  <h2 className="flashcard-word">{currentFlashcard.term}</h2>
                </div>
                <div className="flashcard-face flashcard-back">
                  <span className="flashcard-label">English Translation</span>
                  <h2 className="flashcard-word">{currentFlashcard.definition}</h2>
                </div>
              </div>
            </div>
            <div className="button-group mb-4">
              <button className="btn btn-secondary" onClick={handlers.tagLearning}>Still Learning</button>
              <button className="btn btn-success" onClick={handlers.tagKnown}>Known</button>
            </div>
            <div className="button-group">
              <button className="btn btn-secondary" onClick={handlers.prevCard}><ArrowLeftIcon className="icon-svg-sm" /> Previous</button>
              <button className="btn btn-secondary" onClick={handlers.advanceCard}>Next <ArrowRightIcon className="icon-svg-sm" /></button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center" style={{ padding: '3.5rem' }}>
          <div style={{ display: 'inline-flex', width: '3.5rem', height: '3.5rem', marginBottom: '1.25rem' }}>
            <FolderIcon className="icon-svg" />
          </div>
          <h2 className="card-title">Load Study Cards</h2>
          <p className="card-subtitle">Load a deck or import a CSV.</p>
          {isAdmin && <div className="d-flex justify-between" style={{ maxWidth: '280px', margin: '0 auto' }}><button className="btn btn-primary" onClick={() => fileInputRef.current.click()}>Browse CSV File</button></div>}
        </div>
      )}
    </div>
  );
}
