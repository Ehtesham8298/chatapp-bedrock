import { useState, useRef } from 'react';
import { parsePDF } from '../utils/api';
import './InputBox.css';

function InputBox({ onSend, isStreaming, onStop, searchEnabled, onToggleSearch }) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
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

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);

    for (const file of files) {
      if (file.type === 'application/pdf') {
        // Handle PDF
        setPdfLoading(true);
        try {
          const reader = new FileReader();
          const base64 = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
          });

          const result = await parsePDF(base64);
          setAttachments(prev => [...prev, {
            type: 'pdf',
            name: file.name,
            pdfText: result.text,
            pages: result.pages,
          }]);
        } catch (err) {
          console.error('PDF parse failed:', err);
        } finally {
          setPdfLoading(false);
        }
      } else if (file.type.startsWith('image/')) {
        // Handle image
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
      }
    }
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
              <div key={i} className={`attachment-item ${att.type === 'pdf' ? 'pdf-item' : ''}`}>
                {att.type === 'pdf' ? (
                  <div className="pdf-preview">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    <span className="pdf-name">{att.name}</span>
                    <span className="pdf-pages">{att.pages}p</span>
                  </div>
                ) : (
                  <img src={att.preview} alt={att.name} />
                )}
                <button className="remove-attachment" onClick={() => removeAttachment(i)}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
            {pdfLoading && (
              <div className="attachment-item pdf-item">
                <div className="pdf-preview loading">
                  <div className="pdf-spinner"></div>
                  <span className="pdf-name">Parsing PDF...</span>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="input-box">
          <button className="attach-btn" onClick={() => fileInputRef.current?.click()} title="Attach file">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
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
      <div className="input-toolbar">
        <button
          className={`toolbar-btn ${searchEnabled ? 'active' : ''}`}
          onClick={onToggleSearch}
          title="Web search"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
          Search
        </button>
        <span className="toolbar-divider"></span>
        <span className="input-footer">Claude can make mistakes. Verify important info.</span>
      </div>
    </div>
  );
}

export default InputBox;
