import React from 'react';
import { FolderIcon, UploadIcon, SettingsIcon, StarIcon, CheckIcon, XIcon, ArrowRightIcon, ArrowLeftIcon, CloudIcon, CopyIcon } from './Icons';

export default function StoryTab(props) {
  const {
    activeStory, answer, cloudStories, completed, completedStyle, created, currentSentenceIndex, customStoryText, feedContainerRef, feedItem, getStoryProgress, gradingLoading, handlePublishGlobalStory, handleStoryKeyPress, handleStorySentenceSubmit, idx, isAdmin, isInClass, key, pasted, pct, ref, resetStoryMode, selectedStoryIndex, sentences, session, setCustomStoryText, setSelectedStoryIndex, setStoryActiveTab, setStoryTranslationInput, showStoryEnd, startCustomStory, startPresetStory, storyActiveTab, storyFeed, storyStarted, storyTranslationInput, tabs, title, total, user
  } = props;

  return (
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
  );
}
