import { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { useToast } from './Toast';
import './MessageBubble.css';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({ role, content, isStreaming, onImageClick, timestamp }) {
  const [copied, setCopied] = useState(false);
  const addToast = useToast();

  const isMultimodal = Array.isArray(content);
  const textContent = isMultimodal
    ? content.find(b => b.type === 'text')?.text || ''
    : content;
  const images = isMultimodal
    ? content.filter(b => b.type === 'image')
    : [];

  const handleCopy = () => {
    const text = typeof content === 'string' ? content : textContent;
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast?.('Copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`message ${role}`}>
      <div className={`message-avatar ${role}`}>
        {role === 'user' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        )}
      </div>
      <div className="message-body">
        <div className="message-role-label">
          <span>{role === 'user' ? 'You' : 'Claude'}</span>
          {timestamp && <span className="message-time">{formatTime(timestamp)}</span>}
        </div>
        <div className="message-content">
          {role === 'assistant' ? (
            <>
              <MarkdownRenderer content={content} />
              {isStreaming && content.length === 0 && (
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              )}
              {isStreaming && content.length > 0 && (
                <span className="cursor-blink">|</span>
              )}
            </>
          ) : (
            <>
              {images.length > 0 && (
                <div className="message-images">
                  {images.map((img, i) => (
                    <img
                      key={i}
                      src={img.preview}
                      alt="Uploaded"
                      className="message-image"
                      onClick={() => onImageClick?.(img.preview)}
                    />
                  ))}
                </div>
              )}
              {textContent && <p>{textContent}</p>}
            </>
          )}
        </div>
        {role === 'assistant' && content && content.length > 0 && !isStreaming && (
          <div className="message-actions">
            <button className={`action-btn ${copied ? 'copied' : ''}`} onClick={handleCopy} title={copied ? 'Copied!' : 'Copy'}>
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="action-label">Copied</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  <span className="action-label">Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
