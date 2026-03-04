const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { streamChatCompletion } = require('../services/bedrockService');
const { webSearch } = require('../services/searchService');
const { parsePDF } = require('../services/pdfService');

// PDF parse endpoint
router.post('/parse-pdf', authMiddleware, async (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) {
      return res.status(400).json({ error: 'base64 PDF data is required' });
    }
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

  // If web search is enabled, search for the last user message
  let searchContext = '';
  if (searchEnabled) {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      const query = typeof lastUserMsg.content === 'string'
        ? lastUserMsg.content
        : lastUserMsg.content.find(b => b.type === 'text')?.text || '';

      if (query) {
        const searchResult = await webSearch(query);
        if (searchResult) {
          searchContext = `\n\nWeb Search Results for "${searchResult.query}":\n\n${searchResult.contextText}\n\nUse these search results to provide an accurate, up-to-date answer. Cite sources with [number] when referencing specific results.`;
        }
      }
    }
  }

  const finalSystemPrompt = (systemPrompt || '') + searchContext;
  const selectedModel = modelId || process.env.BEDROCK_MODEL_ID;

  // Set SSE headers
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
      messages,
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
