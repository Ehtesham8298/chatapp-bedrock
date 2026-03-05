import { useState, useEffect, useCallback } from 'react';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InputBox from './components/InputBox';
import Login from './components/Login';
import './App.css';

const MODELS = [
  { id: 'us.anthropic.claude-sonnet-4-6', name: 'Claude Sonnet 4.6', tag: 'Smart' },
  { id: 'us.anthropic.claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', tag: 'Fast' },
];

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
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);

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

  // Close model dropdown on outside click
  useEffect(() => {
    if (!showModelDropdown) return;
    const handleClick = () => setShowModelDropdown(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showModelDropdown]);

  const {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    addMessage,
    updateLastMessage,
    deleteConversation,
    renameConversation,
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

  const handleSend = useCallback((text, attachments) => {
    sendMessage(text, attachments, {
      searchEnabled,
      modelId: selectedModel.id,
    });
  }, [sendMessage, searchEnabled, selectedModel]);

  const handleSuggestionClick = useCallback((text) => {
    handleSend(text, []);
  }, [handleSend]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, sidebarOpen]);

  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      {isMobile && sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={handleSelectConversation}
        onNew={handleNewChat}
        onDelete={deleteConversation}
        onRename={renameConversation}
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
          <div className="model-selector" onClick={(e) => { e.stopPropagation(); setShowModelDropdown(!showModelDropdown); }}>
            <span className="model-dot"></span>
            <span className="model-name">{selectedModel.name}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
            {showModelDropdown && (
              <div className="model-dropdown">
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    className={`model-option ${model.id === selectedModel.id ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setSelectedModel(model); setShowModelDropdown(false); }}
                  >
                    <div className="model-option-info">
                      <span className="model-option-name">{model.name}</span>
                      <span className="model-option-tag">{model.tag}</span>
                    </div>
                    {model.id === selectedModel.id && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <ChatArea
          messages={activeConversation?.messages || []}
          isStreaming={isStreaming}
          onSuggestionClick={handleSuggestionClick}
        />
        <InputBox
          onSend={handleSend}
          isStreaming={isStreaming}
          onStop={stopStreaming}
          searchEnabled={searchEnabled}
          onToggleSearch={() => setSearchEnabled(!searchEnabled)}
        />
      </main>
    </div>
  );
}

export default App;
