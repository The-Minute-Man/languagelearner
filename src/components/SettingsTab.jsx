import React from 'react';

export default function SettingsTab(props) {
  const { darkMode, setDarkMode, availableClasses, userProfile, profileLoading, joinClass, leaveClass, rejoinDefaultClass } = props;

  return (
    <div className="card" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <h2 className="card-title">Settings</h2>
      <div className="settings-group">
        <label className="settings-label">Theme</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={`btn ${darkMode ? '' : 'btn-primary'}`} onClick={() => setDarkMode(false)}>Light</button>
          <button className={`btn ${darkMode ? 'btn-primary' : ''}`} onClick={() => setDarkMode(true)}>Dark</button>
        </div>
      </div>

      <div className="settings-group">
        <label className="settings-label">Class</label>
        <select className="settings-input" value={userProfile?.active_class_id || ''} onChange={(e) => joinClass(e.target.value)} disabled={profileLoading}>
          <option value="">Select class…</option>
          {availableClasses.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        <div style={{ marginTop: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => leaveClass()}>Leave Class</button>
          <button className="btn btn-primary" onClick={() => rejoinDefaultClass()}>Rejoin Default</button>
        </div>
      </div>
    </div>
  );
}
