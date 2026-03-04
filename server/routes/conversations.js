const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const CHATS_DIR = path.join(__dirname, '..', 'data', 'chats');

// JWT auth middleware
function jwtAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function getUserChatsFile(userId) {
  return path.join(CHATS_DIR, `${userId}.json`);
}

function readChats(userId) {
  try {
    const file = getUserChatsFile(userId);
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, '[]');
      return [];
    }
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return [];
  }
}

function writeChats(userId, chats) {
  fs.writeFileSync(getUserChatsFile(userId), JSON.stringify(chats));
}

// Get all conversations (without full messages - just id, title, createdAt)
router.get('/', jwtAuth, (req, res) => {
  const chats = readChats(req.userId);
  const summary = chats.map(c => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt,
  }));
  res.json(summary);
});

// Get single conversation with messages
router.get('/:id', jwtAuth, (req, res) => {
  const chats = readChats(req.userId);
  const chat = chats.find(c => c.id === req.params.id);
  if (!chat) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  res.json(chat);
});

// Create conversation
router.post('/', jwtAuth, (req, res) => {
  const { id, title } = req.body;
  const chats = readChats(req.userId);
  const newChat = {
    id,
    title: title || 'New Chat',
    messages: [],
    createdAt: Date.now(),
  };
  chats.unshift(newChat);
  writeChats(req.userId, chats);
  res.json(newChat);
});

// Update conversation (save messages, update title)
router.put('/:id', jwtAuth, (req, res) => {
  const { messages, title } = req.body;
  const chats = readChats(req.userId);
  const index = chats.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  if (messages !== undefined) chats[index].messages = messages;
  if (title !== undefined) chats[index].title = title;
  writeChats(req.userId, chats);
  res.json(chats[index]);
});

// Delete conversation
router.delete('/:id', jwtAuth, (req, res) => {
  const chats = readChats(req.userId);
  const filtered = chats.filter(c => c.id !== req.params.id);
  if (filtered.length === chats.length) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  writeChats(req.userId, filtered);
  res.json({ success: true });
});

module.exports = router;
