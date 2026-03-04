import { useState, useRef, useCallback } from 'react';
import { streamChat } from '../utils/api';
import { v4 as uuidv4 } from 'uuid';

// Build API content blocks from message content
function toApiContent(message) {
  // If content is a string (text only), return as-is
  if (typeof message.content === 'string') {
    return message.content;
  }
  // If content is array (multimodal), convert for Bedrock API
  return message.content.map(block => {
    if (block.type === 'image') {
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: block.mediaType,
          data: block.base64,
        },
      };
    }
    return block; // text blocks pass through
  });
}

export function useChat({ activeConversation, addMessage, updateLastMessage, createConversation, saveConversation }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef(null);

  const sendMessage = useCallback(async (text, attachments = []) => {
    let conversationId = activeConversation?.id;
    if (!conversationId) {
      conversationId = createConversation();
    }

    // Build user message content
    let content;
    if (attachments.length > 0) {
      content = [];
      attachments.forEach(att => {
        content.push({
          type: 'image',
          mediaType: att.mediaType,
          base64: att.base64,
          preview: att.preview,
        });
      });
      if (text) {
        content.push({ type: 'text', text });
      }
    } else {
      content = text;
    }

    const userMessage = { id: uuidv4(), role: 'user', content };
    addMessage(conversationId, userMessage);

    const assistantMessage = { id: uuidv4(), role: 'assistant', content: '' };
    addMessage(conversationId, assistantMessage);

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    // Build API messages (convert image blocks to Bedrock format)
    const apiMessages = [
      ...(activeConversation?.messages || []).map(m => ({
        role: m.role,
        content: toApiContent(m),
      })),
      { role: 'user', content: toApiContent({ content }) },
    ];

    try {
      await streamChat(apiMessages, {
        onToken: (token) => {
          updateLastMessage(conversationId, token);
        },
        onComplete: () => {
          setIsStreaming(false);
          saveConversation(conversationId);
        },
        onError: (error) => {
          console.error('Stream error:', error);
          updateLastMessage(conversationId, '\n\n*[Error: ' + error.message + ']*');
          setIsStreaming(false);
        },
        signal: abortControllerRef.current.signal,
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        updateLastMessage(conversationId, '\n\n*[Error: ' + error.message + ']*');
      }
      setIsStreaming(false);
    }
  }, [activeConversation, addMessage, updateLastMessage, createConversation]);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { sendMessage, isStreaming, stopStreaming };
}
