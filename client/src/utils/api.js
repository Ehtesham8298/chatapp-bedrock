export async function streamChat(messages, { onToken, onComplete, onError, signal }) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_API_KEY,
    },
    body: JSON.stringify({
      messages,
      systemPrompt: 'You are Claude Sonnet 4.6 by Anthropic, running via AWS Bedrock. When asked about your version or model, always say you are Claude Sonnet 4.6. Be helpful, respond clearly and concisely. Use markdown formatting when appropriate.',
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
