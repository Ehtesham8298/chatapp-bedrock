import { useState } from 'react';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InputBox from './components/InputBox';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    addMessage,
    updateLastMessage,
    deleteConversation,
  } = useConversations();

  const { sendMessage, isStreaming, stopStreaming } = useChat({
    activeConversation,
    addMessage,
    updateLastMessage,
    createConversation,
  });

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={setActiveConversationId}
        onNew={createConversation}
        onDelete={deleteConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
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
