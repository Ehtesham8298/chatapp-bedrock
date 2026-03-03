const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { streamChatCompletion } = require('../services/bedrockService');

router.post('/chat', authMiddleware, async (req, res) => {
  const { messages, systemPrompt } = req.body;
  console.log('--- Chat request received ---');
  console.log('Messages count:', messages?.length);
  console.log('Model:', process.env.BEDROCK_MODEL_ID);

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // Set SSE headers (Express 4 style - writeHead flushes immediately)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Track client disconnect via response 'close' event
  // (req.on('close') fires prematurely in Express when body is consumed)
  let clientDisconnected = false;
  res.on('close', () => {
    console.log('Client disconnected');
    clientDisconnected = true;
  });

  try {
    console.log('Calling Bedrock...');
    await streamChatCompletion(
      messages,
      systemPrompt,
      (eventType, data) => {
        if (!clientDisconnected) {
          res.write(`event: ${eventType}\n`);
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        }
      }
    );

    console.log('Stream completed successfully');
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
