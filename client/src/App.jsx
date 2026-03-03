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
              &#9776;
            </button>
          )}
          <span className="model-name">Claude Opus 4.6</span>
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
