import React from 'react';
import { FolderIcon, UploadIcon, SettingsIcon, StarIcon, CheckIcon, XIcon, ArrowRightIcon, ArrowLeftIcon, CloudIcon, CopyIcon } from './Icons';

export default function FlashcardsTab(props) {
  const {
    activeDeck, advanceCard, answer, cards, clearCsvImport, cloudDecks, cloudLoading, confirmImportDeck, csvFileName, csvPasteText, csvPreviewCards, current, currentFlashcard, data, dbConnected, fetchCloudDecks, fileInputRef, flashcardIndex, handleCsvFile, handleCsvPasteArea, handleDragLeave, handleDragOver, handleDrop, handleParseCsvPaste, handleSelectCloudDeck, handleTagKnown, handleTagLearning, clearDeckProgress, isAdmin, isCardFlipped, isDraggingCsv, isInClass, key, knownCardIds, learningCardIds, n, pasted, prevCard, queue, ref, session, setCsvPasteText, setIsCardFlipped, title, type
  } = props;

  return (
    <div className="flashcards-tab-container">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: dbConnected && (isInClass || isAdmin) ? '1.4fr minmax(360px, 560px)' : '1fr',
                gap: '1.75rem',
                alignItems: 'start',
              }}
            >
              
              {/* Left Side: Active Flashcard Viewer */}
              {activeDeck.length > 0 ? (
                <div className="card text-center" style={{ minHeight: '520px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span className="custom-badge">
                        Card {flashcardIndex + 1} of {activeDeck.length}
                      </span>
                      <span className="custom-badge" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {session ? 'Progress auto-saves' : 'Sign in to save progress'}
                      </span>
                      <div className="d-flex gap-2" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                        {knownCardIds.has(currentFlashcard.id) && (
                          <span className="custom-badge custom-badge-green">Mastered</span>
                        )}
                        {learningCardIds.has(currentFlashcard.id) && (
                          <span className="custom-badge custom-badge-yellow">Learning</span>
                        )}
                      </div>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }} onClick={clearDeckProgress}>
                        Reset Deck Progress
                      </button>
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
                    <div className="button-group" style={{ borderTop: '1px solid var(--border-gray)', paddingTop: '1.15rem' }}>
                      <button className="btn btn-secondary" onClick={handleTagLearning}>
                        Still Learning
                      </button>
                      <button className="btn btn-success" onClick={handleTagKnown}>
                        Known
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
  );
}
