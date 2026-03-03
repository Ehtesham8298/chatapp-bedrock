import { useState, useRef } from 'react';
import './InputBox.css';

function InputBox({ onSend, isStreaming, onStop }) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if ((!trimmed && attachments.length === 0) || isStreaming) return;
    onSend(trimmed, attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments(prev => [...prev, {
          type: 'image',
          name: file.name,
          mediaType: file.type,
          base64: reader.result.split(',')[1],
          preview: reader.result,
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="input-box-container">
      <div className={`input-wrapper ${isFocused ? 'focused' : ''}`}>
        {attachments.length > 0 && (
          <div className="attachments-preview">
            {attachments.map((att, i) => (
              <div key={i} className="attachment-item">
                <img src={att.preview} alt={att.name} />
                <button className="remove-attachment" onClick={() => removeAttachment(i)}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="input-box">
          <button className="attach-btn" onClick={() => fileInputRef.current?.click()} title="Attach image">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleFileSelect}
          />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Message Claude..."
            rows={1}
          />
          {isStreaming ? (
            <button className="stop-btn" onClick={onStop} title="Stop generating">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <rect x="3" y="3" width="10" height="10" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              className="send-btn"
              onClick={handleSubmit}
              disabled={!input.trim() && attachments.length === 0}
              title="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <p className="input-footer">Claude can make mistakes. Please verify important information.</p>
    </div>
  );
}

export default InputBox;
