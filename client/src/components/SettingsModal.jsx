import { useState } from 'react';
import './SettingsModal.css';

const PRESETS = [
  {
    icon: '🧑‍💻',
    label: 'Coding Expert',
    prompt: 'You are an expert software engineer. Give clean, efficient, well-commented code. Explain your approach briefly. Prefer modern best practices and point out potential issues.',
  },
  {
    icon: '✍️',
    label: 'Creative Writer',
    prompt: 'You are a creative writing assistant. Help craft engaging stories, poems, and content with vivid language. Be imaginative and suggest interesting narrative directions.',
  },
  {
    icon: '🎓',
    label: 'Patient Teacher',
    prompt: 'You are a patient, clear teacher. Break down complex topics into simple steps with real-world examples. Check understanding and encourage questions.',
  },
  {
    icon: '📊',
    label: 'Data Analyst',
    prompt: 'You are a data analyst expert. Help interpret data, suggest analysis approaches, explain statistics clearly, and recommend visualizations. Be precise and evidence-based.',
  },
  {
    icon: '💼',
    label: 'Business Pro',
    prompt: 'You are a professional business consultant. Give concise, actionable advice. Use structured responses with bullet points. Focus on practical outcomes and ROI.',
  },
  {
    icon: '🌐',
    label: 'Translator',
    prompt: 'You are an expert multilingual translator. Translate accurately while preserving tone and nuance. If asked to translate, do it directly without extra commentary.',
  },
];

const SHORTCUTS = [
  { keys: 'Enter', desc: 'Send message', icon: '↵' },
  { keys: 'Shift + Enter', desc: 'New line in message', icon: '⇧↵' },
  { keys: 'Ctrl + K', desc: 'New conversation', icon: '⌘K' },
  { keys: 'Esc', desc: 'Close sidebar / modal', icon: '⎋' },
];

function SettingsModal({ isOpen, onClose, systemPrompt, onSavePrompt }) {
  const [tab, setTab] = useState('prompt');
  const [prompt, setPrompt] = useState(systemPrompt || '');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSavePrompt(prompt);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };

  const applyPreset = (preset) => {
    setPrompt(preset.prompt);
  };

  const charCount = prompt.length;
  const charLimit = 1000;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-header-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
              </svg>
            </div>
            <h2>Settings</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button className={`modal-tab ${tab === 'prompt' ? 'active' : ''}`} onClick={() => setTab('prompt')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            System Prompt
          </button>
          <button className={`modal-tab ${tab === 'shortcuts' ? 'active' : ''}`} onClick={() => setTab('shortcuts')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h8"/>
            </svg>
            Shortcuts
          </button>
        </div>

        <div className="modal-body">
          {tab === 'prompt' && (
            <div className="prompt-editor">

              {/* Preset cards */}
              <p className="section-label">Quick Presets</p>
              <div className="preset-grid">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    className={`preset-card ${prompt === p.prompt ? 'active' : ''}`}
                    onClick={() => applyPreset(p)}
                    title={p.prompt}
                  >
                    <span className="preset-icon">{p.icon}</span>
                    <span className="preset-label">{p.label}</span>
                  </button>
                ))}
              </div>

              {/* Custom textarea */}
              <div className="prompt-field-header">
                <p className="section-label">Custom Prompt</p>
                <span className={`char-counter ${charCount > charLimit * 0.9 ? 'warn' : ''}`}>
                  {charCount}/{charLimit}
                </span>
              </div>
              <div className="prompt-textarea-wrap">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, charLimit))}
                  placeholder="Describe how Claude should behave — its tone, expertise, focus area, or any specific instructions..."
                  rows={5}
                />
                {prompt && (
                  <button className="clear-prompt-btn" onClick={() => setPrompt('')} title="Clear">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>

              <div className="prompt-actions">
                <button className="prompt-reset" onClick={() => setPrompt('')} disabled={!prompt}>
                  Clear
                </button>
                <button className={`prompt-save ${saved ? 'saved' : ''}`} onClick={handleSave}>
                  {saved ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Saved!
                    </>
                  ) : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {tab === 'shortcuts' && (
            <div className="shortcuts-list">
              <p className="prompt-desc">Keyboard shortcuts to work faster</p>
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
