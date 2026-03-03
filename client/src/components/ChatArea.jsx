import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import './ChatArea.css';

function ChatArea({ messages, isStreaming }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="chat-area empty">
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <path d="M12 2a10 10 0 0110 10c0 5.523-4.477 10-10 10a9.956 9.956 0 01-4.708-1.175L2 22l1.176-5.29A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2z" />
              <path d="M8 12h.01M12 12h.01M16 12h.01" />
            </svg>
          </div>
          <h1>What can I help with?</h1>
          <p className="empty-subtitle">Ask me anything - coding, writing, analysis, or just chat</p>
          <div className="suggestion-grid">
            <div className="suggestion-card">
              <span className="suggestion-icon">&#128187;</span>
              <span>Help me write code</span>
            </div>
            <div className="suggestion-card">
              <span className="suggestion-icon">&#128218;</span>
              <span>Explain a concept</span>
            </div>
            <div className="suggestion-card">
              <span className="suggestion-icon">&#9997;&#65039;</span>
              <span>Help me write</span>
            </div>
            <div className="suggestion-card">
              <span className="suggestion-icon">&#128161;</span>
              <span>Brainstorm ideas</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <div className="messages-container">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === 'assistant'}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default ChatArea;
