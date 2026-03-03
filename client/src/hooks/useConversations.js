import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'claude-chat-conversations';
const ACTIVE_ID_KEY = 'claude-chat-active-id';

function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function loadActiveId() {
  try {
    return localStorage.getItem(ACTIVE_ID_KEY) || null;
  } catch {
    return null;
  }
}

export function useConversations() {
  const [conversations, setConversations] = useState(loadFromStorage);
  const [activeConversationId, setActiveConversationId] = useState(loadActiveId);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // Save to localStorage whenever conversations change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  // Save active ID
  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem(ACTIVE_ID_KEY, activeConversationId);
    } else {
      localStorage.removeItem(ACTIVE_ID_KEY);
    }
  }, [activeConversationId]);

  const createConversation = useCallback(() => {
    const newConversation = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    return newConversation.id;
  }, []);

  const addMessage = useCallback((conversationId, message) => {
    setConversations(prev =>
      prev.map(c => {
        if (c.id !== conversationId) return c;
        const updatedMessages = [...c.messages, message];
        // Auto-title from first user message text
        let title = c.title;
        if (c.messages.length === 0 && message.role === 'user') {
          const text = typeof message.content === 'string'
            ? message.content
            : message.content.find(b => b.type === 'text')?.text || 'Image';
          title = text.slice(0, 40) + (text.length > 40 ? '...' : '');
        }
        return { ...c, messages: updatedMessages, title };
      })
    );
  }, []);

  const updateLastMessage = useCallback((conversationId, contentUpdate) => {
    setConversations(prev =>
      prev.map(c => {
        if (c.id !== conversationId) return c;
        const msgs = [...c.messages];
        const lastMsg = { ...msgs[msgs.length - 1] };
        lastMsg.content += contentUpdate;
        msgs[msgs.length - 1] = lastMsg;
        return { ...c, messages: msgs };
      })
    );
  }, []);

  const deleteConversation = useCallback((id) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  }, [activeConversationId]);

  return {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    addMessage,
    updateLastMessage,
    deleteConversation,
  };
}
