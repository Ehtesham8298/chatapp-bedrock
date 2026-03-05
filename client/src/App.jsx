import { useState, useEffect, useCallback } from 'react';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InputBox from './components/InputBox';
import Login from './components/Login';
import SettingsModal from './components/SettingsModal';
import { useToast } from './components/Toast';
import './App.css';

const MODELS = [
  { id: 'us.anthropic.claude-sonnet-4-6', name: 'Claude Sonnet 4.6', tag: 'Smart' },
  { id: 'us.anthropic.claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', tag: 'Fast' },
];

const DEFAULT_SYSTEM_PROMPT = 'You are Claude by Anthropic, running via AWS Bedrock. Be helpful, respond clearly and concisely. Use markdown formatting when appropriate.';

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
  const [showSettings, setShowSettings] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    () => localStorage.getItem('systemPrompt') || ''
  );
  const addToast = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setAuthLoading(false); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setUser(data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => { setSidebarOpen(!isMobile); }, [isMobile]);

  useEffect(() => {
    if (!showModelDropdown) return;
    const handleClick = () => setShowModelDropdown(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showModelDropdown]);

  const {
    conversations, activeConversation, activeConversationId,
    setActiveConversationId, createConversation, addMessage,
    updateLastMessage, deleteConversation, renameConversation,
    saveConversation, removeLastMessages,
  } = useConversations(!!user);

  const { sendMessage, isStreaming, stopStreaming } = useChat({
    activeConversation, addMessage, updateLastMessage, createConversation, saveConversation,
  });

  const handleSelectConversation = useCallback((id) => {
    setActiveConversationId(id);
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, setActiveConversationId]);

  const handleNewChat = useCallback(() => {
    createConversation();
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, createConversation]);

  const handleLogin = useCallback((userData) => setUser(userData), []);
  const handleLogout = useCallback(() => { localStorage.removeItem('token'); setUser(null); }, []);

  const handleSend = useCallback((text, attachments) => {
    sendMessage(text, attachments, {
      searchEnabled,
      modelId: selectedModel.id,
      systemPrompt: systemPrompt || DEFAULT_SYSTEM_PROMPT,
    });
  }, [sendMessage, searchEnabled, selectedModel, systemPrompt]);

  const handleSuggestionClick = useCallback((text) => handleSend(text, []), [handleSend]);

  // Regenerate last response
  const handleRegenerate = useCallback(() => {
    if (!activeConversation || isStreaming) return;
    const msgs = activeConversation.messages;
    if (msgs.length < 2) return;
    const lastUserMsg = msgs[msgs.length - 2];
    if (lastUserMsg.role !== 'user') return;

    removeLastMessages(activeConversation.id, 2);
    const text = typeof lastUserMsg.content === 'string'
      ? lastUserMsg.content
      : lastUserMsg.content.find(b => b.type === 'text')?.text || '';

    setTimeout(() => {
      sendMessage(text, [], {
        searchEnabled, modelId: selectedModel.id,
        systemPrompt: systemPrompt || DEFAULT_SYSTEM_PROMPT,
      });
    }, 100);
  }, [activeConversation, isStreaming, removeLastMessages, sendMessage, searchEnabled, selectedModel, systemPrompt]);

  // Export chat as markdown
  const handleExportChat = useCallback(() => {
    if (!activeConversation?.messages?.length) return;
    const lines = activeConversation.messages.map(msg => {
      const role = msg.role === 'user' ? '## You' : '## Claude';
      const text = typeof msg.content === 'string'
        ? msg.content
        : msg.content.find(b => b.type === 'text')?.text || '[Image]';
      return `${role}\n\n${text}`;
    });
    const markdown = `# Chat Export\n\n${lines.join('\n\n---\n\n')}`;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    addToast?.('Chat exported as markdown', 'success');
  }, [activeConversation, addToast]);

  const handleSavePrompt = useCallback((prompt) => {
    setSystemPrompt(prompt);
    localStorage.setItem('systemPrompt', prompt);
    addToast?.('System prompt saved', 'success');
  }, [addToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showSettings) setShowSettings(false);
        else if (isMobile && sidebarOpen) setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, sidebarOpen, showSettings]);

  if (authLoading) {
    return (<div className="auth-loading"><div className="auth-spinner"></div></div>);
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
        conversations={conversations} activeId={activeConversationId}
        onSelect={handleSelectConversation} onNew={handleNewChat}
        onDelete={deleteConversation} onRename={renameConversation}
        isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)}
        username={user.username} onLogout={handleLogout}
      />
      <main className="main">
        <div className="main-header">
          {!sidebarOpen && (
            <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
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
                  <button key={model.id} className={`model-option ${model.id === selectedModel.id ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setSelectedModel(model); setShowModelDropdown(false); }}>
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
          <div className="header-actions">
            <button className="header-btn" onClick={() => setShowSettings(true)} title="Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>
        <ChatArea
          messages={activeConversation?.messages || []} isStreaming={isStreaming}
          onSuggestionClick={handleSuggestionClick} onRegenerate={handleRegenerate}
          onExportChat={handleExportChat}
        />
        <InputBox
          onSend={handleSend} isStreaming={isStreaming} onStop={stopStreaming}
          searchEnabled={searchEnabled} onToggleSearch={() => setSearchEnabled(!searchEnabled)}
        />
      </main>
      <SettingsModal
        isOpen={showSettings} onClose={() => setShowSettings(false)}
        systemPrompt={systemPrompt} onSavePrompt={handleSavePrompt}
      />
    </div>
  );
}

export default App;
