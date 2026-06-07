import React from 'react';
import { FolderIcon, UploadIcon, SettingsIcon, StarIcon, CheckIcon, XIcon, ArrowRightIcon, ArrowLeftIcon, CloudIcon, CopyIcon } from './Icons';

export default function SettingsTab(props) {
  const {
    DEFAULT_CLASS_SLUG, activeClass, activeClassId, availableClasses, classActionLoading, current, darkMode, isAdmin, isInClass, joinClass, key, leaveClass, profileLoading, rejoinDefaultClass, setDarkMode, title, type
  } = props;

  return (
    <div className="settings-tab-container" style={{ maxWidth: '980px', margin: '0 auto' }}>
            <div className="card">
              <h2 className="card-title">Settings</h2>
              <p className="card-subtitle">Manage appearance and class enrollment.</p>
              
              <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-gray)', paddingBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '0.875rem' }}>Appearance</h3>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--border-gray)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--light-gray)',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--dark-navy)' }}>Dark mode</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                      Use a darker theme across the app.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                    style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
                  />
                </label>
              </div>

              {/* Class enrollment */}
              <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-gray)', paddingBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '0.875rem' }}>Class Enrollment</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  New accounts are enrolled in <strong>Spanish 200</strong> by default. You can leave the class or switch to another course below. Study decks and stories are shared only with your current class.
                </p>

                {profileLoading ? (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Loading profile…</span>
                ) : isInClass && activeClass ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-border)' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Current class</span>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark-navy)' }}>{activeClass.name}</div>
                      {activeClass.description && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: 0 }}>{activeClass.description}</p>
                      )}
                    </div>

                    {availableClasses.length > 1 && (
                      <div className="settings-group">
                        <span className="settings-label">Switch class</span>
                        <select
                          className="settings-input"
                          value={activeClassId}
                          disabled={classActionLoading}
                          onChange={(e) => joinClass(e.target.value)}
                        >
                          {availableClasses.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={classActionLoading}
                      onClick={leaveClass}
                    >
                      {classActionLoading ? 'Updating…' : 'Leave class'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      You are not enrolled in a class. Rejoin to access shared decks and stories.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={classActionLoading}
                      onClick={rejoinDefaultClass}
                    >
                      {classActionLoading ? 'Joining…' : `Rejoin ${availableClasses.find((c) => c.slug === DEFAULT_CLASS_SLUG)?.name || 'Spanish 200'}`}
                    </button>
                    {availableClasses.length > 1 && (
                      <div className="settings-group">
                        <span className="settings-label">Or join another class</span>
                        <select
                          className="settings-input"
                          defaultValue=""
                          disabled={classActionLoading}
                          onChange={(e) => {
                            if (e.target.value) joinClass(e.target.value);
                          }}
                        >
                          <option value="" disabled>Select a class…</option>
                          {availableClasses.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {isAdmin && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '1rem', marginBottom: 0 }}>
                    You are signed in as the content admin. Only this account can publish class decks and stories.
                  </p>
                )}
              </div>

            </div>
          </div>
  );
}
