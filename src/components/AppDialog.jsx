import { useEffect, useState } from 'react';

export default function AppDialog({ dialog, onClose }) {
  const [promptValue, setPromptValue] = useState('');
  const [formValues, setFormValues] = useState({});

  useEffect(() => {
    if (!dialog) return;
    if (dialog.type === 'prompt') {
      setPromptValue(dialog.defaultValue ?? '');
    }
    if (dialog.type === 'form') {
      setFormValues({ ...dialog.values });
    }
  }, [dialog]);

  if (!dialog) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose(null);
  };

  const variantClass =
    dialog.variant === 'error'
      ? 'app-dialog-card--error'
      : dialog.variant === 'success'
        ? 'app-dialog-card--success'
        : '';

  if (dialog.type === 'alert') {
    return (
      <div className="app-dialog-backdrop" onClick={handleBackdropClick} onKeyDown={handleKeyDown} role="presentation">
        <div className={`app-dialog-card ${variantClass}`} role="alertdialog" aria-labelledby="app-dialog-title" aria-modal="true">
          <h2 id="app-dialog-title" className="app-dialog-title">{dialog.title}</h2>
          {dialog.message && <p className="app-dialog-message">{dialog.message}</p>}
          <div className="app-dialog-actions">
            <button type="button" className="btn btn-primary" onClick={() => onClose(true)}>
              OK
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (dialog.type === 'prompt') {
    return (
      <div className="app-dialog-backdrop" onClick={handleBackdropClick} onKeyDown={handleKeyDown} role="presentation">
        <form
          className={`app-dialog-card ${variantClass}`}
          role="dialog"
          aria-labelledby="app-dialog-title"
          aria-modal="true"
          onSubmit={(e) => {
            e.preventDefault();
            onClose(promptValue.trim() || null);
          }}
        >
          <h2 id="app-dialog-title" className="app-dialog-title">{dialog.title}</h2>
          {dialog.message && <p className="app-dialog-message">{dialog.message}</p>}
          <input
            type="text"
            className="settings-input"
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            placeholder={dialog.placeholder || ''}
            autoFocus
          />
          <div className="app-dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={() => onClose(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!promptValue.trim()}>
              {dialog.submitLabel || 'Save'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (dialog.type === 'form') {
    return (
      <div className="app-dialog-backdrop" onClick={handleBackdropClick} onKeyDown={handleKeyDown} role="presentation">
        <form
          className={`app-dialog-card app-dialog-card--wide ${variantClass}`}
          role="dialog"
          aria-labelledby="app-dialog-title"
          aria-modal="true"
          onSubmit={(e) => {
            e.preventDefault();
            const result = {};
            let valid = true;
            for (const field of dialog.fields) {
              const val = String(formValues[field.id] ?? '').trim();
              if (field.required && !val) valid = false;
              result[field.id] = val;
            }
            if (!valid) return;
            onClose(result);
          }}
        >
          <h2 id="app-dialog-title" className="app-dialog-title">{dialog.title}</h2>
          {dialog.message && <p className="app-dialog-message">{dialog.message}</p>}
          <div className="app-dialog-fields">
            {dialog.fields.map((field) => (
              <div key={field.id} className="settings-group" style={{ marginBottom: '0.75rem' }}>
                <label className="settings-label" htmlFor={`dialog-field-${field.id}`}>
                  {field.label}
                </label>
                {field.multiline ? (
                  <textarea
                    id={`dialog-field-${field.id}`}
                    className="text-answer-input"
                    style={{ height: field.rows ? `${field.rows * 1.5}rem` : '5rem', resize: 'vertical' }}
                    value={formValues[field.id] ?? ''}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                    placeholder={field.placeholder || ''}
                    required={field.required}
                  />
                ) : (
                  <input
                    id={`dialog-field-${field.id}`}
                    type="text"
                    className="settings-input"
                    value={formValues[field.id] ?? ''}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                    placeholder={field.placeholder || ''}
                    required={field.required}
                    autoFocus={field.autoFocus}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="app-dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={() => onClose(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {dialog.submitLabel || 'Submit'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return null;
}
