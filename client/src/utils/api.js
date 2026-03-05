function getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return { 'x-api-key': import.meta.env.VITE_API_KEY };
}

export async function streamChat(messages, { onToken, onComplete, onError, signal, searchEnabled, modelId, systemPrompt }) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      messages,
      systemPrompt: systemPrompt || 'You are Claude by Anthropic, running via AWS Bedrock. Be helpful, respond clearly and concisely. Use markdown formatting when appropriate.',
      searchEnabled: searchEnabled || false,
      modelId: modelId || undefined,
    }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop();

      let eventType = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);

          if (eventType === 'done') {
            onComplete?.();
            return;
          }

          if (eventType === 'error') {
            const errorData = JSON.parse(dataStr);
            onError?.(new Error(errorData.error));
            return;
          }

          if (eventType === 'content_block_delta') {
            const data = JSON.parse(dataStr);
            if (data.delta?.type === 'text_delta') {
              onToken?.(data.delta.text);
            }
          }
        } else if (line.trim() === '') {
          eventType = '';
        }
      }
    }
    onComplete?.();
  } catch (err) {
    if (err.name !== 'AbortError') {
      onError?.(err);
    }
  }
}

// Parse PDF
export async function parsePDF(base64) {
  const res = await fetch('/api/parse-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ base64 }),
  });
  if (!res.ok) throw new Error('Failed to parse PDF');
  return res.json();
}

// Conversation API calls
export async function fetchConversations() {
  const res = await fetch('/api/conversations', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

export async function fetchConversation(id) {
  const res = await fetch(`/api/conversations/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch conversation');
  return res.json();
}

export async function createConversationAPI(id, title) {
  const res = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ id, title }),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json();
}

export async function updateConversationAPI(id, data) {
  const res = await fetch(`/api/conversations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update conversation');
  return res.json();
}

export async function deleteConversationAPI(id) {
  const res = await fetch(`/api/conversations/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete conversation');
  return res.json();
}
