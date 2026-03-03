require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { streamChatCompletion } = require('./services/bedrockService');

const app = express();
app.use(cors());
app.use(express.json());

// Simple test endpoint - no auth, no router
app.post('/api/chat', async (req, res) => {
  console.log('Route handler called!');
  console.log('Body:', JSON.stringify(req.body));

  const { messages } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.status(200);
  res.flushHeaders();

  console.log('Headers flushed, calling Bedrock...');

  try {
    await streamChatCompletion(
      messages,
      'Be brief',
      (eventType, data) => {
        const chunk = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
        console.log('Sending chunk:', eventType);
        res.write(chunk);
      },
      null
    );
    console.log('Done!');
    res.write('event: done\ndata: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('ERROR:', error.name, error.message);
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

app.listen(3001, () => console.log('Test server on :3001'));
