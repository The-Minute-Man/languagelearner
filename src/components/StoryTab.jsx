import React from 'react';

export default function StoryTab(props) {
  const { storyStarted, storyActiveTab, isAdmin, cloudStories, selectedStoryIndex, customStoryText, handlers, activeStory, storyFeed, currentSentenceIndex, showStoryEnd, getStoryProgress } = props;

  if (!storyStarted) {
    return (
      <div className="card" style={{ maxWidth: '750px', margin: '0 auto' }}>
        <h2 className="card-title">Story Mode</h2>
        <div className="story-tabs">
          <button className={`story-tab-btn ${storyActiveTab === 'preset' ? 'active' : ''}`} onClick={() => handlers.setStoryActiveTab('preset')}>Library Stories</button>
          {isAdmin && <button className={`story-tab-btn ${storyActiveTab === 'custom' ? 'active' : ''}`} onClick={() => handlers.setStoryActiveTab('custom')}>Publish Story</button>}
        </div>
        {storyActiveTab === 'preset' ? (
          <div>
            <div className="story-list">{cloudStories.map((s, i) => (<div key={s.id} className={`story-select-card ${selectedStoryIndex === i ? 'active' : ''}`} onClick={() => handlers.setSelectedStoryIndex(i)}><h4>{s.title}</h4><p>{s.description}</p><span>{s.sentences.length} Sentences</span></div>))}</div>
            <button className="btn btn-primary w-full" onClick={() => handlers.startPresetStory(selectedStoryIndex)} disabled={!handlers.isInClass || cloudStories.length === 0}>Start Story Practice</button>
          </div>
        ) : (
          <div>
            <textarea className="text-answer-input" value={customStoryText} onChange={(e) => handlers.setCustomStoryText(e.target.value)} />
            <button className="btn btn-primary w-full" onClick={() => handlers.startCustomStory()} disabled={!customStoryText.trim()}>Process & Start (Preview)</button>
            {isAdmin && <button className="btn btn-primary w-full" onClick={() => handlers.publishStory()} disabled={!customStoryText.trim()} style={{ marginTop: '0.75rem' }}>Publish Class Story</button>}
          </div>
        )}
      </div>
    );
  }

  if (!showStoryEnd) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={() => handlers.resetStoryMode()}>Exit Story</button>
          <span className="custom-badge">{getStoryProgress().pct}% ({getStoryProgress().completed}/{getStoryProgress().total})</span>
        </div>
        <div className="story-split-container">
          <div className="story-left-panel">
            <h3 className="story-title-display">{activeStory.title}</h3>
            <div className="story-paragraph">{activeStory.sentences.map((s, idx) => (<span key={idx} className={`story-sentence ${idx === currentSentenceIndex ? 'active' : ''}`}>{s.text} </span>))}</div>
          </div>
          <div className="story-right-panel">
            <div className="completed-feed">{storyFeed.map((item, idx) => (<div key={idx} className="feed-item"><div>{item.spanish}</div><div>{item.userTrans}</div></div>))}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: '540px', margin: '0 auto' }}>
      <h2 className="card-title">Story Session Complete</h2>
      <p className="card-subtitle">Good work.</p>
    </div>
  );
}
