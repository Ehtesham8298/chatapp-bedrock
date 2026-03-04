import { useState, useEffect, useCallback } from 'react';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InputBox from './components/InputBox';
import Login from './components/Login';
import './App.css';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

function App() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthLoading(false);
      return;
    }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    addMessage,
    updateLastMessage,
    deleteConversation,
    saveConversation,
  } = useConversations(!!user);

  const { sendMessage, isStreaming, stopStreaming } = useChat({
    activeConversation,
    addMessage,
    updateLastMessage,
    createConversation,
    saveConversation,
  });

  const handleSelectConversation = useCallback((id) => {
    setActiveConversationId(id);
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, setActiveConversationId]);

  const handleNewChat = useCallback(() => {
    createConversation();
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, createConversation]);

  const handleLogin = useCallback((userData) => {
    setUser(userData);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const handleSuggestionClick = useCallback((text) => {
    sendMessage(text, []);
  }, [sendMessage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape to close sidebar on mobile
      if (e.key === 'Escape' && isMobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, sidebarOpen]);

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner"></div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={handleSelectConversation}
        onNew={handleNewChat}
        onDelete={deleteConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        username={user.username}
        onLogout={handleLogout}
      />
      <main className="main">
        <div className="main-header">
          {!sidebarOpen && (
            <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <div className="model-badge">
            <span className="model-dot"></span>
            <span className="model-name">Claude Sonnet 4.6</span>
          </div>
        </div>
        <ChatArea
          messages={activeConversation?.messages || []}
          isStreaming={isStreaming}
          onSuggestionClick={handleSuggestionClick}
        />
        <InputBox
          onSend={sendMessage}
          isStreaming={isStreaming}
          onStop={stopStreaming}
        />
      </main>
    </div>
  );
}

export default App;
