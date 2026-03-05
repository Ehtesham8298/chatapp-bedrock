import { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  fetchConversations,
  fetchConversation,
  createConversationAPI,
  updateConversationAPI,
  deleteConversationAPI,
} from '../utils/api';

export function useConversations(isLoggedIn) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [loadedMessages, setLoadedMessages] = useState({});
  const saveTimerRef = useRef(null);

  const activeConversation = activeConversationId
    ? {
        ...conversations.find(c => c.id === activeConversationId),
        messages: loadedMessages[activeConversationId] || [],
      }
    : null;

  // Load conversation list from server on login
  useEffect(() => {
    if (!isLoggedIn) {
      setConversations([]);
      setActiveConversationId(null);
      setLoadedMessages({});
      return;
    }
    fetchConversations()
      .then(data => setConversations(data))
      .catch(err => console.error('Failed to load conversations:', err));
  }, [isLoggedIn]);

  // Load messages when switching conversations
  useEffect(() => {
    if (!activeConversationId || !isLoggedIn) return;
    if (loadedMessages[activeConversationId]) return; // already loaded

    fetchConversation(activeConversationId)
      .then(data => {
        setLoadedMessages(prev => ({ ...prev, [activeConversationId]: data.messages || [] }));
      })
      .catch(err => console.error('Failed to load messages:', err));
  }, [activeConversationId, isLoggedIn, loadedMessages]);

  // Debounced save to server
  const saveToServer = useCallback((convId, messages, title) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const data = {};
      if (messages !== undefined) data.messages = messages;
      if (title !== undefined) data.title = title;
      updateConversationAPI(convId, data).catch(err =>
        console.error('Failed to save conversation:', err)
      );
    }, 500);
  }, []);

  const createConversation = useCallback(() => {
    const id = uuidv4();
    const newConv = { id, title: 'New Chat', createdAt: Date.now() };
    setConversations(prev => [newConv, ...prev]);
    setLoadedMessages(prev => ({ ...prev, [id]: [] }));
    setActiveConversationId(id);

    // Save to server
    createConversationAPI(id, 'New Chat').catch(err =>
      console.error('Failed to create conversation on server:', err)
    );

    return id;
  }, []);

  const addMessage = useCallback((conversationId, message) => {
    setLoadedMessages(prev => {
      const msgs = [...(prev[conversationId] || []), message];
      return { ...prev, [conversationId]: msgs };
    });

    // Auto-title from first user message
    setConversations(prev =>
      prev.map(c => {
        if (c.id !== conversationId) return c;
        const currentMsgs = loadedMessages[conversationId] || [];
        if (currentMsgs.length === 0 && message.role === 'user') {
          const text = typeof message.content === 'string'
            ? message.content
            : message.content.find(b => b.type === 'text')?.text || 'Image';
          const title = text.slice(0, 40) + (text.length > 40 ? '...' : '');
          return { ...c, title };
        }
        return c;
      })
    );
  }, [loadedMessages]);

  const updateLastMessage = useCallback((conversationId, contentUpdate) => {
    setLoadedMessages(prev => {
      const msgs = [...(prev[conversationId] || [])];
      if (msgs.length === 0) return prev;
      const lastMsg = { ...msgs[msgs.length - 1] };
      lastMsg.content += contentUpdate;
      msgs[msgs.length - 1] = lastMsg;

      // Debounced save to server
      saveToServer(conversationId, msgs);

      return { ...prev, [conversationId]: msgs };
    });
  }, [saveToServer]);

  // Save full state after streaming is done (called from useChat onComplete)
  const saveConversation = useCallback((conversationId) => {
    const msgs = loadedMessages[conversationId];
    const conv = conversations.find(c => c.id === conversationId);
    if (msgs && conv) {
      updateConversationAPI(conversationId, { messages: msgs, title: conv.title }).catch(err =>
        console.error('Failed to save conversation:', err)
      );
    }
  }, [loadedMessages, conversations]);

  const renameConversation = useCallback((id, newTitle) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
    updateConversationAPI(id, { title: newTitle }).catch(err =>
      console.error('Failed to rename conversation:', err)
    );
  }, []);

  const deleteConversation = useCallback((id) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    setLoadedMessages(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
    deleteConversationAPI(id).catch(err =>
      console.error('Failed to delete conversation on server:', err)
    );
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
    renameConversation,
    saveConversation,
  };
}
