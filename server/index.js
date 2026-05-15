require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// Ensure data directories exist
const dataDir = path.join(__dirname, 'data');
const chatsDir = path.join(dataDir, 'chats');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(chatsDir)) fs.mkdirSync(chatsDir);
if (!fs.existsSync(path.join(dataDir, 'users.json'))) {
  fs.writeFileSync(path.join(dataDir, 'users.json'), '[]');
}
const chatRouter = require('./routes/chat');
const authRouter = require('./routes/auth');
const conversationsRouter = require('./routes/conversations');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS only needed in development (production serves from same origin)
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));
}

app.use(express.json({ limit: '20mb' }));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api', chatRouter);

// Serve React build in production
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
