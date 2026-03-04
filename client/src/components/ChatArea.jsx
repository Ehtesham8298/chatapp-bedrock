import { useEffect, useRef, useState, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import './ChatArea.css';

const SUGGESTIONS = [
  { icon: '\u{1F4BB}', text: 'Help me write a Python script' },
  { icon: '\u{1F4DA}', text: 'Explain quantum computing simply' },
  { icon: '\u270D\uFE0F', text: 'Write a professional email' },
  { icon: '\u{1F4A1}', text: 'Brainstorm startup ideas' },
];

function ChatArea({ messages, isStreaming, onSuggestionClick }) {
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 150);
  }, []);

  if (messages.length === 0) {
    return (
      <div className="chat-area empty">
        <div className="empty-state">
          <div className="empty-icon">
            <div className="empty-icon-ring"></div>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 2a10 10 0 0110 10c0 5.523-4.477 10-10 10a9.956 9.956 0 01-4.708-1.175L2 22l1.176-5.29A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2z" />
              <path d="M8 12h.01M12 12h.01M16 12h.01" />
            </svg>
          </div>
          <h1>What can I help with?</h1>
          <p className="empty-subtitle">Ask me anything — coding, writing, analysis, or just chat</p>
          <div className="suggestion-grid">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                className="suggestion-card"
                onClick={() => onSuggestionClick?.(s.text)}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <span className="suggestion-icon">{s.icon}</span>
                <span>{s.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area" ref={scrollRef} onScroll={handleScroll}>
      <div className="messages-container">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === 'assistant'}
            onImageClick={setLightboxImg}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {showScrollBtn && (
        <button className="scroll-bottom-btn" onClick={scrollToBottom}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}

      {lightboxImg && (
        <div className="lightbox" onClick={() => setLightboxImg(null)}>
          <button className="lightbox-close" onClick={() => setLightboxImg(null)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img src={lightboxImg} alt="Full size" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

export default ChatArea;
