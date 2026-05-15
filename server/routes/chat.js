const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { streamChatCompletion } = require('../services/bedrockService');
const { webSearch, fetchUrl } = require('../services/searchService');
const { parsePDF } = require('../services/pdfService');

const URL_REGEX = /https?:\/\/[^\s"'<>()]+/gi;

// PDF parse endpoint
router.post('/parse-pdf', authMiddleware, async (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) return res.status(400).json({ error: 'base64 PDF data is required' });
    const result = await parsePDF(base64);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/chat', authMiddleware, async (req, res) => {
  const { messages, systemPrompt, searchEnabled, modelId } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const validMessages = messages.filter(m => {
    const c = m.content;
    if (!c) return false;
    if (typeof c === 'string') return c.trim() !== '';
    return Array.isArray(c) && c.length > 0;
  });

  if (validMessages.length === 0) {
    return res.status(400).json({ error: 'No valid messages' });
  }

  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  const lastUserText = lastUserMsg
    ? (typeof lastUserMsg.content === 'string'
        ? lastUserMsg.content
        : lastUserMsg.content.find(b => b.type === 'text')?.text || '')
    : '';

  let extraContext = '';

  // 1. Auto URL extraction — if user pasted a URL, fetch it
  const urlsInMessage = lastUserText.match(URL_REGEX) || [];
  if (urlsInMessage.length > 0) {
    const fetchPromises = urlsInMessage.slice(0, 2).map(url => fetchUrl(url));
    const pages = await Promise.all(fetchPromises);
    const pageContexts = pages
      .filter(Boolean)
      .map(p => `--- Content from ${p.url} ---\n${p.rawContent}`)
      .join('\n\n');
    if (pageContexts) {
      extraContext += `\n\nExtracted Web Page Content:\n${pageContexts}`;
    }
  }

  // 2. Web search — if enabled
  if (searchEnabled && lastUserText.trim()) {
    const searchResult = await webSearch(lastUserText);
    if (searchResult) {
      let searchBlock = `\n\nWeb Search Results for "${searchResult.query}":\n\n${searchResult.contextText}`;
      searchBlock += `\n\nInstructions: Use the search results above to give an accurate, up-to-date answer. Cite sources with [number] notation when referencing specific results.`;
      extraContext += searchBlock;
    }
  }

  const finalSystemPrompt = (systemPrompt || '') + extraContext;
  const selectedModel = modelId || process.env.BEDROCK_MODEL_ID;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  let clientDisconnected = false;
  res.on('close', () => { clientDisconnected = true; });

  try {
    await streamChatCompletion(
      validMessages,
      finalSystemPrompt,
      (eventType, data) => {
        if (!clientDisconnected) {
          res.write(`event: ${eventType}\n`);
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        }
      },
      selectedModel
    );

    if (!clientDisconnected) {
      res.write('event: done\n');
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } catch (error) {
    console.error('Stream error:', error.name, error.message);
    if (clientDisconnected) return;
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

module.exports = router;
