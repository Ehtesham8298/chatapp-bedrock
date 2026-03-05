import { useState } from 'react';
import './SettingsModal.css';

const SHORTCUTS = [
  { keys: 'Enter', desc: 'Send message' },
  { keys: 'Shift + Enter', desc: 'New line' },
  { keys: 'Esc', desc: 'Close sidebar (mobile)' },
];

function SettingsModal({ isOpen, onClose, systemPrompt, onSavePrompt }) {
  const [tab, setTab] = useState('prompt');
  const [prompt, setPrompt] = useState(systemPrompt || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSavePrompt(prompt);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-tabs">
          <button className={`modal-tab ${tab === 'prompt' ? 'active' : ''}`} onClick={() => setTab('prompt')}>
            System Prompt
          </button>
          <button className={`modal-tab ${tab === 'shortcuts' ? 'active' : ''}`} onClick={() => setTab('shortcuts')}>
            Keyboard Shortcuts
          </button>
        </div>

        <div className="modal-body">
          {tab === 'prompt' && (
            <div className="prompt-editor">
              <p className="prompt-desc">Customize how Claude behaves. This is sent as a system message with every request.</p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="You are a helpful assistant..."
                rows={8}
              />
              <div className="prompt-actions">
                <button className="prompt-reset" onClick={() => setPrompt('')}>Reset to default</button>
                <button className="prompt-save" onClick={handleSave}>Save</button>
              </div>
            </div>
          )}

          {tab === 'shortcuts' && (
            <div className="shortcuts-list">
              {SHORTCUTS.map((s, i) => (
                <div key={i} className="shortcut-item">
                  <span className="shortcut-desc">{s.desc}</span>
                  <kbd className="shortcut-keys">{s.keys}</kbd>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
